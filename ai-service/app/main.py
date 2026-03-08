from fastapi import FastAPI
from app.api.chat import router as chat_router
from app.api.upload import router as upload_router
from app.api.resume import router as resume_router
from app.api.interview import router as interview_router
from app.api.syllabus import router as syllabus_router
from app.api.mentorship import router as mentorship_router
from dotenv import load_dotenv
import os
import warnings

# Suppress HuggingFace warnings
warnings.filterwarnings("ignore", category=FutureWarning)

# Explicitly load .env from current directory
load_dotenv()

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n" + "="*60)
    print(f"🚀 CampusMind AI Service v2.1 Started Successfully!")
    print(f"📂 Running from: {os.getcwd()}")
    print("✅ Deprecation Warnings: FIXED (OllamaLLM used)")
    print("✅ Planner Agent: ACTIVE (Stand-alone via Chat)")
    print("✅ Study Chat: ACTIVE (Document RAG)")
    print("✅ Support Chat: ACTIVE (Website/Pricing Info)")
    print("✅ Scrapers: WeWorkRemotely, ArbeitNow, Unstop")
    print("ℹ️  PLEASE SCROLL TO THE BOTTOM OF YOUR TERMINAL TO SEE THIS")
    print("="*60 + "\n")
    yield

app = FastAPI(
    title="CampusMind AI Service",
    description="The intelligent microservice powering CampusMind's RAG and Agentic capabilities.",
    version="2.1.0",
    lifespan=lifespan
)
def health_check():
    return {
        "status": "active", 
        "service": "CampusMind AI Engine",
        "features": ["RAG", "Agentic AI", "Vector DB"]
    }

# Include Routers
app.include_router(chat_router)
app.include_router(upload_router)
app.include_router(resume_router)
app.include_router(interview_router)
app.include_router(syllabus_router)
app.include_router(mentorship_router)

if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 for scalability and containerization support
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


