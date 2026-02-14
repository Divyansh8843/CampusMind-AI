from app.rag.document_loader import load_document
from app.rag.chunker import chunk_docs
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

import os

PERSIST_DIRECTORY = "chroma_db"

# Use local embeddings (no API key required)
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'}
)

def ingest_document(file_path_or_url: str):
    """
    Loads, chunks, and indexes a document into the Vector DB.
    Accepts both local file paths and S3 URLs.
    """
    try:
        # 1. Load
        dots = load_document(file_path_or_url)
        if not dots:
             return {"status": "error", "message": "No content loaded"}

        # 2. Chunk
        chunks = chunk_docs(dots)
        
        # 3. Embed & Store
        vectorstore = Chroma(
            persist_directory=PERSIST_DIRECTORY, 
            embedding_function=embeddings
        )
        
        vectorstore.add_documents(chunks)
        vectorstore.persist()
        
        print(f"Successfully indexed {len(chunks)} chunks from {file_path_or_url}")
        return {"status": "success"}

    except Exception as e:
        print(f"Ingestion Error: {e}")
        raise e
