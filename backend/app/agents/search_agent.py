from __future__ import annotations

import json

from app.config import settings
from app.services.openai_client import get_openai_client
from app.services.tavily_client import get_tavily_client


class RawSearchResult:
    def __init__(self, query: str, results: list[dict[str, str]]) -> None:
        self.query = query
        self.results = results


class SearchAgent:
    async def run(self, query: str, max_results: int) -> list[RawSearchResult]:
        search_queries = await self._generate_queries(query)
        raw: list[RawSearchResult] = []
        tavily = get_tavily_client()

        for sq in search_queries:
            response = await tavily.search(
                query=sq,
                max_results=max_results,
                search_depth="advanced",
            )
            results = [
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "content": r.get("content", ""),
                }
                for r in response.get("results", [])
            ]
            raw.append(RawSearchResult(query=sq, results=results))

        return raw

    async def _generate_queries(self, user_query: str) -> list[str]:
        client = get_openai_client()
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a search query generator for a shopping assistant. "
                        "Given a user's shopping query, generate 2-3 targeted search queries "
                        "to find the best products. Return a JSON array of strings only."
                    ),
                },
                {"role": "user", "content": user_query},
            ],
            response_format={"type": "json_object"},
            timeout=settings.agent_timeout_seconds,
        )
        content = response.choices[0].message.content or '{"queries": []}'
        data = json.loads(content)
        queries: list[str] = data.get("queries", [user_query])
        return queries if queries else [user_query]
