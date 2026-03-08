from app.rag.rag_chain import run_study_rag, run_support_chat, get_llm
from app.agents.planner_agent import generate_study_plan
from typing import TypedDict
from langgraph.graph import StateGraph, END

# ---------------- STATE ----------------
class State(TypedDict):
    query: str
    response: str
    type: str  # "study", "support", "planner", "general"


# ---------------- GENERAL CHAT ----------------
def run_general_chat(state: State):
    try:
        query = state["query"]
        llm_engine = get_llm()

        if not llm_engine:
             return {"response": "AI Brain is offline. Please start Ollama or provide an OpenAI API Key in settings."}

        if "analyzing lecture" in query.lower():
            prompt = f"""
Convert this lecture into Cornell Notes format:

## 📝 Summary
## 🔑 Key Concepts
## 🚀 Action Items

Transcript:
{query}
"""
            response = llm_engine.invoke(prompt)
        else:
            response = llm_engine.invoke(query)

        if isinstance(response, str):
            final_response = response
        elif hasattr(response, "content"):
            final_response = response.content
        else:
            final_response = str(response)

        return {"response": final_response}
    except Exception as e:
        print(f"General Chat Error: {e}")
        return {"response": "I encountered an error processing your request. Please ensure Ollama is running with the phi3 model."}


# ---------------- ROUTER ----------------
def route_query(state: State):
    import re
    chat_type = state.get("type", "study").lower()
    query = state["query"].lower().strip()

    # Normalize query for easier matching
    clean_query = re.sub(r'[^\w\s]', '', query)

    if chat_type == "study":
        # Greetings -> Support
        if clean_query in ["hi", "hello", "hey", "hii", "heyy"]:
            return "support"
        
        # Scheduling -> Planner
        if any(k in clean_query for k in ["plan", "schedule", "timetable", "roadmap"]):
            return "planner"
        
        # Creative/Tools -> General
        if any(k in clean_query for k in ["rewrite", "improve", "paraphrase", "project", "idea"]):
            return "general"

    return chat_type


# ---------------- GRAPH ----------------
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
        "general": "general"
    }
)

workflow.add_edge("rag", END)
workflow.add_edge("support", END)
workflow.add_edge("planner", END)
workflow.add_edge("general", END)

graph = workflow.compile()