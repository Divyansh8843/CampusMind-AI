import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let warnedOnce = false;

const client = createClient({
  url: redisUrl,
  socket: {
    tls: redisUrl.startsWith("rediss://"),
    rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== "false",
    connectTimeout: 5000,
    reconnectStrategy: (retries) => (retries >= 2 ? false : 500),
  },
});

client.on("error", (error) => {
  if (warnedOnce) return;
  warnedOnce = true;
  console.log(`Redis unavailable, caching disabled: ${error.message}`);
});

(async () => {
  try {
    await client.connect();
    console.log("Redis cache connected");
  } catch (error) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.log(`Redis connection failed, caching disabled: ${error.message}`);
    }
  }
})();

export default client;
