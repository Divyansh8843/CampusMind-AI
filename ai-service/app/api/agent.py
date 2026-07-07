from fastapi import APIRouter
from app.agents.agent_graph import graph

router = APIRouter()

@router.post("/study-plan")
def study_plan(payload: dict):
    return graph.invoke({
        "query": payload["query"],
        "performance": payload["performance"]
    })
