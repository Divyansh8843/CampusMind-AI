from .study_agent import study_agent
from langgraph.graph import StateGraph

# Define the State type (optional but good for type checking)
class AgentState(dict):
    query: str
    response: str
    context: str
    type: str

# Create graph
builder = StateGraph(AgentState)

# Nodes
builder.add_node("study", study_agent)

# Entry and Exit
builder.set_entry_point("study")
builder.set_finish_point("study")

graph = builder.compile()
