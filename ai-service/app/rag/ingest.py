from typing import Any, Dict

from app.rag.chunker import chunk_docs
from app.rag.document_loader import load_document
from app.vectorstore.chroma_store import get_vectorstore, persist_vectorstore


def delete_document_chunks(document_id: str, user_id: str | None = None) -> int:
    if not document_id:
        return 0

    vectorstore = get_vectorstore()

    if user_id:
        where = {
            "$and": [
                {"document_id": str(document_id)},
                {"user_id": str(user_id)}
            ]
        }
    else:
        where = {
            "document_id": str(document_id)
        }

    vectorstore.delete(where=where)
    persist_vectorstore(vectorstore)

    return 1



def ingest_document(
    file_path_or_url: str,
    metadata: Dict[str, Any] | None = None,
    *,
    source_name: str = "",
    content_type: str = "",
):
    metadata = {k: str(v) for k, v in (metadata or {}).items() if v not in (None, "")}
    document_id = metadata.get("document_id")
    user_id = metadata.get("user_id")

    docs, load_error = load_document(
        file_path_or_url,
        source_name=source_name,
        content_type=content_type,
    )
    if not docs:
        return {"status": "error", "message": load_error or "No content loaded"}

    chunks = chunk_docs(docs)
    if not chunks:
        return {
            "status": "error",
            "message": load_error or "The document was read, but no usable text chunks were generated.",
        }

    for index, chunk in enumerate(chunks):
        chunk.metadata = {
            **(chunk.metadata or {}),
            **metadata,
            "chunk_index": index,
        }

    vectorstore = get_vectorstore()
    if document_id:
        delete_document_chunks(document_id, user_id)

    vectorstore.add_documents(chunks)
    persist_vectorstore(vectorstore)

    print(f"Indexed {len(chunks)} chunks from {source_name or file_path_or_url}")
    return {"status": "success", "chunks": len(chunks)}
