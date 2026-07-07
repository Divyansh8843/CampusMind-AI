from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class InterviewRequest(BaseModel):
    history: list = []
    user_response: str = ""
    topic: str = "General Engineering"

class AptitudeRequest(BaseModel):
    topic: str = "General Aptitude"

class FeedbackRequest(BaseModel):
    history: list
    topic: str
    user_transcript: str = ""

@router.post("/interview")
def run_interview(payload: InterviewRequest):
    from app.agents.interview_agent import conduct_interview
    return conduct_interview(payload.history, payload.user_response, payload.topic)

@router.post("/aptitude")
def aptitude_test(payload: AptitudeRequest):
    from app.agents.interview_agent import generate_aptitude_test
    return {"questions": generate_aptitude_test(payload.topic)}

@router.post("/feedback")
def interview_feedback(payload: FeedbackRequest):
    from app.agents.interview_agent import generate_interview_feedback
    return generate_interview_feedback(
        payload.history,
        payload.topic,
        getattr(payload, "user_transcript", "") or "",
    )

