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
        # ── Orchestrator: plan ──────────────────────────────────────────────
        yield _event("orchestrator", "running", f'Planning pipeline for: "{req.query}"')

        # ── Search: live per-query events via async generator ───────────────
        raw_results: list[Any] = []
        async for msg in self.search.stream(req.query, req.max_results):
            if msg["type"] == "event":
                yield _event("search", msg["status"], msg["message"])
            else:
                raw_results = msg["data"]

        yield _event("search", "done", f"Completed {len(raw_results)} searches")

        # ── Analysis: concurrent, events collected then flushed ─────────────
        yield _event("orchestrator", "running", "Coordinating analysis phase…")

        analysis_log: list[tuple[str, str]] = []

        def on_analysis(status: str, msg: str) -> None:
            analysis_log.append((status, msg))

        analyses: list[list[AnalysedProduct]] = list(
            await asyncio.gather(*[
                self.analysis.run(r, on_event=on_analysis) for r in raw_results
            ])
        )

        for status, msg in analysis_log:
            yield _event("analysis", status, msg)

        deduped = _dedup(analyses)
        total = sum(len(a) for a in deduped)
        yield _event("analysis", "done", f"Extracted {total} unique candidate products")

        # ── Recommender ─────────────────────────────────────────────────────
        yield _event("orchestrator", "running", "Coordinating ranking phase…")

        recommender_log: list[tuple[str, str]] = []

        def on_recommender(status: str, msg: str) -> None:
            recommender_log.append((status, msg))

        result = await self.recommender.run(req, deduped, on_event=on_recommender)

        for status, msg in recommender_log:
            yield _event("recommender", status, msg)

        yield _event("recommender", "done", f"Selected {len(result.products)} products")

        # ── Orchestrator: done ───────────────────────────────────────────────
        yield _event("orchestrator", "done", "Pipeline complete")
        yield {"type": "result", "result": result.model_dump()}


def _dedup(analyses: list[list[AnalysedProduct]]) -> list[list[AnalysedProduct]]:
    """Flatten and deduplicate by URL (falling back to title), then re-wrap for the recommender."""
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

