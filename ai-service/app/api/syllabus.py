from fastapi import APIRouter
from pydantic import BaseModel
import re
import json

router = APIRouter()

class ParseSyllabusRequest(BaseModel):
    text: str = ""

def parse_syllabus_text(text: str) -> dict:
    """Parse syllabus text into subjects and topics. No LLM required for reliability."""
    text = text.strip()
    if not text:
        return {"title": "My Syllabus", "subjects": []}
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    subjects = []
    current = None
    for line in lines:
        if len(line) < 2:
            continue
        is_heading = (
            re.match(r"^(unit|module|chapter|part|paper)\s*[-:]?\s*\d+", line, re.I)
            or re.match(r"^\d+[.)]\s+[A-Z]", line)
            or re.match(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*[-–:]", line)
        )
        if is_heading and len(line) < 100:
            if current:
                subjects.append(current)
            current = {"name": line, "topics": []}
        elif current:
            if len(line) > 1:
                current["topics"].append(line)
        else:
            if not subjects or subjects[-1]["name"] == "General":
                if not subjects:
                    subjects.append({"name": "General", "topics": []})
                subjects[-1]["topics"].append(line)
            else:
                subjects.append({"name": "General", "topics": [line]})
    if current:
        subjects.append(current)
    if not subjects:
        subjects = [{"name": "Syllabus", "topics": lines[:40]}]
    title = "My Syllabus"
    for line in lines[:5]:
        if len(line) > 10 and re.match(r"^[A-Za-z].*syllabus|course|curriculum", line, re.I):
            title = line[:80]
            break
    return {"title": title, "subjects": subjects}

@router.post("/parse-syllabus")
def parse_syllabus(payload: ParseSyllabusRequest):
    result = parse_syllabus_text(payload.text or "")
    return result
