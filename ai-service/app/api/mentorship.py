from fastapi import APIRouter
from pydantic import BaseModel
from app.rag.rag_chain import get_llm

router = APIRouter()

class DraftEmailRequest(BaseModel):
    alumni_name: str = ""
    alumni_company: str = ""
    alumni_role: str = ""
    student_name: str = ""
    student_college: str = ""
    student_course: str = ""
    student_branch: str = ""
    student_year: str = ""
    student_cgpa: str = ""
    student_skills: list = []
    my_interests: str = ""
    resume_text: str = ""

@router.post("/draft-mentorship-email")
def draft_mentorship_email(payload: DraftEmailRequest):
    """Draft a professional, customized cold email for mentorship request using Gemini LLM if available, otherwise fallback."""
    a_name = (payload.alumni_name or "Alumni").strip()
    a_company = (payload.alumni_company or "their company").strip()
    a_role = (payload.alumni_role or "Professional").strip()
    m_name = (payload.student_name or "Student").strip()
    interests = (payload.my_interests or "technology and career growth").strip()
    branch = (payload.student_branch or "my branch").strip()

    try:
        llm = get_llm()
        if llm:
            skills_str = ", ".join(payload.student_skills) if isinstance(payload.student_skills, list) else str(payload.student_skills)
            prompt = f"""You are an AI assistant helping a college student draft a highly professional, polite, and personalized cold email (mentorship request) to an alumni of their college/community.

Alumni Details:
- Name: {a_name}
- Company: {a_company}
- Current Role: {a_role}

Student Profile:
- Name: {m_name}
- College: {payload.student_college}
- Course: {payload.student_course}
- Branch: {branch}
- Current Year: {payload.student_year}
- CGPA: {payload.student_cgpa}
- Key Skills: {skills_str}
- Specific Interests/Focus for this connection: {interests}

Student Resume Text Excerpts (if available, use this to weave in specific details of projects, internships, or achievements naturally and concisely):
{payload.resume_text}

Instructions:
1. Draft a highly professional, short, and compelling subject line.
2. Write a highly tailored, respectful, and concise email body. Reference specific details of the student's profile (like their projects or skills) to show they are a high-potential student, and show genuine interest in the alumni's work/company.
3. Keep it brief and polite. Ask for a brief 10-15 minute chat or advice.
4. Do NOT output any conversational text or markdown styling.
5. Format the output STRICTLY like this, with the SUBJECT and EMAIL tags:
SUBJECT: <subject_line>
EMAIL: <email_body>
"""
            response = llm.invoke(prompt)
            text = ""
            if hasattr(response, "content"):
                text = str(response.content)
            elif isinstance(response, str):
                text = response
            else:
                text = str(response)

            text = text.strip()

            subject = f"Connecting: {m_name} ({branch})"
            email_body = ""
            
            if "SUBJECT:" in text and "EMAIL:" in text:
                parts = text.split("EMAIL:", 1)
                subj_part = parts[0].replace("SUBJECT:", "").strip()
                if subj_part:
                    subject = subj_part
                email_body = parts[1].strip()
            else:
                lines = text.split("\n")
                subj_line = next((l for l in lines if l.lower().startswith("subject:")), None)
                if subj_line:
                    subject = subj_line.split(":", 1)[1].strip()
                    email_body = "\n".join(l for l in lines if not l.lower().startswith("subject:")).strip()
                else:
                    email_body = text

            if email_body:
                return {"email": email_body, "subject": subject}
    except Exception as e:
        print(f"LLM drafting failed, falling back to static draft: {e}", flush=True)

    # Fallback to structured template
    course_branch = f"{payload.student_course} ({branch})" if payload.student_course else branch
    college_str = f" at {payload.student_college}" if payload.student_college else ""
    company_str = f" at {a_company}" if payload.alumni_company else ""
    
    fallback_subject = f"Connecting: {m_name} ({branch})"
    fallback_email = f"""Hi {a_name},

I hope you're having a great week.

My name is {m_name}, and I'm currently studying {course_branch}{college_str}. I recently came across your profile on CampusMind and have been genuinely following your career journey. I am incredibly inspired by the work you're doing as a {a_role}{company_str}.

I'm very passionate about {interests} and am actively trying to bridge the gap between my academic studies and what the industry actually expects. Given your expertise, I was wondering if you might be open to a brief 10-15 minute chat or willing to share a quick piece of advice?

I've attached a link to my complete profile and resume below for some context. I completely understand if you're swamped right now, but even a short response would mean a lot to me as I navigate my early career.

Thank you so much for your time and for paving the way for students like us.

Best,
{m_name}"""

    return {"email": fallback_email, "subject": fallback_subject}
