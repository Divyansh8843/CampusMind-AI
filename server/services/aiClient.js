import axios from "axios";

export const uploadDoc = (formData) =>
  axios.post((process.env.AI_SERVICE_URL || "http://localhost:8000") + "/upload", formData);
