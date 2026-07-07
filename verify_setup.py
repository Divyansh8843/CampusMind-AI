from pathlib import Path


ROOT = Path(__file__).resolve().parent


def check(label, status):
    prefix = "OK" if status else "FAIL"
    print(f"[{prefix}] {label}")


print("\nCampusMind AI verification")
print("=" * 40)

for relative in ["client", "server", "ai-service"]:
    check(f"Directory: {relative}", (ROOT / relative).is_dir())

for relative in [
    "client/.env.example",
    "server/.env.example",
    "ai-service/.env.example",
    "server/server.js",
    "server/routes/upload.routes.js",
    "ai-service/app/api/upload.py",
    "ai-service/app/rag/ingest.py",
]:
    check(f"File: {relative}", (ROOT / relative).exists())

print("\nRun order")
print("1. cd ai-service && pip install -r requirements.txt && python -m app.main")
print("2. cd server && npm install && npm start")
print("3. cd client && npm install && npm run dev")
print("\nFor deployment, configure Cloudinary on the server and set the backend/frontend URLs in the env files.")
