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

    # Connect to the distributed ChromaDB StatefulSet in Kubernetes
    chroma_host = os.environ.get("CHROMA_HOST", "chromadb-service")
    chroma_port = os.environ.get("CHROMA_PORT", "8000")
    
    client = chromadb.HttpClient(host=chroma_host, port=chroma_port)

    _vectorstore = Chroma(
        client=client,
        collection_name="campusmind_ai_collection",
        embedding_function=get_embeddings(),
    )

    return _vectorstore


def persist_vectorstore(vectorstore):
    # When using chromadb.HttpClient, persistence is handled automatically by the server.
    pass