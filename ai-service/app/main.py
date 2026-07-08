import os
import ipaddress
import warnings
from contextlib import asynccontextmanager
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.embeddings.embedding_model import get_embeddings
from app.api.chat import router as chat_router
from app.api.interview import router as interview_router
from app.api.mentorship import router as mentorship_router
from app.api.alumni_verification import router as alumni_verification_router
from app.api.resume import router as resume_router
from app.api.syllabus import router as syllabus_router
from app.api.upload import router as upload_router

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message=".*allowed_objects.*", category=UserWarning)
warnings.filterwarnings("ignore", message=".*default value of.*allowed_objects.*")
load_dotenv()

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
AI_REQUIRE_AUTH = os.getenv("AI_REQUIRE_AUTH", "true").lower() != "false"
PUBLIC_PATHS = {"/health", "/ready", "/openapi.json", "/docs", "/redoc"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("CampusMind AI Service started")
    print(f"Working directory: {os.getcwd()}")
    print("=" * 60)
    yield


app = FastAPI(
    title="CampusMind AI Service",
    description="LangChain-powered RAG and agentic AI runtime for CampusMind.",
    version="2.2.0",
    lifespan=lifespan,
)


@app.middleware("http")
async def verify_internal_key(request: Request, call_next):
    path = request.url.path.rstrip("/") or "/"
    if request.method == "HEAD" or path in PUBLIC_PATHS or path.startswith("/docs"):
        return await call_next(request)

    if not INTERNAL_API_KEY:
        if not AI_REQUIRE_AUTH or os.getenv("ENV", "development") != "production":
            return await call_next(request)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "AI service internal authentication is not configured"},
        )

    provided = request.headers.get("X-Internal-Key", "")
    if provided != INTERNAL_API_KEY:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Unauthorized AI service request"},
        )

    return await call_next(request)


if os.getenv("ENV", "development") == "production":

    @app.get("/test-embedding")
    def test_embedding_disabled():
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Not available in production"},
        )
else:

    @app.get("/test-embedding")
    def test_embedding():
        emb = get_embeddings()
        vec = emb.embed_query("hello world")
        return {
            "length": len(vec),
            "sample": vec[:5],
        }


@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    from app.rag.rag_chain import get_llm_configuration_status

    llm_status = get_llm_configuration_status()
    return {
        "status": "active",
        "service": "CampusMind AI Engine",
        "llm_ready": llm_status["ready"],
    }


@app.get("/ready")
def readiness_check():
    from app.rag.rag_chain import get_llm_configuration_status

    llm_status = get_llm_configuration_status()
    payload = {
        "status": "ready" if llm_status["ready"] else "not_ready",
        "llm_provider": llm_status["provider"],
        "llm_backends": llm_status["backends"],
        "error": llm_status["error"],
    }
    return JSONResponse(
        content=payload,
        status_code=status.HTTP_200_OK
        if llm_status["ready"]
        else status.HTTP_503_SERVICE_UNAVAILABLE,
    )


app.include_router(chat_router)
app.include_router(upload_router)
app.include_router(resume_router)
app.include_router(interview_router)
app.include_router(syllabus_router)
app.include_router(mentorship_router)
app.include_router(alumni_verification_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
