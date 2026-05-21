from __future__ import annotations

import asyncio
import time
from collections.abc import AsyncGenerator
from typing import Any

from app.agents.analysis_agent import AnalysedProduct, AnalysisAgent
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
        return await self.recommender.run(req, _dedup(list(analyses)))

    async def stream(self, req: ShoppingRequest) -> AsyncGenerator[dict[str, Any], None]:
        yield _event("orchestrator", "running", f'Planning search strategy for: "{req.query}"')

        yield _event("search", "running", "Generating targeted search queries…")
        raw_results = await self.search.run(req.query, req.max_results)
        yield _event("search", "done", f"Completed {len(raw_results)} search queries")

        total_raw = sum(len(r.results) for r in raw_results)
        yield _event("analysis", "running", f"Analysing {total_raw} raw results…")
        analyses = await asyncio.gather(*[self.analysis.run(r) for r in raw_results])
        deduped = _dedup(list(analyses))
        total_products = sum(len(a) for a in deduped)
        yield _event("analysis", "done", f"Extracted {total_products} unique candidate products")

        yield _event("recommender", "running", f"Ranking top {req.max_results} recommendations…")
        result = await self.recommender.run(req, deduped)
        yield _event("recommender", "done", f"Selected {len(result.products)} products")

        yield _event("orchestrator", "done", "Search complete")
        yield {"type": "result", "result": result.model_dump()}


def _dedup(analyses: list[list[AnalysedProduct]]) -> list[list[AnalysedProduct]]:
    """Flatten, deduplicate by URL (falling back to title), then re-wrap for the recommender."""
    seen: set[str] = set()
    unique: list[AnalysedProduct] = []
    for group in analyses:
        for p in group:
            key = p.url.strip().rstrip("/").lower() or p.title.strip().lower()
            if key not in seen:
                seen.add(key)
                unique.append(p)
    return [unique]


def _event(agent: str, status: str, message: str) -> dict[str, Any]:
    return {
        "type": "agent_event",
        "event": {
            "agent": agent,
            "status": status,
            "message": message,
            "timestamp": int(time.time() * 1000),
        },
    }
