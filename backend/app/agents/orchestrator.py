from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from typing import Any

from app.agents.analysis_agent import AnalysisAgent
from app.agents.recommender_agent import RecommenderAgent
from app.agents.search_agent import SearchAgent
from app.models.request import ShoppingRequest
from app.models.response import ShoppingResponse


class OrchestratorAgent:
    def __init__(self) -> None:
        self.search = SearchAgent()
        self.analysis = AnalysisAgent()
        self.recommender = RecommenderAgent()

    async def run(self, req: ShoppingRequest) -> ShoppingResponse:
        raw_results = await self.search.run(req.query, req.max_results)
        analyses = await asyncio.gather(*[self.analysis.run(r) for r in raw_results])
        return await self.recommender.run(req, list(analyses))

    async def stream(self, req: ShoppingRequest) -> AsyncGenerator[dict[str, Any], None]:
        yield {
            "type": "agent_event",
            "event": {
                "agent": "orchestrator",
                "status": "thinking",
                "message": f"Decomposing query: {req.query}",
                "timestamp": _now(),
            },
        }

        raw_results = await self.search.run(req.query, req.max_results)

        yield {
            "type": "agent_event",
            "event": {
                "agent": "search",
                "status": "done",
                "message": f"Found results for {len(raw_results)} search queries",
                "timestamp": _now(),
            },
        }

        yield {
            "type": "agent_event",
            "event": {
                "agent": "analysis",
                "status": "thinking",
                "message": f"Analysing {sum(len(r.results) for r in raw_results)} raw results",
                "timestamp": _now(),
            },
        }

        analyses = await asyncio.gather(*[self.analysis.run(r) for r in raw_results])
        total_products = sum(len(a) for a in analyses)

        yield {
            "type": "agent_event",
            "event": {
                "agent": "analysis",
                "status": "done",
                "message": f"Extracted {total_products} products",
                "timestamp": _now(),
            },
        }

        yield {
            "type": "agent_event",
            "event": {
                "agent": "recommender",
                "status": "thinking",
                "message": "Ranking and generating recommendations",
                "timestamp": _now(),
            },
        }

        result = await self.recommender.run(req, list(analyses))

        yield {
            "type": "agent_event",
            "event": {
                "agent": "recommender",
                "status": "done",
                "message": f"Ranked {len(result.products)} products",
                "timestamp": _now(),
            },
        }

        yield {"type": "result", "result": result.model_dump()}


def _now() -> int:
    import time

    return int(time.time() * 1000)
