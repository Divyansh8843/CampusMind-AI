from dotenv import load_dotenv
import os

load_dotenv()
from functools import lru_cache


@lru_cache(maxsize=1)
def _build_openai_embeddings():
    from langchain_openai import OpenAIEmbeddings
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not openai_key:
        raise RuntimeError("OPENAI_API_KEY is not configured for embeddings fallback.")
    return OpenAIEmbeddings(
        api_key=openai_key,
        model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
    )


@lru_cache(maxsize=1)
def _build_gemini_embeddings():
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    return GoogleGenerativeAIEmbeddings(
        model=os.getenv(
            "EMBEDDING_MODEL",
            "text-embedding-001"
        ),
        google_api_key=os.getenv("GEMINI_API_KEY"),
    )

@lru_cache(maxsize=1)
def _build_openrouter_embeddings():
    from langchain_openai import OpenAIEmbeddings

    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()

    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not configured."
        )

    return OpenAIEmbeddings(
        api_key=api_key,
        base_url=os.getenv(
            "OPENROUTER_BASE_URL",
            "https://openrouter.ai/api/v1"
        ),
        model=os.getenv(
            "EMBEDDING_MODEL",
            "nvidia/llama-nemotron-embed-vl-1b-v2:free"
        ),
    )

def get_embeddings():
    provider = os.getenv("EMBEDDING_PROVIDER", "auto").strip().lower()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    if provider == "auto":
        if openai_key:
            print("OPENAI_API_KEY detected. Defaulting embedding provider to 'openai'.")
            provider = "openai"
        else:
            provider = "openrouter"

    if provider == "openai":
        return _build_openai_embeddings()
    if provider == "gemini":
        return _build_gemini_embeddings()
    if provider == "openrouter":
        return _build_openrouter_embeddings()

    if provider != "local":
        raise RuntimeError( "EMBEDDING_PROVIDER must be "
    "'auto', 'local', 'openai', 'gemini', or 'openrouter'")

    # Defer heavy import to prevent PyTorch from loading when not using local embeddings
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
        model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2").strip()
        device = os.getenv("EMBEDDING_DEVICE", "cpu").strip()
        return HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={"device": device},
            encode_kwargs={"normalize_embeddings": True},
        )
    except Exception as exc:
        print(f"Local embedding model unavailable: {exc}")
        return _build_openai_embeddings()
    

