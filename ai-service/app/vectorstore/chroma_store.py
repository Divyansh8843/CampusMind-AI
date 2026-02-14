from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

def get_vectorstore():
    return Chroma(
        persist_directory="chroma_db",
        embedding_function=OpenAIEmbeddings()
    )
