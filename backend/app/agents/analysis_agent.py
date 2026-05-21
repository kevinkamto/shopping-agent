from __future__ import annotations

import json
from collections.abc import Callable

from app.agents.search_agent import RawSearchResult
from app.config import settings
from app.services.openai_client import get_openai_client


class AnalysedProduct:
    def __init__(
        self,
        title: str,
        price: str,
        url: str,
        pros: list[str],
        cons: list[str],
        raw_score: float,
        reasoning: str,
        source_query: str,
    ) -> None:
        self.title = title
        self.price = price
        self.url = url
        self.pros = pros
        self.cons = cons
        self.raw_score = raw_score
        self.reasoning = reasoning
        self.source_query = source_query


class AnalysisAgent:
    async def run(
        self,
        raw: RawSearchResult,
        on_event: Callable[[str, str], None] | None = None,
    ) -> list[AnalysedProduct]:
        if not raw.results:
            return []

        label = raw.query if len(raw.query) <= 55 else raw.query[:52] + "…"
        if on_event:
            on_event("running", f'Extracting products from: "{label}"')

        client = get_openai_client()
        results_text = json.dumps(raw.results, indent=2)

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a product analysis agent. Given raw search results, "
                        "extract structured product information. For each product found, "
                        "return a JSON object with keys: title, price (as string with currency symbol), "  # noqa: E501
                        "url, pros (list of strings), cons (list of strings), "
                        "raw_score (float 0-1 based on apparent quality/value), reasoning (string). "  # noqa: E501
                        "Return a JSON object with a 'products' array."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Search query: {raw.query}\n\nResults:\n{results_text}",
                },
            ],
            response_format={"type": "json_object"},
            timeout=settings.agent_timeout_seconds,
        )

        content = response.choices[0].message.content or '{"products": []}'
        data = json.loads(content)
        products = []
        for p in data.get("products", []):
            products.append(
                AnalysedProduct(
                    title=p.get("title", "Unknown Product"),
                    price=p.get("price", "Price unavailable"),
                    url=p.get("url", ""),
                    pros=p.get("pros", []),
                    cons=p.get("cons", []),
                    raw_score=float(p.get("raw_score", 0.5)),
                    reasoning=p.get("reasoning", ""),
                    source_query=raw.query,
                )
            )

        if on_event:
            on_event("running", f"Extracted {len(products)} products")

        return products
