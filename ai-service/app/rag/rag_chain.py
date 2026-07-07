import os
import threading
import time

from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

from app.config import LLMSettings, load_llm_settings
from app.embeddings.embedding_model import get_embeddings
from app.vectorstore.chroma_store import get_vectorstore

try:
    from langchain_ollama import OllamaLLM
except ImportError:
    OllamaLLM = None

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    ChatGoogleGenerativeAI = None

try:
    from langchain_groq import ChatGroq
except ImportError:
    ChatGroq = None


_llm = None
_llm_signature = None
_cache_initialized = False
_llm_lock = threading.RLock()


def _error_text(exc):
    return str(exc or "").strip()


def _status_code(exc):
    response = getattr(exc, "response", None)
    return getattr(exc, "status_code", None) or getattr(response, "status_code", None)


def _is_rate_limit_error(exc):
    """Returns True when the provider is throttling us (429, rate_limit)."""
    status = _status_code(exc)
    if status == 429:
        return True
    message = _error_text(exc).lower()
    return "rate limit" in message or "rate_limit" in message or "429" in message


def _is_backend_runtime_error(exc):
    message = _error_text(exc).lower()
    status = _status_code(exc)
    if status in {408, 409, 429} or (isinstance(status, int) and status >= 500):
        return True
    return any(
        token in message
        for token in [
            "cuda",
            "cudamalloc",
            "out of memory",
            "timed out",
            "timeout",
            "connection refused",
            "runner process has terminated",
            "failed to connect",
            "connection error",
            "rate limit",
            "429",
            "500",
            "502",
            "503",
            "504",
            "401",
            "403",
            "404",
            "not_found",
            "not found",
            "invalid_api_key",
            "incorrect api key",
        ]
    )


def _summarize_backend_error(exc):
    status = _status_code(exc)
    message = " ".join(_error_text(exc).split())
    if "<html" in message.lower() or "<!doctype" in message.lower():
        message = "provider returned an HTML response instead of API JSON"
    if len(message) > 300:
        message = f"{message[:297]}..."
    status_text = f" HTTP {status}" if status else ""
    return f"{type(exc).__name__}{status_text}: {message or 'unknown provider error'}"


class ResilientLLM:
    def __init__(self, specs, cooldown_seconds=30.0):
        self.specs = specs
        self.instances = {}
        self.cooldowns = {}
        self.preferred = 0
        self.cooldown_seconds = cooldown_seconds
        self.lock = threading.RLock()

    def _build(self, spec):
        backend_id = spec["id"]
        with self.lock:
            if backend_id in self.instances:
                return self.instances[backend_id]

        name = spec["name"]
        if name == "openai":
            instance = ChatOpenAI(
                model=spec["model"],
                temperature=0.2,
                timeout=spec["timeout"],
                max_retries=spec["max_retries"],
                api_key=spec["api_key"],
            )
        elif name == "openrouter":
            headers = {"X-OpenRouter-Title": spec["app_title"]}
            if spec.get("app_url"):
                headers["HTTP-Referer"] = spec["app_url"]
            instance = ChatOpenAI(
                model=spec["model"],
                temperature=0.1,
                timeout=spec["timeout"],
                max_retries=spec["max_retries"],
                api_key=spec["api_key"],
                base_url=spec["api_base"],
                default_headers=headers,
            )
        elif name == "gemini":
            if ChatGoogleGenerativeAI is None:
                raise RuntimeError("Gemini dependency missing: langchain-google-genai is not installed.")
            instance = ChatGoogleGenerativeAI(
                model=spec["model"],
                temperature=0.2,
                timeout=spec["timeout"],
                google_api_key=spec["api_key"],
            )
        elif name == "groq":
            if ChatGroq is None:
                raise RuntimeError("Groq dependency missing: langchain-groq is not installed.")
            instance = ChatGroq(
                model=spec["model"],
                temperature=0.2,
                timeout=spec["timeout"],
                max_retries=spec["max_retries"],
                api_key=spec["api_key"],
            )
        elif name == "ollama":
            if OllamaLLM is None:
                raise RuntimeError("Ollama dependency missing: langchain_ollama is not installed.")
            instance = OllamaLLM(
                model=spec["model"],
                temperature=0.1,
                timeout=spec["timeout"],
                base_url=spec["base_url"],
            )
        else:
            raise RuntimeError(f"Unknown LLM backend: {name}")

        with self.lock:
            self.instances[backend_id] = instance
        return instance

    def invoke(self, prompt):
        if not self.specs:
            raise RuntimeError("No AI backends are configured.")

        total = len(self.specs)
        last_error = None

        for offset in range(total):
            with self.lock:
                preferred = self.preferred
            index = (preferred + offset) % total
            spec = self.specs[index]
            backend_id = spec["id"]
            with self.lock:
                cooldown_until = self.cooldowns.get(backend_id, 0)
            now = time.time()
            if cooldown_until > now:
                continue

            try:
                response = self._build(spec).invoke(prompt)
                with self.lock:
                    self.preferred = index
                    self.cooldowns.pop(backend_id, None)
                return response
            except Exception as exc:
                last_error = exc
                runtime_error = _is_backend_runtime_error(exc)
                rate_limited = _is_rate_limit_error(exc)
                with self.lock:
                    if runtime_error and not rate_limited:
                        # Hard errors (OOM, 5xx, auth) get 4× cooldown and instance evicted
                        self.instances.pop(backend_id, None)
                        self.cooldowns[backend_id] = now + (self.cooldown_seconds * 4)
                    elif rate_limited:
                        # Soft 429 throttle: 1.5× cooldown, keep instance alive
                        self.cooldowns[backend_id] = now + (self.cooldown_seconds * 1.5)
                    else:
                        self.cooldowns[backend_id] = now + self.cooldown_seconds
                print(
                    f"LLM backend '{backend_id}' failed: {_summarize_backend_error(exc)}",
                    flush=True,
                )

        raise last_error or RuntimeError("No AI backend could process the request.")


def _build_llm_specs(settings: LLMSettings):
    specs = []

    def build_openrouter():
        if settings.openrouter_api_key:
            for model in settings.openrouter_models:
                specs.append(
                    {
                        "id": f"openrouter:{model}",
                        "name": "openrouter",
                        "model": model,
                        "api_key": settings.openrouter_api_key,
                        "api_base": settings.openrouter_api_base,
                        "app_url": settings.openrouter_app_url,
                        "app_title": settings.openrouter_app_title,
                        "timeout": settings.request_timeout_seconds,
                        "max_retries": settings.max_retries,
                    }
                )

    def build_openai():
        if settings.openai_api_key:
            specs.append(
                {
                    "id": f"openai:{settings.openai_model}",
                    "name": "openai",
                    "model": settings.openai_model,
                    "api_key": settings.openai_api_key,
                    "timeout": settings.request_timeout_seconds,
                    "max_retries": settings.max_retries,
                }
            )

    def build_groq():
        if settings.groq_api_key:
            specs.append(
                {
                    "id": f"groq:{settings.groq_model}",
                    "name": "groq",
                    "model": settings.groq_model,
                    "api_key": settings.groq_api_key,
                    "timeout": settings.request_timeout_seconds,
                    "max_retries": settings.max_retries,
                }
            )

    def build_gemini():
        if settings.gemini_api_key:
            specs.append(
                {
                    "id": f"gemini:{settings.gemini_model}",
                    "name": "gemini",
                    "model": settings.gemini_model,
                    "api_key": settings.gemini_api_key,
                    "timeout": settings.request_timeout_seconds,
                    "max_retries": settings.max_retries,
                }
            )

    def build_ollama():
        if settings.ollama_model:
            specs.append(
                {
                    "id": f"ollama:{settings.ollama_model}",
                    "name": "ollama",
                    "model": settings.ollama_model,
                    "base_url": settings.ollama_base_url,
                    "timeout": settings.request_timeout_seconds,
                    "max_retries": settings.max_retries,
                }
            )

    builders = {
        "openrouter": build_openrouter,
        "openai": build_openai,
        "groq": build_groq,
        "gemini": build_gemini,
        "ollama": build_ollama,
    }

    if settings.provider == "auto":
        # Priority: Groq (fastest free) → OpenRouter (widest model choice) → Gemini → OpenAI
        build_groq()
        build_openrouter()
        build_gemini()
        build_openai()
        build_ollama()
    else:
        builders[settings.provider]()

    return specs


def get_llm_configuration_status():
    try:
        settings = load_llm_settings()
        specs = _build_llm_specs(settings)
    except ValueError as exc:
        return {
            "ready": False,
            "provider": os.getenv("LLM_PROVIDER", "auto").strip().lower(),
            "backends": [],
            "error": str(exc),
        }

    if not specs:
        return {
            "ready": False,
            "provider": settings.provider,
            "backends": [],
            "error": f"No credentials or local model are configured for '{settings.provider}'.",
        }

    return {
        "ready": True,
        "provider": settings.provider,
        "backends": [{"provider": spec["name"], "model": spec["model"]} for spec in specs],
        "error": None,
    }


def _initialize_cache():
    global _cache_initialized
    if _cache_initialized:
        return

    try:
        from langchain_core.globals import set_llm_cache
        from langchain_core.cache import InMemoryCache
        set_llm_cache(InMemoryCache())
        print("LLM in-memory cache enabled.", flush=True)
    except Exception as e:
        print(f"LLM cache init skipped: {e}", flush=True)
    _cache_initialized = True



def get_llm():
    global _llm, _llm_signature
    try:
        settings = load_llm_settings()
        specs = _build_llm_specs(settings)
    except ValueError as exc:
        print(f"LLM configuration error: {exc}", flush=True)
        return None

    signature = tuple(
        (spec["id"], spec.get("api_base"), spec.get("timeout"), spec.get("max_retries"))
        for spec in specs
    )
    with _llm_lock:
        if _llm is not None and signature == _llm_signature:
            return _llm
        _initialize_cache()
        _llm = (
            ResilientLLM(specs, cooldown_seconds=settings.cooldown_seconds)
            if specs
            else None
        )
        _llm_signature = signature
        return _llm


def reset_llm():
    global _llm, _llm_signature
    with _llm_lock:
        _llm = None
        _llm_signature = None


def _normalize_response(response):
    if isinstance(response, str):
        return response
    if hasattr(response, "content"):
        content = response.content
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            text_parts = []
            for block in content:
                if isinstance(block, str):
                    text_parts.append(block)
                elif isinstance(block, dict) and block.get("type") in {"text", "output_text"}:
                    text_parts.append(str(block.get("text", "")))
            if text_parts:
                return "\n".join(part for part in text_parts if part)
        return str(content)
    return str(response)


def _normalize_context_chunks(raw_chunks):
    normalized = []
    for chunk in raw_chunks or []:
        if isinstance(chunk, dict):
            source = str(chunk.get("source", "Uploaded document")).strip() or "Uploaded document"
            content = str(chunk.get("content", "")).strip()
        else:
            source = "Uploaded document"
            content = str(chunk).strip()

        if content:
            normalized.append({"source": source, "content": content})
    return normalized


def _extractive_doc_fallback(query: str, context_chunks):
    if not context_chunks:
        return "I could not find matching information in the uploaded documents."

    intro = (
        "I found relevant text in your uploaded documents, but advanced AI generation is unavailable right now."
    )
    excerpts = "\n\n".join(
        f"Source: {chunk['source']}\n{chunk['content'][:700]}{'...' if len(chunk['content']) > 700 else ''}"
        for chunk in context_chunks[:3]
    )
    return f"{intro}\n\nQuestion: {query}\n\nRelevant excerpts:\n{excerpts}"


def _heuristic_general_fallback(query: str):
    cleaned = " ".join(str(query).split())
    lower = cleaned.lower()

    if "rewrite the following job description" in lower:
        original = cleaned.split("Keep the same meaning:", 1)[-1].strip() or cleaned
        return (
            "## Role\n"
            f"{original[:220]}\n\n"
            "## Key Responsibilities\n"
            "- Deliver the assigned work with clear ownership and communication.\n"
            "- Collaborate with the team on implementation, testing, and iteration.\n\n"
            "## Requirements\n"
            "- Relevant technical fundamentals for the role.\n"
            "- Ability to learn quickly and work with structured guidance.\n\n"
            "## Benefits\n"
            "- Real-world project exposure.\n"
            "- Mentorship, collaboration, and growth opportunities."
        )

    if "analyzing lecture" in lower:
        return (
            "## Summary\n"
            "The lecture content was captured, but advanced AI formatting is unavailable right now.\n\n"
            "## Key Concepts\n"
            "- Review the transcript and highlight the main definitions, formulas, or arguments.\n"
            "- Convert repeated themes into short bullet notes.\n\n"
            "## Action Items\n"
            "- Create 5 self-test questions from the lecture.\n"
            "- Revise the notes once within 24 hours."
        )

    return "AI generation is temporarily unavailable. Please try again shortly."


def run_study_rag(state):
    try:
        query = state.get("query", "").strip()
        user_id = str(state.get("user_id", "anonymous"))
        provided_chunks = _normalize_context_chunks(state.get("context_chunks", []))
        llm_engine = get_llm()

        if not query:
            return {"response": "Ask me a question about any uploaded document and I will search it for you."}

        docs = []
        if provided_chunks:
            docs = provided_chunks
        else:
            try:
                get_embeddings()
                vectordb = get_vectorstore()
                matches = vectordb.similarity_search(query, k=6, filter={"user_id": user_id})
                docs = [
                    {
                        "source": doc.metadata.get("source", "Uploaded document"),
                        "content": doc.page_content,
                    }
                    for doc in matches
                ]
            except Exception as vector_error:
                print(f"Vector retrieval unavailable: {vector_error}")

        if not llm_engine:
            if docs:
                return {"response": _extractive_doc_fallback(query, docs)}
            return {"response": "AI Brain is offline. Start Ollama or add an OpenAI API key to enable study chat."}

        if not docs:
            fallback_prompt = PromptTemplate(
                template=(
                    "You are CampusMind's study assistant.\n"
                    "The student asked: {question}\n\n"
                    "No uploaded document chunks matched this question.\n"
                    "Answer helpfully using general knowledge, but clearly say the answer was not found in the student's uploaded documents."
                ),
                input_variables=["question"],
            )
            answer = _normalize_response(llm_engine.invoke(fallback_prompt.format(question=query)))
            return {"response": answer}

        context = "\n\n".join(
            [
                f"Source: {doc.get('source', 'Uploaded document')}\n{doc.get('content', '')}"
                for doc in docs
            ]
        )
        sources = []
        for doc in docs:
            source_name = doc.get("source", "Uploaded document")
            if source_name not in sources:
                sources.append(source_name)

        prompt = PromptTemplate(
            template=(
                "You are CampusMind's study assistant.\n"
                "Answer the student's question using the uploaded document context first.\n"
                "If the context is incomplete, add a short supplement from general knowledge and say which part came from general knowledge.\n\n"
                "Question:\n{question}\n\n"
                "Context:\n{context}\n"
            ),
            input_variables=["question", "context"],
        )

        answer = _normalize_response(llm_engine.invoke(prompt.format(question=query, context=context)))
        if sources:
            answer = f"{answer}\n\nSources:\n" + "\n".join(f"- {source}" for source in sources[:4])
        return {"response": answer}
    except Exception as error:
        print(f"Study RAG error: {error}")
        return {"response": "Error processing your document question. Please try uploading the file again."}


def run_support_chat(state):
    query = state.get("query", "").strip()
    context_chunks = state.get("context_chunks") or []
    try:
        llm_engine = get_llm()
        if not llm_engine:
            return {"response": "AI Brain is offline. Start Ollama or add an OpenAI API key."}

        context_block = ""
        if context_chunks:
            context_block = "\n\nOfficial platform reference:\n" + "\n\n".join(
                f"[{chunk.get('source', 'CampusMind')}]\n{chunk.get('content', '')[:3500]}"
                for chunk in context_chunks[:3]
            )

        prompt = PromptTemplate(
            template=(
                "You are CampusMind AI, the official support agent for the platform.\n"
                "STRICT RULES:\n"
                "- Answer ONLY questions about CampusMind AI: login, pricing, features, alumni verification, privacy policy, terms of service, documents, resume tools, interviews, jobs, hackathons, and account help.\n"
                "- If the question is unrelated (recipes, weather, entertainment, general life advice), politely refuse and redirect to platform topics.\n"
                "- Use the official reference below when answering privacy or terms questions.\n"
                "- If asked who built you, say: I was built by the CampusMind Engineering Team.\n"
                "- Be concise, professional, and accurate.\n"
                "- Alumni verification is AI-powered: resume intelligence + trust score engine. Score ≥ 90 auto-verifies. Score 70–89 needs additional proof. Below 70 fails. Never describe manual-only community verification.\n\n"
                "{context_block}\n\n"
                "User question: {question}"
            ),
            input_variables=["context_block", "question"],
        )
        return {
            "response": _normalize_response(
                llm_engine.invoke(prompt.format(context_block=context_block, question=query))
            )
        }
    except Exception as error:
        print(f"Support chat error: {error}")
        return {"response": "I am having trouble accessing the support knowledge base right now."}


def run_general_chat(state):
    try:
        query = state["query"]
        llm_engine = get_llm()

        if not llm_engine:
            return {"response": _heuristic_general_fallback(query)}

        if "analyzing lecture" in query.lower():
            prompt = f"""
Convert this lecture into Cornell Notes format:

## Summary
## Key Concepts
## Action Items

Transcript:
{query}
"""
            response = llm_engine.invoke(prompt)
        else:
            response = llm_engine.invoke(query)

        return {"response": _normalize_response(response)}
    except Exception as error:
        print(f"General Chat Error: {error}")
        return {"response": _heuristic_general_fallback(state.get("query", ""))}
