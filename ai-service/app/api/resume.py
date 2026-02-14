from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.resume_agent import analyze_resume

router = APIRouter()

class ResumeRequest(BaseModel):
    resume_text: str
    job_description: str = ""

@router.post("/resume")
def analyze(payload: ResumeRequest):
    return analyze_resume(payload.resume_text, payload.job_description)
