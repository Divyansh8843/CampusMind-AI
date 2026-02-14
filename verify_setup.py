
import os
import sys

def check(name, status, details=""):
    print(f"[{'✅ OK' if status else '❌ FAIL'}] {name} {details}")

print("\n🚀 CampusMind AI - Final System Verification")
print("============================================")

# 1. Check Directories
dirs = ["client", "server", "ai-service"]
for d in dirs:
    check(f"Directory: {d}", os.path.isdir(d))

# 2. Check Critical Files
files = [
    "server/.env",
    "client/.env",
    "ai-service/.env",
    "client/package.json",
    "ai-service/app/agents/resume_agent.py",
    "client/src/pages/Interview.jsx"
]
for f in files:
    check(f"File: {os.path.basename(f)}", os.path.exists(f))

print("\n📋 LAUNCH INSTRUCTIONS (Windows Path Safe):")
print("1. Cache:    redis-server")
print("2. AI:       cd ai-service && python -m app.main")
print("3. Server:   cd server && npm start")
print("4. Client:   cd client && npm run dev")
print("\nNOTE: We have updated 'npm run dev' to bypass the '&' symbol issue in your folder path.\n")
