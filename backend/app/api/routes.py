import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.agents.orchestrator import OrchestratorAgent
from app.models.request import ShoppingRequest

router = APIRouter(prefix="/api/v1")


@router.post("/search")
async def search(req: ShoppingRequest) -> dict:  # type: ignore[type-arg]
    agent = OrchestratorAgent()
    result = await agent.run(req)
    return result.model_dump()


@router.post("/search/stream")
async def search_stream(req: ShoppingRequest) -> EventSourceResponse:
    async def event_generator() -> object:
        agent = OrchestratorAgent()
        async for event in agent.stream(req):
            yield {"data": json.dumps(event)}

    return EventSourceResponse(event_generator())
