import os
import chromadb

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

    # Use PersistentClient to run Chroma locally without needing a separate server
    persist_dir = os.path.join(os.getcwd(), "chroma_db")
    client = chromadb.PersistentClient(path=persist_dir)

    _vectorstore = Chroma(
        client=client,
        collection_name="campusmind_ai_collection",
        embedding_function=get_embeddings(),
    )

    return _vectorstore


def persist_vectorstore(vectorstore):
    # When using chromadb.HttpClient, persistence is handled automatically by the server.
    pass