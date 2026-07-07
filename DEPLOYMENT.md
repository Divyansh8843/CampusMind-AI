# CampusMind AI Deployment Guide

This deployment plan avoids AWS for document storage and uses Cloudinary instead.

## Recommended stack

- Frontend: Vercel
- Backend API: Render or Railway
- AI service: Render or Railway
- Database: MongoDB Atlas
- Cache: Upstash Redis
- Document storage: Cloudinary

## Backend environment

Set these on the Express service:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `SERVER_PUBLIC_URL`
- `AI_SERVICE_URL`
- `REDIS_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

## AI service environment

Set these on the FastAPI service:

- `LLM_PROVIDER`
- `LLM_REQUEST_TIMEOUT_SECONDS`
- `LLM_MAX_RETRIES`
- `OPENROUTER_API_KEY` if using OpenRouter
- `OPENROUTER_API_BASE=https://openrouter.ai/api/v1`
- `OPENROUTER_MODEL` using a complete model slug such as `openai/gpt-oss-120b`
- `OPENROUTER_FALLBACK_MODELS` as an optional comma-separated fallback list
- `OPENAI_API_KEY` and `OPENAI_MODEL` if using OpenAI
- `OLLAMA_MODEL` if using Ollama
- `EMBEDDING_PROVIDER`
- `EMBEDDING_MODEL`
- `EMBEDDING_DEVICE`
- `REDIS_URL`

## Frontend environment

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID` if you use Google auth

## Deployment notes

- Deploy the AI service first and copy its public URL into `AI_SERVICE_URL` on the backend.
- Deploy the backend next and copy its public URL into `VITE_API_BASE_URL` on the frontend.
- Set `CLIENT_URL` on the backend to your frontend domain.
- Set `SERVER_PUBLIC_URL` on the backend to the backend domain so local-file fallback URLs stay valid.

## Launch checklist

1. `GET /health` on the backend returns `storageProvider`.
2. `GET /health` on the AI service returns `llm_ready: true`.
3. `GET /ready` on the AI service returns HTTP 200.
4. Upload a PDF from a student account.
5. Ask the chatbot a question from that uploaded PDF.
6. Test resume upload and interview feedback flows.
7. Delete a document and confirm old chunks no longer appear in study chat.

Do not use `:free` models for production traffic. OpenRouter documents strict daily
limits for free variants; use a paid model and at least one independent fallback
provider for a public launch.
