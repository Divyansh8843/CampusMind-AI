from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agents.planner_agent import generate_study_plan
from app.rag.rag_chain import run_general_chat, run_study_rag, run_support_chat


class State(TypedDict):
    query: str
    response: str
    type: str  # "study", "support", "planner", "general"
    user_id: str
    context_chunks: list


def route_query(state: State):
    import re

    chat_type = state.get("type", "study").lower()
    query = state["query"].lower().strip()
    clean_query = re.sub(r"[^\w\s]", "", query)

    if chat_type == "study":
        if clean_query in ["hi", "hello", "hey", "hii", "heyy"]:
            return "support"

        if any(keyword in clean_query for keyword in ["plan", "schedule", "timetable", "roadmap"]):
            return "planner"

        if any(keyword in clean_query for keyword in ["rewrite", "improve", "paraphrase", "project", "idea"]):
            return "general"

    return chat_type


workflow = StateGraph(State)

workflow.add_node("rag", run_study_rag)
workflow.add_node("support", run_support_chat)
workflow.add_node("planner", generate_study_plan)
workflow.add_node("general", run_general_chat)

workflow.set_conditional_entry_point(
    route_query,
    {
        "study": "rag",
        "support": "support",
        "planner": "planner",
        "general": "general",
    },
)

workflow.add_edge("rag", END)
workflow.add_edge("support", END)
workflow.add_edge("planner", END)
workflow.add_edge("general", END)

graph = workflow.compile()
