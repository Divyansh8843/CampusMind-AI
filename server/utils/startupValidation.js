export const getMongoUri = () =>
  process.env.MONGO_URI || process.env.MONGODB_URI || "";

export const validateStartupEnv = () => {
  const errors = [];
  const isProduction = process.env.NODE_ENV === "production";

  if (!getMongoUri()) {
    errors.push("MONGO_URI or MONGODB_URI is required");
  }
  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is required");
  } else if (isProduction && process.env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters in production");
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    errors.push("GOOGLE_CLIENT_ID is required");
  }
  if (!process.env.CLIENT_URL) {
    errors.push("CLIENT_URL is required for CORS");
  }
  if (isProduction && !process.env.INTERNAL_API_KEY) {
    errors.push("INTERNAL_API_KEY is required in production (secures AI microservice)");
  }
  if (isProduction && !process.env.AI_SERVICE_URL) {
    errors.push("AI_SERVICE_URL is required in production");
  }

  return errors;
};
