from app.rag.rag_chain import run_study_rag, run_support_chat
from app.agents.planner_agent import generate_study_plan

from typing import TypedDict, Annotated, List
from langgraph.graph import StateGraph, END

# --- State Definition ---
class State(TypedDict):
    query: str
    response: str
    type: str # "study", "support", "planner", "general"

from langchain_ollama import OllamaLLM

# --- 3. General Chat (No RAG) ---
def run_general_chat(state: State):
    """Handles general queries without document retrieval (e.g. rewriting text, lecture notes)."""
    print("--- RUNNING GENERAL CHAT ---")
    query = state['query']
    
    # Instantiate LLM directly
    llm = OllamaLLM(model="llama2", temperature=0.7)
    
    if "analyzing lecture" in query.lower():
        print("🎓 Processing Lecture Notes with Cornell Format...")
        prompt = (
            "You are an expert academic note-taker. "
            "Convert the following lecture transcript into structured Cornell Notes format.\n\n"
            "Include these sections:\n"
            "## 📝 Summary\n(Brief overview)\n\n"
            "## 🔑 Key Concepts\n(Bulleted main ideas)\n\n"
            "## 🚀 Action Items\n(Things to study or review)\n\n"
            f"Transcript:\n{query}"
        )
        response = llm.invoke(prompt)
    else:
        response = llm.invoke(query)
    
    return {"response": response}

# --- Router ---
def route_query(state: State):
    chat_type = state.get("type", "study").lower()
    
    # DEBUG: Print routing choice clearly
    print(f"\n{'='*30}")
    print(f"📡 INCOMING REQUEST: Query='{state['query']}' | Type='{chat_type}'")

    # Auto-detect greetings for support if type is missing or default
    query_lower = state['query'].lower().strip()
    if chat_type == "study":
        if query_lower in ["hi", "hello", "hey", "help"]:
            print("⚠️ Redirecting greeting to SUPPORT chat automatically.")
            chat_type = "support"
        elif any(keyword in query_lower for keyword in ["plan", "schedule", "timetable", "routine"]):
            print("⚠️ Redirecting to PLANNER agent based on keywords.")
            chat_type = "planner"
        elif "analyzing lecture" in query_lower:
             print("⚠️ Redirecting to GENERAL chat for Lecture Analysis.")
             chat_type = "general"
        elif any(keyword in query_lower for keyword in ["rewrite", "improve", "optimize", "paraphrase"]):
             print("⚠️ Redirecting to GENERAL chat for rewriting.")
             chat_type = "general"

    print(f"🔄 ROUTING TO: {chat_type.upper()}")
    print(f"{'='*30}\n")
    
    if chat_type == "planner":
        return "planner"
    elif chat_type == "support":
        return "support"
    elif chat_type == "general":
        return "general"
    else:
        return "rag"  # Default to Study RAG

# --- Graph Construction ---
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
        "general": "general"
    }
)

workflow.add_edge("rag", END)
workflow.add_edge("planner", END)
workflow.add_edge("support", END)
workflow.add_edge("general", END)

app = workflow.compile()

# Example usage (for testing)
if __name__ == "__main__":
    # Test cases
    print("--- Testing Study RAG ---")
    result = app.invoke({"query": "What is the capital of France?", "type": "study"})
    print(f"Response: {result['response']}\n")

    print("--- Testing Support Chat ---")
    result = app.invoke({"query": "I need help", "type": "support"})
    print(f"Response: {result['response']}\n")

    print("--- Testing Planner Agent ---")
    result = app.invoke({"query": "Create a study plan for my exams next week", "type": "planner"})
    print(f"Response: {result['response']}\n")

    print("--- Testing General Chat (Rewrite) ---")
    result = app.invoke({"query": "Rewrite this sentence: The quick brown fox jumps over the lazy dog.", "type": "general"})
    print(f"Response: {result['response']}\n")

    print("--- Testing Auto-detection for Support ---")
    result = app.invoke({"query": "Hi", "type": "study"}) # Should auto-detect as support
    print(f"Response: {result['response']}\n")

    print("--- Testing Auto-detection for Planner ---")
    result = app.invoke({"query": "Can you help me with my schedule?", "type": "study"}) # Should auto-detect as planner
    print(f"Response: {result['response']}\n")

    print("--- Testing Auto-detection for General ---")
    result = app.invoke({"query": "Improve this text: This is a bad sentence.", "type": "study"}) # Should auto-detect as general
    print(f"Response: {result['response']}\n")
