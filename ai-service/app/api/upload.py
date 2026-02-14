from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
import shutil
import os
import tempfile
import json
from app.rag.ingest import ingest_document

router = APIRouter()

class FileUrlRequest(BaseModel):
    file_url: str

@router.post("/upload")
async def upload(request: Request):
    """
    Upload endpoint that accepts either:
    1. File upload via multipart/form-data (legacy support)
    2. S3 URL via JSON body (preferred - no local storage)
    """
    temp_path = None
    content_type = request.headers.get("content-type", "")
    
    try:
        # Check if it's JSON (S3 URL)
        if "application/json" in content_type:
            body = await request.json()
            if "file_url" in body:
                # Use S3 URL directly - no local storage
                ingest_document(body["file_url"])
                return {"status": "indexed", "source": "s3_url"}
            else:
                raise HTTPException(status_code=400, detail="Missing file_url in JSON body")
        
        # Check if it's multipart/form-data (file upload)
        elif "multipart/form-data" in content_type:
            form = await request.form()
            if "file" in form:
                file = form["file"]
                # Legacy: temporary file handling
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1] if hasattr(file, 'filename') else '') as tmp_file:
                    content = await file.read()
                    tmp_file.write(content)
                    temp_path = tmp_file.name
                
                ingest_document(temp_path)
                return {"status": "indexed", "source": "file_upload"}
            else:
                raise HTTPException(status_code=400, detail="No file provided in form data")
        else:
            raise HTTPException(status_code=400, detail="Unsupported content type. Use application/json or multipart/form-data")
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Upload error: {e}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {str(e)}")
    finally:
        # Clean up temp file if created
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass
