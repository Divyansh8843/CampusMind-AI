from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.interview_agent import conduct_interview, generate_aptitude_test, generate_interview_feedback

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

@router.post("/interview")
def run_interview(payload: InterviewRequest):
    return conduct_interview(payload.history, payload.user_response, payload.topic)

@router.post("/aptitude")
def aptitude_test(payload: AptitudeRequest):
    return {"questions": generate_aptitude_test(payload.topic)}

@router.post("/feedback")
def interview_feedback(payload: FeedbackRequest):
    return generate_interview_feedback(payload.history, payload.topic)
