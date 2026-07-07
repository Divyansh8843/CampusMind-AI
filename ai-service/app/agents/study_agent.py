from app.rag.rag_chain import run_study_rag, run_support_chat, get_llm
from app.agents.planner_agent import generate_study_plan

from typing import TypedDict
from langgraph.graph import StateGraph, END


# ─── State Definition ─────────────────────────────────────────────────────────
class State(TypedDict):
    query: str
    response: str
    type: str  # "study", "support", "planner", "general"
    user_id: str
    context_chunks: list


# ─── General Chat (No RAG) ───────────────────────────────────────────────────
def run_general_chat(state: State):
    """Handles general queries without document retrieval (rewriting, lecture notes)."""
    query = state['query']

    llm_engine = get_llm()
    if not llm_engine:
        return {"response": "AI Brain is offline. Please try again shortly."}

    if "analyzing lecture" in query.lower():
        prompt = (
            "You are an expert academic note-taker. "
            "Convert the following lecture transcript into structured Cornell Notes format.\n\n"
            "Include these sections:\n"
            "## Summary\n(Brief overview)\n\n"
            "## Key Concepts\n(Bulleted main ideas)\n\n"
            "## Action Items\n(Things to study or review)\n\n"
            f"Transcript:\n{query}"
        )
        response = llm_engine.invoke(prompt)
    else:
        response = llm_engine.invoke(query)

    if isinstance(response, str):
        return {"response": response}
    if hasattr(response, "content"):
        return {"response": response.content}
    return {"response": str(response)}


# ─── Router ───────────────────────────────────────────────────────────────────
def route_query(state: State):
    import re
    chat_type = state.get("type", "study").lower()
    query_lower = re.sub(r"[^\w\s]", "", state["query"].lower().strip())

    if chat_type == "study":
        if query_lower in ["hi", "hello", "hey", "help", "hii", "heyy"]:
            return "support"
        if any(k in query_lower for k in ["plan", "schedule", "timetable", "routine", "roadmap"]):
            return "planner"
        if any(k in query_lower for k in ["analyzing lecture", "rewrite", "improve", "optimize", "paraphrase", "project", "idea"]):
            return "general"

    if chat_type == "planner":
        return "planner"
    if chat_type == "support":
        return "support"
    if chat_type == "general":
        return "general"
    return "rag"


# ─── Graph Construction ───────────────────────────────────────────────────────
workflow = StateGraph(State)

workflow.add_node("rag", run_study_rag)
workflow.add_node("planner", generate_study_plan)
workflow.add_node("support", run_support_chat)
workflow.add_node("general", run_general_chat)

workflow.set_conditional_entry_point(
    route_query,
    {
        "rag": "rag",
        "planner": "planner",
        "support": "support",
        "general": "general",
    }
)

workflow.add_edge("rag", END)
workflow.add_edge("planner", END)
workflow.add_edge("support", END)
workflow.add_edge("general", END)

app = workflow.compile()
