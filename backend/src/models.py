from pydantic import BaseModel, Field


class ItemMatch(BaseModel):
    query: str
    item_code: int | None = None
    item_name: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    resolved: bool = False


class PremisePrice(BaseModel):
    premise_code: int
    premise: str
    state: str
    price: float


class BasketItemResult(BaseModel):
    item_code: int
    item_name: str
    cheapest: PremisePrice | None = None
    store_price: float | None = None


class StateRanking(BaseModel):
    state: str
    total: float
    items_found: int


class StoreRanking(BaseModel):
    premise_code: int
    premise: str
    total: float
    items_found: int


class BasketResult(BaseModel):
    matches: list[ItemMatch]
    items: list[BasketItemResult]
    state_ranking: list[StateRanking] = Field(default_factory=list)
    store_ranking: list[StoreRanking] = Field(default_factory=list)
    total: float = 0.0
    savings: float = 0.0
    is_single_store: bool = True
    unresolved: list[str] = Field(default_factory=list)
    error: str | None = None
