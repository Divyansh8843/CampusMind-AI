import axios from "axios";
import { getAiServiceUrl } from "./aiGateway.js";

export const uploadDoc = (formData) =>
  axios.post(`${getAiServiceUrl()}/upload`, formData);
