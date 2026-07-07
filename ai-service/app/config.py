import os
from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit


DEFAULT_OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"
DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-120b:free"
SUPPORTED_LLM_PROVIDERS = {"auto", "openrouter", "openai", "groq", "gemini", "ollama"}


def _env_value(name: str, default: str = "") -> str:
    return os.getenv(name, "").strip() or default


def _positive_float(name: str, default: float) -> float:
    raw_value = _env_value(name)
    if not raw_value:
        return default

    try:
        value = float(raw_value)
    except ValueError as exc:
        raise ValueError(f"{name} must be a number.") from exc

    if value <= 0:
        raise ValueError(f"{name} must be greater than zero.")
    return value


def _non_negative_int(name: str, default: int) -> int:
    raw_value = _env_value(name)
    if not raw_value:
        return default

    try:
        value = int(raw_value)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer.") from exc

    if value < 0:
        raise ValueError(f"{name} cannot be negative.")
    return value


def normalize_openrouter_api_base(value: str) -> str:
    candidate = (value or DEFAULT_OPENROUTER_API_BASE).strip().rstrip("/")
    parsed = urlsplit(candidate)

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("OPENROUTER_API_BASE must be an absolute HTTP(S) URL.")
    if parsed.query or parsed.fragment:
        raise ValueError("OPENROUTER_API_BASE cannot contain a query string or fragment.")

    hostname = (parsed.hostname or "").lower()
    if hostname in {"openrouter.ai", "www.openrouter.ai"}:
        if parsed.path in {"", "/", "/v1", "/api/v1"}:
            return DEFAULT_OPENROUTER_API_BASE
        raise ValueError(
            "OPENROUTER_API_BASE must point to https://openrouter.ai/api/v1, not a website page."
        )

    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path.rstrip("/"), "", ""))


def normalize_openrouter_model(value: str) -> str:
    model = (value or DEFAULT_OPENROUTER_MODEL).strip()
    legacy_aliases = {
        "gpt-oss-120b:free": "openai/gpt-oss-120b:free",
        "gpt-oss-120b": "openai/gpt-oss-120b",
        "gpt-oss-20b:free": "openai/gpt-oss-20b:free",
        "gpt-oss-20b": "openai/gpt-oss-20b",
    }
    model = legacy_aliases.get(model, model)

    if "/" not in model:
        raise ValueError(
            "OPENROUTER_MODEL must be a complete OpenRouter model slug such as "
            "'openai/gpt-oss-120b:free'."
        )
    return model


def _openrouter_models() -> tuple[str, ...]:
    configured = [_env_value("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL)]
    configured.extend(
        item.strip()
        for item in _env_value("OPENROUTER_FALLBACK_MODELS").split(",")
        if item.strip()
    )

    models = []
    for value in configured:
        model = normalize_openrouter_model(value)
        if model not in models:
            models.append(model)
    return tuple(models)


@dataclass(frozen=True)
class LLMSettings:
    provider: str
    request_timeout_seconds: float
    max_retries: int
    cooldown_seconds: float
    openrouter_api_key: str
    openrouter_api_base: str
    openrouter_models: tuple[str, ...]
    openrouter_app_url: str
    openrouter_app_title: str
    openai_api_key: str
    openai_model: str
    groq_api_key: str
    groq_model: str
    gemini_api_key: str
    gemini_model: str
    ollama_model: str
    ollama_base_url: str


def load_llm_settings() -> LLMSettings:
    provider = _env_value("LLM_PROVIDER", "auto").lower()
    if provider not in SUPPORTED_LLM_PROVIDERS:
        raise ValueError(
            f"Unsupported LLM_PROVIDER '{provider}'. "
            f"Expected one of: {', '.join(sorted(SUPPORTED_LLM_PROVIDERS))}."
        )

    openrouter_api_key = _env_value("OPENROUTER_API_KEY")
    openrouter_enabled = provider == "openrouter" or (
        provider == "auto" and bool(openrouter_api_key)
    )
    openrouter_api_base = _env_value(
        "OPENROUTER_API_BASE", DEFAULT_OPENROUTER_API_BASE
    )

    return LLMSettings(
        provider=provider,
        request_timeout_seconds=_positive_float("LLM_REQUEST_TIMEOUT_SECONDS", 60.0),
        max_retries=_non_negative_int("LLM_MAX_RETRIES", 0),
        cooldown_seconds=_positive_float("LLM_BACKEND_COOLDOWN_SECONDS", 30.0),
        openrouter_api_key=openrouter_api_key,
        openrouter_api_base=normalize_openrouter_api_base(openrouter_api_base)
        if openrouter_enabled
        else openrouter_api_base,
        openrouter_models=_openrouter_models() if openrouter_enabled else (),
        openrouter_app_url=_env_value("OPENROUTER_APP_URL"),
        openrouter_app_title=_env_value("OPENROUTER_APP_TITLE", "CampusMind AI"),
        openai_api_key=_env_value("OPENAI_API_KEY"),
        openai_model=_env_value("OPENAI_MODEL", "gpt-4o-mini"),
        groq_api_key=_env_value("GROQ_API_KEY"),
        groq_model=_env_value("GROQ_MODEL", "llama-3.1-8b-instant"),
        gemini_api_key=_env_value("GEMINI_API_KEY"),
        gemini_model=_env_value("GEMINI_MODEL", "gemini-2.0-flash"),
        ollama_model=_env_value("OLLAMA_MODEL"),
        ollama_base_url=_env_value("OLLAMA_BASE_URL", "http://localhost:11434"),
    )
