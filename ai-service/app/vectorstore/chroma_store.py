from pathlib import Path

PERSIST_DIRECTORY = Path(__file__).resolve().parents[2] / "chroma_db"
PERSIST_DIRECTORY.mkdir(parents=True, exist_ok=True)

_vectorstore = None


def get_vectorstore():
    global _vectorstore

    if _vectorstore is not None:
        return _vectorstore

    try:
        from langchain_chroma import Chroma
    except ImportError:
        from langchain_community.vectorstores import Chroma

    from app.embeddings.embedding_model import get_embeddings

    _vectorstore = Chroma(
        persist_directory=str(PERSIST_DIRECTORY),
        embedding_function=get_embeddings(),
    )

    return _vectorstore


def persist_vectorstore(vectorstore):
    persist = getattr(vectorstore, "persist", None)

    if callable(persist):
        persist()