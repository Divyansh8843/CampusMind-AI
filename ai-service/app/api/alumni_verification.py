from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class AlumniResumeExtractRequest(BaseModel):
    resume_text: str = Field(..., min_length=20)


@router.post("/alumni-verification/extract")
def extract_resume_profile(payload: AlumniResumeExtractRequest):
    from app.agents.alumni_verification_agent import extract_alumni_resume_profile

    return extract_alumni_resume_profile(payload.resume_text)
