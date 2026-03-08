from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class DraftEmailRequest(BaseModel):
    alumni_name: str = ""
    alumni_company: str = ""
    alumni_role: str = ""
    my_name: str = ""
    my_interests: str = ""
    my_branch: str = ""

@router.post("/draft-mentorship-email")
def draft_mentorship_email(payload: DraftEmailRequest):
    """Draft a short, professional cold email for mentorship request. No LLM required for reliability."""
    a_name = (payload.alumni_name or "Alumni").strip()
    a_company = (payload.alumni_company or "their company").strip()
    a_role = (payload.alumni_role or "Professional").strip()
    m_name = (payload.my_name or "Student").strip()
    interests = (payload.my_interests or "technology and career growth").strip()
    branch = (payload.my_branch or "my branch").strip()
    email = f"""Subject: Mentorship Request – {branch} Student Interested in {a_company}

Dear {a_name},

I am {m_name}, a student in {branch}. I came across your profile on CampusMind and was inspired by your journey to {a_role} at {a_company}.

I am particularly interested in {interests}, and I believe your experience could help me navigate my own path. Would you have 15–20 minutes for a short call or chat in the coming weeks? I would be grateful for any advice you could share.

Thank you for your time.

Best regards,
{m_name}"""
    return {"email": email, "subject": f"Mentorship Request – {branch} Student Interested in {a_company}"}
