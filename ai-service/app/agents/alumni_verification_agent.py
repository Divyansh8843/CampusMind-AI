import json
import re

from app.rag.rag_chain import get_llm
from langchain_core.prompts import PromptTemplate


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _heuristic_extract(resume_text: str) -> dict:
    text = _clean_text(resume_text)
    lowered = text.lower()
    result = {
        "name": "",
        "college": "",
        "degree": "",
        "branch": "",
        "graduation_year": "",
        "company": "",
        "job_title": "",
    }

    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    if lines:
        result["name"] = lines[0][:80]

    college_match = re.search(
        r"([A-Z][\w\s&.-]{3,80}(?:University|Institute|College|IIT|NIT|IIIT|BITS|VIT)[\w\s&.-]*)",
        resume_text,
        re.IGNORECASE,
    )
    if college_match:
        result["college"] = _clean_text(college_match.group(1))

    for degree in ["b.tech", "b.e.", "m.tech", "diploma", "mba", "bca", "mca", "b.sc", "m.sc", "b.arch"]:
        if degree in lowered:
            result["degree"] = degree.upper().replace(".", ".")
            break

    branch_keywords = [
        "computer science",
        "information technology",
        "mechanical engineering",
        "electrical engineering",
        "civil engineering",
        "electronics",
        "artificial intelligence",
        "data science",
    ]
    for keyword in branch_keywords:
        if keyword in lowered:
            result["branch"] = keyword.title()
            break

    year_match = re.search(r"(?:graduat(?:ed|ion)|pass(?:ed)?\s*out|class\s*of)\D{0,12}(20\d{2}|19\d{2})", lowered)
    if not year_match:
        year_match = re.search(r"\b(20\d{2}|19\d{2})\b", lowered)
    if year_match:
        result["graduation_year"] = year_match.group(1)

    exp_match = re.search(
        r"(?:experience|employment|work history|professional experience)\s*[:\-]?\s*(.+?)(?:\n\n|\neducation|\nskills|\nprojects|\Z)",
        resume_text,
        re.IGNORECASE | re.DOTALL,
    )
    if exp_match:
        exp_block = exp_match.group(1)
        exp_lines = [line.strip() for line in exp_block.splitlines() if line.strip()]
        if exp_lines:
            result["company"] = exp_lines[0][:80]
            if len(exp_lines) > 1:
                result["job_title"] = exp_lines[1][:80]

    return result


def _parse_json_response(raw: str) -> dict:
    cleaned = str(raw or "").strip()
    if "```" in cleaned:
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

    return {}


def extract_alumni_resume_profile(resume_text: str) -> dict:
    text = _clean_text(resume_text)
    if len(text) < 40:
        return {"success": False, "extracted": _heuristic_extract(text), "source": "heuristic"}

    try:
        llm_engine = get_llm()
        if not llm_engine:
            extracted = _heuristic_extract(text)
            return {"success": True, "extracted": extracted, "source": "heuristic"}

        prompt = PromptTemplate(
            template=(
                "You are a resume intelligence engine for alumni identity verification.\n"
                "Extract ONLY the following fields from the resume text as strict JSON.\n"
                "Use empty string when a field is not found. Do not invent data.\n\n"
                "Required JSON keys:\n"
                "name, college, degree, branch, graduation_year, company, job_title\n\n"
                "Resume:\n{resume}\n\n"
                "Return ONLY valid JSON."
            ),
            input_variables=["resume"],
        )

        response = llm_engine.invoke(prompt.format(resume=text[:12000]))
        content = response.content if hasattr(response, "content") else str(response)
        parsed = _parse_json_response(content)

        extracted = {
            "name": _clean_text(parsed.get("name", "")),
            "college": _clean_text(parsed.get("college", "")),
            "degree": _clean_text(parsed.get("degree", "")),
            "branch": _clean_text(parsed.get("branch", "")),
            "graduation_year": _clean_text(str(parsed.get("graduation_year", ""))),
            "company": _clean_text(parsed.get("company", "")),
            "job_title": _clean_text(parsed.get("job_title", "")),
        }

        if not any(extracted.values()):
            extracted = _heuristic_extract(text)
            return {"success": True, "extracted": extracted, "source": "heuristic"}

        return {"success": True, "extracted": extracted, "source": "ai"}
    except Exception as error:
        print(f"Alumni resume extraction fallback: {error}")
        return {
            "success": True,
            "extracted": _heuristic_extract(text),
            "source": "heuristic",
        }
