import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { callAiService, getAiServiceUrl } from "../services/aiGateway.js";

test("returns env configured AI service URL", () => {
  process.env.AI_SERVICE_URL = "http://localhost:9123";
  assert.equal(getAiServiceUrl(), "http://localhost:9123");
});

test("returns default AI service URL when env missing", () => {
  delete process.env.AI_SERVICE_URL;
  assert.equal(getAiServiceUrl(), "http://127.0.0.1:8000");
});

test("retries a transient AI connection failure before succeeding", async () => {
  const originalPost = axios.post;
  let attempts = 0;

  axios.post = async () => {
    attempts += 1;
    if (attempts < 2) {
      const error = new Error("socket hang up");
      error.code = "ECONNRESET";
      throw error;
    }
    return { data: { response: "ok" } };
  };

  try {
    const response = await callAiService("/chat", { message: "hello" });
    assert.equal(response.data.response, "ok");
    assert.equal(attempts, 2);
  } finally {
    axios.post = originalPost;
  }
});
