import os
import tempfile

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter()


class DeleteDocumentRequest(BaseModel):
    document_id: str
    user_id: str | None = None


@router.post("/upload")
async def upload(request: Request):
    from app.rag.ingest import ingest_document
    temp_path = None

    content_type = request.headers.get("content-type", "")

    try:
        if "application/json" in content_type:
            body = await request.json()
            file_url = body.get("file_url")
            if not file_url:
                raise HTTPException(status_code=400, detail="Missing file_url in JSON body")

            result = ingest_document(
                file_url,
                metadata={
                    "user_id": str(body.get("user_id", "anonymous")),
                    "document_id": str(body.get("document_id", "")),
                    "document_name": str(body.get("document_name", "")),
                },
                source_name=str(body.get("document_name", "")),
                content_type=str(body.get("content_type", "")),
            )
            if result.get("status") != "success":
                raise HTTPException(status_code=400, detail=result.get("message", "Could not index document"))
            return {"status": "indexed", "source": "remote_url", **result}

        if "multipart/form-data" in content_type:
            form = await request.form()
            file = form.get("file")
            if not file:
                raise HTTPException(status_code=400, detail="No file provided in form data")

            suffix = os.path.splitext(getattr(file, "filename", "") or "")[1]
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                tmp_file.write(await file.read())
                temp_path = tmp_file.name

            result = ingest_document(
                temp_path,
                metadata={
                    "user_id": str(form.get("user_id", "anonymous")),
                    "document_id": str(form.get("document_id", "")),
                    "document_name": str(getattr(file, "filename", "")),
                },
                source_name=str(getattr(file, "filename", "")),
                content_type=str(getattr(file, "content_type", "")),
            )
            if result.get("status") != "success":
                raise HTTPException(status_code=400, detail=result.get("message", "Could not index document"))
            return {"status": "indexed", "source": "file_upload", **result}

        raise HTTPException(
            status_code=400,
            detail="Unsupported content type. Use application/json or multipart/form-data",
        )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {error}") from error
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except OSError:
                pass


@router.post("/documents/delete")
async def delete_document(payload: DeleteDocumentRequest):
    from app.rag.ingest import delete_document_chunks
    deleted = delete_document_chunks(payload.document_id, payload.user_id)
    return {"status": "deleted", "deleted": deleted}

