import os
import ipaddress
import shutil
import subprocess
import tempfile
from urllib.parse import urlparse

import requests
from langchain_core.documents import Document
from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader
from pypdf import PdfReader


TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".json"}


def _resolve_extension(file_path_or_url: str, source_name: str = "", content_type: str = "") -> str:
    content_type = (content_type or "").lower()
    candidates = [source_name, urlparse(file_path_or_url).path, file_path_or_url]
    for candidate in candidates:
        ext = os.path.splitext(candidate or "")[1].lower()
        if ext:
            return ext

    if "pdf" in content_type:
        return ".pdf"
    if "wordprocessingml" in content_type or "docx" in content_type:
        return ".docx"
    if content_type.startswith("text/") or "json" in content_type:
        return ".txt"

    return ""


def _build_loader(target_path: str, extension: str):
    if extension == ".docx":
        return Docx2txtLoader(target_path)
    if extension in TEXT_EXTENSIONS:
        return TextLoader(target_path, encoding="utf-8")
    raise ValueError(f"Unsupported file format: {extension or 'unknown'}")


def _source_label(file_path_or_url: str, source_name: str = "") -> str:
    return source_name or os.path.basename(urlparse(file_path_or_url).path) or os.path.basename(file_path_or_url)


def _has_text(docs) -> bool:
    return any(str(getattr(doc, "page_content", "")).strip() for doc in docs or [])


def _load_pdf_with_langchain(target_path: str):
    try:
        return [doc for doc in PyPDFLoader(target_path).load() if str(doc.page_content).strip()]
    except Exception as error:
        print(f"PyPDFLoader failed for {target_path}: {error}")
        return []


def _load_pdf_with_pypdf(target_path: str):
    try:
        reader = PdfReader(target_path)
        docs = []
        for index, page in enumerate(reader.pages):
            text = str(page.extract_text() or "").strip()
            if text:
                docs.append(Document(page_content=text, metadata={"page": index + 1}))
        return docs
    except Exception as error:
        print(f"PdfReader fallback failed for {target_path}: {error}")
        return []


def _load_pdf_with_pdftotext(target_path: str):
    executable = shutil.which("pdftotext")
    if not executable:
        return []

    try:
        result = subprocess.run(
            [executable, "-layout", "-enc", "UTF-8", target_path, "-"],
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        text = str(result.stdout or "").strip()
        if not text:
            return []
        return [Document(page_content=text, metadata={"extraction_method": "pdftotext"})]
    except Exception as error:
        print(f"pdftotext fallback failed for {target_path}: {error}")
        return []


def _load_pdf_document(target_path: str):
    for loader in (_load_pdf_with_langchain, _load_pdf_with_pypdf, _load_pdf_with_pdftotext):
        docs = loader(target_path)
        if _has_text(docs):
            return docs

    raise ValueError(
        "No machine-readable text could be extracted from this PDF. "
        "It may be scanned, image-based, encrypted, or malformed."
    )


def _is_private_or_local_host(hostname: str) -> bool:
    host = (hostname or "").strip().lower()
    if not host:
        return True
    if host in {"localhost", "127.0.0.1", "0.0.0.0", "::1"}:
        return True
    if host.endswith(".local") or host.endswith(".internal"):
        return True

    try:
        ip = ipaddress.ip_address(host)
        return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved
    except ValueError:
        return False


def _is_allowed_download_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False

    host = (parsed.hostname or "").lower()
    if _is_private_or_local_host(host):
        return False

    allowed_hosts = {
        value.strip().lower()
        for value in os.getenv("AI_ALLOWED_DOWNLOAD_HOSTS", "").split(",")
        if value.strip()
    }

    server_host = urlparse(os.getenv("SERVER_PUBLIC_URL", "")).hostname
    if server_host:
        allowed_hosts.add(server_host.lower())

    allowed_hosts.update(
        {
            "res.cloudinary.com",
            "storage.googleapis.com",
        }
    )

    if not allowed_hosts:
        return False

    return any(host == allowed or host.endswith(f".{allowed}") for allowed in allowed_hosts)


def load_document(file_path_or_url: str, source_name: str = "", content_type: str = ""):
    temp_path = None
    try:
        extension = _resolve_extension(file_path_or_url, source_name, content_type)
        source_label = _source_label(file_path_or_url, source_name)

        if file_path_or_url.startswith(("http://", "https://")):
            if not _is_allowed_download_url(file_path_or_url):
                raise ValueError("Remote document URL host is not allowed")
            response = requests.get(file_path_or_url, stream=True, timeout=45, allow_redirects=False)
            response.raise_for_status()
            content_type_header = response.headers.get("Content-Type","").lower()
            print(f"Downloaded file content-type: {content_type_header}")
            if extension == ".pdf" and "pdf" not in content_type_header:
               raise ValueError(f"Expected PDF but received {content_type_header}")

            with tempfile.NamedTemporaryFile(delete=False, suffix=extension or ".tmp") as tmp_file:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        tmp_file.write(chunk)
                temp_path = tmp_file.name

            target_path = temp_path
        else:
            target_path = file_path_or_url

        if extension == ".pdf":
            docs = _load_pdf_document(target_path)
        else:
            loader = _build_loader(target_path, extension)
            docs = loader.load()

        docs = [doc for doc in docs if str(getattr(doc, "page_content", "")).strip()]
        if not docs:
            raise ValueError(f"No readable text could be extracted from {source_label or 'this document'}.")

        for doc in docs:
            doc.metadata = {
                **(doc.metadata or {}),
                "source": source_label or "uploaded-document",
            }
        return docs, None
    except Exception as error:
        print(f"Error loading document {file_path_or_url}: {error}")
        return [], str(error)
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except OSError:
                pass
