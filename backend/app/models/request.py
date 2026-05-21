from pydantic import BaseModel, Field


class ShoppingRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    budget: float | None = Field(None, gt=0)
    currency: str = Field("USD", pattern="^[A-Z]{3}$")
    max_results: int = Field(5, ge=1, le=10)
