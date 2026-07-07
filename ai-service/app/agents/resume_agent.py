from app.rag.rag_chain import get_llm
from langchain_core.prompts import PromptTemplate


def _fallback_resume_review(text: str, jd: str = ""):
    lowered = (text or "").lower()
    jd_lowered = (jd or "").lower()
    score = 62
    strengths = []
    improvements = []

    if any(section in lowered for section in ["experience", "projects", "skills", "education"]):
        score += 10
        strengths.append("The resume includes core sections that recruiters expect to see.")
    else:
        improvements.append("Add clear sections such as Experience, Projects, Skills, and Education.")

    if any(token in lowered for token in ["built", "developed", "led", "improved", "implemented"]):
        score += 8
        strengths.append("Action-oriented language is already present in parts of the resume.")
    else:
        improvements.append("Use stronger action verbs like built, led, implemented, or improved.")

    if any(char.isdigit() for char in text or ""):
        score += 8
        strengths.append("There is at least some measurable or numeric evidence in the resume.")
    else:
        improvements.append("Add numbers and measurable outcomes to show impact.")

    if jd_lowered:
        score += 5
        improvements.append("Mirror important keywords from the job description in your summary and project bullets.")
    else:
        improvements.append("Tailor the resume summary for each role instead of using one generic version.")

    while len(strengths) < 3:
        strengths.append("The resume has a usable baseline that can be improved with clearer targeting.")
    while len(improvements) < 3:
        improvements.append("Tighten bullet points so each one shows ownership, action, and outcome.")

    score = max(35, min(score, 88))
    return {
        "response": (
            f"## Resume Review\n"
            f"Score: {score}/100\n\n"
            f"## Strengths\n"
            f"- {strengths[0]}\n"
            f"- {strengths[1]}\n"
            f"- {strengths[2]}\n\n"
            f"## Areas To Improve\n"
            f"- {improvements[0]}\n"
            f"- {improvements[1]}\n"
            f"- {improvements[2]}\n\n"
            f"## Tailoring Advice\n"
            f"Rewrite the top summary and strongest project bullets so they match the target role's keywords, tools, and outcomes more directly."
        )
    }


def analyze_resume(text: str, jd: str = ""):
    """
    Analyzes a resume against a job description (optional) or general best practices.
    Uses centralized LLM with fallback.
    """
    try:
        llm_engine = get_llm()
        if not llm_engine:
            return _fallback_resume_review(text, jd)
        
        template = """
        You are an expert Career Counselor and Resume Reviewer for college students.
        Review the following resume content and provide:
        1. A score out of 100.
        2. Three key strengths.
        3. Three areas for improvement.
        4. Specific advice on how to tailor this for the job market.

        Resume Content:
        {resume}

        Job Description (if any):
        {jd}

        Format the output in clear Markdown.
        """
        
        prompt = PromptTemplate(
            template=template, 
            input_variables=["resume", "jd"]
        )
        
        final_prompt = prompt.format(resume=text, jd=jd)
        response = llm_engine.invoke(final_prompt)
        
        # Handle both string and object responses
        if isinstance(response, str):
            return {"response": response}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": str(response)}
        
    except Exception as e:
        print(f"Resume agent fallback triggered: {e}")
        return _fallback_resume_review(text, jd)
