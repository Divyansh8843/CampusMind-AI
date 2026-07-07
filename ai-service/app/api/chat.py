from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class ContextChunk(BaseModel):
    source: str = Field(default="Uploaded document", max_length=500)
    content: str = Field(min_length=1, max_length=5000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=20000)
    type: Literal["study", "support", "planner", "general"] = "study"
    user_id: str = Field(default="anonymous", max_length=200)

    context_chunks: list[ContextChunk] = Field(
        default_factory=list,
        max_length=5
)


@router.post("/chat")
def chat(payload: ChatRequest):
    from app.agents.agent_graph import graph

    result = graph.invoke(
        {
            "query": payload.message,
            "type": payload.type,
            "user_id": payload.user_id,
            "context_chunks": [chunk.model_dump() for chunk in payload.context_chunks],
        }
    )
    if isinstance(result, dict):
        response = result.get("response", "")
        return {"response": str(response)}
    return {"response": str(result)}
