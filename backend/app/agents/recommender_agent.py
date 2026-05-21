from __future__ import annotations

import json

from app.agents.analysis_agent import AnalysedProduct
from app.config import settings
from app.models.request import ShoppingRequest
from app.models.response import Product, ShoppingResponse
from app.services.openai_client import get_openai_client


class RecommenderAgent:
    async def run(
        self,
        req: ShoppingRequest,
        analyses: list[list[AnalysedProduct]],
    ) -> ShoppingResponse:
        all_products = [p for group in analyses for p in group]
        if not all_products:
            return ShoppingResponse(
                query=req.query,
                products=[],
                summary="No products found for your query.",
                search_queries_used=[],
                agent_trace=["Recommender: no products to rank"],
            )

        search_queries_used = list({p.source_query for p in all_products})
        products_text = json.dumps(
            [
                {
                    "title": p.title,
                    "price": p.price,
                    "url": p.url,
                    "pros": p.pros,
                    "cons": p.cons,
                    "raw_score": p.raw_score,
                    "reasoning": p.reasoning,
                }
                for p in all_products
            ],
            indent=2,
        )

        budget_note = f" Budget constraint: {req.currency} {req.budget}." if req.budget else ""
        client = get_openai_client()

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a product recommender agent. Given a list of analysed products, "
                        "rank them and select the best ones for the user. "
                        "Return a JSON object with: "
                        "'products' (array, each with title, price, url, pros, cons, score (0-1), reasoning), "  # noqa: E501
                        "'summary' (string, 1-2 sentences overview), "
                        "'agent_trace' (array of strings describing your reasoning steps)."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"User query: {req.query}.{budget_note} "
                        f"Max results requested: {req.max_results}.\n\n"
                        f"Analysed products:\n{products_text}"
                    ),
                },
            ],
            response_format={"type": "json_object"},
            timeout=settings.agent_timeout_seconds,
        )

        content = (
            response.choices[0].message.content or '{"products":[],"summary":"","agent_trace":[]}'
        )
        data = json.loads(content)

        ranked = [
            Product(
                title=p.get("title", ""),
                price=p.get("price", ""),
                url=p.get("url", ""),
                pros=p.get("pros", []),
                cons=p.get("cons", []),
                score=float(p.get("score", 0.5)),
                reasoning=p.get("reasoning", ""),
            )
            for p in data.get("products", [])[: req.max_results]
        ]

        return ShoppingResponse(
            query=req.query,
            products=ranked,
            summary=data.get("summary", ""),
            search_queries_used=search_queries_used,
            agent_trace=data.get("agent_trace", []),
        )
