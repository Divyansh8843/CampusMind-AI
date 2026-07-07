from app.rag.rag_chain import get_llm
from langchain_core.prompts import PromptTemplate
import json


def _normalize_topics(text: str):
    cleaned = str(text).replace("Create a robust 1-month study plan for my exams based on my uploaded notes.", "")
    cleaned = cleaned.replace("Create a study plan for my exams based on my uploaded notes.", "")
    return [
        topic.strip(" -•\t")
        for topic in cleaned.replace(" and ", ",").split(",")
        if topic.strip(" -•\t")
    ]


def _fallback_study_plan(topic_or_syllabus: str):
    topics = _normalize_topics(topic_or_syllabus) or ["Revision", "Practice Questions", "Mock Test"]
    days = min(max(len(topics), 7), 30)
    lines = ["## 1-Month Study Plan", ""]

    for day in range(days):
        topic = topics[day % len(topics)]
        if day % 7 == 6:
            lines.append(f"Day {day + 1}: Review {topic}, solve timed questions, and update weak areas.")
        else:
            lines.append(
                f"Day {day + 1}: Study {topic} for 2 focused sessions, create short notes, and end with a 20-minute revision."
            )

    lines.extend(
        [
            "",
            "## Daily Routine",
            "- Session 1: Learn core concepts",
            "- Session 2: Practice problems or examples",
            "- Session 3: 20-minute recall and revision",
            "",
            "## Final 3 Days",
            "- Revise formulas, definitions, and high-weight topics",
            "- Attempt one mock test each day",
            "- Sleep well and avoid starting brand-new topics at the end",
        ]
    )
    return "\n".join(lines)

def generate_study_plan(state: dict):
    """
    Generates a study schedule based on the provided topics or syllabus.
    """
    try:
        topic_or_syllabus = state.get("query", "")
        llm_engine = get_llm()

        if not llm_engine:
             return {"response": _fallback_study_plan(topic_or_syllabus)}
        template = """
        You are an intelligent AI Study Planner.
        Your goal is to create a structured study schedule based on the student's syllabus or topics.
        
        Syllabus / Topics Provided:
        {topics}
        
        Instructions:
        1. Break down the topics into manageable daily or weekly modules.
        2. Assign estimated time for each topic based on difficulty (assume standard difficulty if not specified).
        3. Include breaks and review sessions.
        4. Output the schedule in a clear, readable format (Markdown).
        
        Study Schedule:
        """
        
        prompt = PromptTemplate(template=template, input_variables=["topics"])
        final_prompt = prompt.format(topics=topic_or_syllabus)
        response = llm_engine.invoke(final_prompt)
        
        if isinstance(response, str):
            return {"response": response}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": str(response)}

    except Exception as e:
        print(f"Study planner fallback triggered: {type(e).__name__}")
        return {"response": _fallback_study_plan(state.get("query", ""))}
