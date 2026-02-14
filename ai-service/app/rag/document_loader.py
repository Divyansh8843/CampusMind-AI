from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
import os
import requests
import tempfile
from urllib.parse import urlparse

def load_document(file_path_or_url: str):
    """
    Load a document from local path or S3 URL.
    Supports both local files and remote URLs (S3).
    """
    # Check if it's a URL
    if file_path_or_url.startswith('http://') or file_path_or_url.startswith('https://'):
        # Download from URL (S3)
        try:
            response = requests.get(file_path_or_url, stream=True)
            response.raise_for_status()
            
            # Create temporary file
            parsed_url = urlparse(file_path_or_url)
            filename = os.path.basename(parsed_url.path) or 'temp_file'
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp_file:
                for chunk in response.iter_content(chunk_size=8192):
                    tmp_file.write(chunk)
                temp_path = tmp_file.name
            
            # Load from temp file
            ext = os.path.splitext(filename)[1].lower()
            if ext == ".pdf":
                loader = PyPDFLoader(temp_path)
            elif ext == ".txt":
                loader = TextLoader(temp_path)
            elif ext == ".docx":
                loader = Docx2txtLoader(temp_path)
            else:
                print(f"Unsupported file format: {ext}")
                os.unlink(temp_path)
                return []
            
            docs = loader.load()
            # Clean up temp file
            os.unlink(temp_path)
            return docs
            
        except Exception as e:
            print(f"Error loading document from URL {file_path_or_url}: {e}")
            return []
    else:
        # Local file path (legacy support)
        ext = os.path.splitext(file_path_or_url)[1].lower()
        
        try:
            if ext == ".pdf":
                loader = PyPDFLoader(file_path_or_url)
            elif ext == ".txt":
                loader = TextLoader(file_path_or_url)
            elif ext == ".docx":
                loader = Docx2txtLoader(file_path_or_url)
            else:
                print(f"Unsupported file format: {ext}")
                return []

            return loader.load()
        except Exception as e:
            print(f"Error loading document {file_path_or_url}: {e}")
            return []
