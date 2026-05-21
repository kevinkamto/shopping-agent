from pydantic import BaseModel


class Product(BaseModel):
    title: str
    price: str
    url: str
    pros: list[str]
    cons: list[str]
    score: float
    reasoning: str


class ShoppingResponse(BaseModel):
    query: str
    products: list[Product]
    summary: str
    search_queries_used: list[str]
    agent_trace: list[str]
