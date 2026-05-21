from __future__ import annotations

import asyncio  # used in run() for concurrent analysis
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

        # ── Analysis: sequential so events appear per-query, not all at once ──
        yield _event("orchestrator", "running", "Coordinating analysis phase…")

        analyses: list[list[AnalysedProduct]] = []
        for r in raw_results:
            task_log: list[tuple[str, str]] = []

            def _capture(status: str, msg: str, _log: list[tuple[str, str]] = task_log) -> None:
                _log.append((status, msg))

            group = await self.analysis.run(r, on_event=_capture)
            analyses.append(group)
            for status, msg in task_log:  # type: ignore
                yield _event("analysis", status, msg)  # type: ignore

        deduped = _dedup(analyses)
        total = sum(len(a) for a in deduped)
        yield _event("analysis", "done", f"Extracted {total} unique candidate products")

        # ── Recommender: yield "scoring" before the await so it appears live ─
        yield _event("orchestrator", "running", "Coordinating ranking phase…")
        n_candidates = sum(len(a) for a in deduped)
        yield _event("recommender", "running", f"Scoring {n_candidates} candidates with GPT-4o…")

        result = await self.recommender.run(req, deduped)

        yield _event("recommender", "running", f"Ranked {len(result.products)} products by score")
        yield _event("recommender", "done", f"Selected top {len(result.products)} products")

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
