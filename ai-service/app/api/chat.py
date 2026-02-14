from fastapi import APIRouter
from app.agents.agent_graph import graph

router = APIRouter()

@router.post("/chat")
def chat(payload: dict):
    return graph.invoke({
        "query": payload["message"],
        "type": payload.get("type", "study")
    })
