import axios from "axios";

const API_BASE = process.env.API_BASE_URL || "http://127.0.0.1:3000";
const AI_BASE = process.env.AI_BASE_URL || "http://127.0.0.1:8000";
const STUDENT_TOKEN = process.env.SMOKE_STUDENT_TOKEN || "";
const ADMIN_TOKEN = process.env.SMOKE_ADMIN_TOKEN || "";

const results = [];

const headers = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const runCheck = async (name, fn) => {
  try {
    await fn();
    results.push({ name, status: "PASS" });
  } catch (err) {
    results.push({
      name,
      status: "FAIL",
      error: err.response?.data || err.message,
    });
  }
};

const requireToken = (token, label) => {
  if (!token) throw new Error(`${label} is required`);
};

await runCheck("API health", async () => {
  const r = await axios.get(`${API_BASE}/health`, { timeout: 8000 });
  if (r.status !== 200) throw new Error(`Unexpected status: ${r.status}`);
});

await runCheck("AI health", async () => {
  const r = await axios.get(`${AI_BASE}/health`, { timeout: 8000 });
  if (r.status !== 200) throw new Error(`Unexpected status: ${r.status}`);
});

await runCheck("Student chat endpoint", async () => {
  requireToken(STUDENT_TOKEN, "SMOKE_STUDENT_TOKEN");
  const r = await axios.post(
    `${API_BASE}/api/chat`,
    { message: "Give me a short DSA study tip.", type: "study" },
    { headers: headers(STUDENT_TOKEN), timeout: 15000 }
  );
  if (!r.data?.response) throw new Error("Missing chat response");
});

await runCheck("Support chatbot endpoint", async () => {
  requireToken(STUDENT_TOKEN, "SMOKE_STUDENT_TOKEN");
  const r = await axios.post(
    `${API_BASE}/api/chat`,
    { message: "Explain free and pro plans.", type: "support" },
    { headers: headers(STUDENT_TOKEN), timeout: 15000 }
  );
  if (!r.data?.response) throw new Error("Missing support response");
});

await runCheck("Hackathons endpoint", async () => {
  requireToken(STUDENT_TOKEN, "SMOKE_STUDENT_TOKEN");
  const r = await axios.get(`${API_BASE}/api/hackathons?limit=5`, {
    headers: headers(STUDENT_TOKEN),
    timeout: 20000,
  });
  if (!r.data?.success) throw new Error("Hackathons response not successful");
});

await runCheck("Jobs endpoint", async () => {
  requireToken(STUDENT_TOKEN, "SMOKE_STUDENT_TOKEN");
  const r = await axios.get(`${API_BASE}/api/jobs?limit=5`, {
    headers: headers(STUDENT_TOKEN),
    timeout: 15000,
  });
  if (!r.data?.success) throw new Error("Jobs response not successful");
});

await runCheck("Interview aptitude endpoint", async () => {
  requireToken(STUDENT_TOKEN, "SMOKE_STUDENT_TOKEN");
  const r = await axios.post(
    `${API_BASE}/api/interview/aptitude`,
    { topic: "Algorithms" },
    { headers: headers(STUDENT_TOKEN), timeout: 20000 }
  );
  if (!r.data) throw new Error("Missing aptitude response");
});

await runCheck("Admin AI health endpoint", async () => {
  requireToken(ADMIN_TOKEN, "SMOKE_ADMIN_TOKEN");
  const r = await axios.get(`${API_BASE}/api/meta/ai-health`, {
    headers: headers(ADMIN_TOKEN),
    timeout: 10000,
  });
  if (!r.data?.success) throw new Error("Admin AI health failed");
});

console.log("\n=== CampusMind Global Smoke Test Report ===");
for (const row of results) {
  const suffix = row.status === "PASS" ? "" : ` :: ${JSON.stringify(row.error)}`;
  console.log(`${row.status} - ${row.name}${suffix}`);
}

const hasFailure = results.some((x) => x.status === "FAIL");
if (hasFailure) {
  process.exitCode = 1;
}
