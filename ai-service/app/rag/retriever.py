def format_docs(docs):
    content = ""
    for i, doc in enumerate(docs):
        source = doc.metadata.get("source", "unknown")
        page = doc.metadata.get("page", "N/A")
        content += f"[Source {i+1}: {source}, Page {page}]\n"
        content += doc.page_content + "\n\n"
    return content
