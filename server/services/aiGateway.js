import axios from "axios";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// ─── Configuration ────────────────────────────────────────────────────────────
const DEFAULT_AI_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || "45000", 10);
const MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || "2", 10);
const CIRCUIT_THRESHOLD = parseInt(process.env.AI_CIRCUIT_FAILURES || "3", 10);
const CIRCUIT_OPEN_MS = parseInt(process.env.AI_CIRCUIT_OPEN_MS || "15000", 10);

const AI_UNAVAILABLE_CODES = new Set([
  "AI_CIRCUIT_OPEN",
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

// ─── Circuit Breaker State ────────────────────────────────────────────────────
const circuitState = {
  failures: 0,
  openedAt: 0,
};

// ─── AI Process Manager ───────────────────────────────────────────────────────
let _aiProcess = null;
let _restartTimer = null;
let _aiProcessManagerEnabled = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the ai-service directory relative to this file: server/services → ../../ai-service
const AI_SERVICE_DIR = path.resolve(__dirname, "../../ai-service");

/**
 * Spawn the Python FastAPI AI service as a child process.
 * Uses the `myvenv` virtual environment inside ai-service/.
 */
const spawnAiProcess = () => {
  if (_aiProcess) return; // Already running

  const isWindows = process.platform === "win32";
  const pythonBin = isWindows
    ? path.join(AI_SERVICE_DIR, "myvenv", "Scripts", "python.exe")
    : path.join(AI_SERVICE_DIR, "myvenv", "bin", "python");

  const args = [
    "-m",
    "uvicorn",
    "app.main:app",
    "--host",
    "127.0.0.1",
    "--port",
    "8000",
    "--log-level",
    "warning",
  ];

  console.log(`[AI Manager] Starting AI service: ${pythonBin} ${args.join(" ")}`);

  _aiProcess = spawn(pythonBin, args, {
    cwd: AI_SERVICE_DIR,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  _aiProcess.stdout.on("data", (data) => {
    const line = data.toString().trim();
    if (line) console.log(`[AI Service] ${line}`);
  });

  _aiProcess.stderr.on("data", (data) => {
    const line = data.toString().trim();
    if (line) console.error(`[AI Service] ${line}`);
  });

  _aiProcess.on("exit", (code, signal) => {
    console.warn(`[AI Manager] AI service exited (code=${code}, signal=${signal})`);
    _aiProcess = null;

    if (!_aiProcessManagerEnabled) return;

    // Auto-restart after 3 seconds
    if (_restartTimer) clearTimeout(_restartTimer);
    _restartTimer = setTimeout(() => {
      console.log("[AI Manager] Auto-restarting AI service...");
      spawnAiProcess();
    }, 3000);
  });

  _aiProcess.on("error", (err) => {
    console.error(`[AI Manager] Failed to spawn AI process: ${err.message}`);
    _aiProcess = null;
  });
};

/**
 * Poll until the AI service health endpoint responds OK, then mark it ready.
 * Retries every 2 seconds for up to 60 seconds.
 */
const waitForAiReady = async (maxWaitMs = 60000) => {
  const start = Date.now();
  const baseUrl = getAiServiceUrl();

  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await axios.get(`${baseUrl}/health`, { timeout: 2000 });
      if (res.status === 200) {
        console.log("[AI Manager] AI service is ready ✓");
        // Reset circuit after successful startup
        circuitState.failures = 0;
        circuitState.openedAt = 0;
        return true;
      }
    } catch {
      // Not ready yet, keep polling
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.warn("[AI Manager] AI service did not become ready within 60s");
  return false;
};

/**
 * Initialize the AI process manager.
 * Call this once after MongoDB connects in server.js.
 *
 * Steps:
 *   1. Check if AI service is already running (e.g. started manually)
 *   2. If not running, spawn it automatically
 *   3. Enable the self-healing watcher
 */
export const initAiProcessManager = async () => {
  _aiProcessManagerEnabled = true;
  const baseUrl = getAiServiceUrl();

  // Check if already running
  try {
    const res = await axios.get(`${baseUrl}/health`, { timeout: 2000 });
    if (res.status === 200) {
      console.log("[AI Manager] AI service already running — skipping spawn.");
      return;
    }
  } catch {
    // Not running — need to start it
  }

  console.log("[AI Manager] AI service not detected — spawning automatically...");
  spawnAiProcess();
  await waitForAiReady(60000);
};

// ─── Core Gateway Utilities ───────────────────────────────────────────────────

export const getAiServiceUrl = () =>
  (process.env.AI_SERVICE_URL || DEFAULT_AI_URL).trim();

export const summarizeAiError = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Unknown AI error";

export const isAiUnavailableError = (error) => {
  const summary = summarizeAiError(error);
  const status = error?.response?.status;

  if (AI_UNAVAILABLE_CODES.has(error?.code)) return true;
  if (status === 502 || status === 503 || status === 504 || status === 429) return true;

  return /circuit open|connection refused|timeout|timed out|socket hang up|out of memory|cudaMalloc|llama runner process has terminated/i.test(
    summary,
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Exponential backoff with jitter: base * 2^attempt + random(0..base) */
const backoffMs = (attempt, base = 300) =>
  Math.min(base * Math.pow(2, attempt) + Math.random() * base, 8000);

const isCircuitOpen = () => {
  if (!circuitState.openedAt) return false;
  const elapsed = Date.now() - circuitState.openedAt;
  if (elapsed > CIRCUIT_OPEN_MS) {
    circuitState.openedAt = 0;
    circuitState.failures = 0;
    return false;
  }
  return true;
};

// ─── Main Call Function ───────────────────────────────────────────────────────

export const callAiService = async (path, payload, config = {}) => {
  if (isCircuitOpen()) {
    const err = new Error("AI service temporarily unavailable (circuit open).");
    err.code = "AI_CIRCUIT_OPEN";
    throw err;
  }

  const baseUrl = getAiServiceUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const internalKey = process.env.INTERNAL_API_KEY || "";
  const requestHeaders = {
    ...(internalKey ? { "X-Internal-Key": internalKey } : {}),
    ...(config.headers || {}),
  };

  let lastError = null;
  const MAX_HIBERNATE_RETRIES = 12; // Allow up to ~48 seconds for Render to wake up
  const maxLoopAttempts = Math.max(MAX_RETRIES, MAX_HIBERNATE_RETRIES);

  for (let attempt = 0; attempt <= maxLoopAttempts; attempt += 1) {
    try {
      const response = await axios.post(`${baseUrl}${normalizedPath}`, payload, {
        timeout: REQUEST_TIMEOUT_MS,
        ...config,
        headers: {
          ...(config.headers || {}),
          ...requestHeaders,
        },
      });
      // Success — reset circuit
      circuitState.failures = 0;
      circuitState.openedAt = 0;
      return response;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;

      const isRateLimit = status === 429;
      const isRenderHibernate = isRateLimit && error?.response?.headers?.["x-render-routing"] === "hibernate-rate-limited";
      const isFatal = status && status !== 429 && status < 500;
      const isRetryable = isAiUnavailableError(error) || !status || status >= 500 || isRateLimit;

      if (!isRetryable || isFatal) break;

      if (isRenderHibernate) {
        if (attempt >= MAX_HIBERNATE_RETRIES) break;
      } else {
        if (attempt >= MAX_RETRIES) break;
      }

      // 4s wait for Render hibernate wake up, otherwise standard backoff
      const waitMs = isRenderHibernate ? 4000 : (isRateLimit ? backoffMs(attempt, 200) : backoffMs(attempt, 400));
      console.warn(`[AI Gateway] Request failed (Status: ${status}). Retrying in ${waitMs}ms... (Attempt ${attempt + 1})`);
      await sleep(waitMs);
    }
  }

  // Increment circuit failure counter
  circuitState.failures += 1;
  if (circuitState.failures >= CIRCUIT_THRESHOLD) {
    circuitState.openedAt = Date.now();
    console.warn(
      `[AI Gateway] Circuit opened after ${circuitState.failures} failures. Resets in ${CIRCUIT_OPEN_MS / 1000}s.`,
    );

    // If AI process manager is enabled and AI process is running, try to restart
    if (_aiProcessManagerEnabled && lastError?.code === "ECONNREFUSED") {
      console.warn("[AI Manager] ECONNREFUSED — triggering AI service restart...");
      if (_aiProcess) {
        _aiProcess.kill();
        _aiProcess = null;
      }
      if (_restartTimer) clearTimeout(_restartTimer);
      _restartTimer = setTimeout(() => {
        console.log("[AI Manager] Restarting AI service after connection loss...");
        spawnAiProcess();
      }, 2000);
    }
  }
  throw lastError;
};
