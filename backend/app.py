import os
import sqlite3
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, status, HTTPException, Query
from pydantic import BaseModel, Field
from pathlib import Path

from src.matcher import fetch_db_items, match_items
from src.optimizer import optimize
from src.models import BasketResult

# Explicit path, not a bare load_dotenv(): that searches upward from the
# process's cwd, which silently misses backend/.env when uvicorn is started
# from the repo root (e.g. `uv run --app-dir backend uvicorn app:app`).
load_dotenv(Path(__file__).resolve().parent / ".env")

app = FastAPI()

ORS_API_KEY = os.environ.get("ORS_API_KEY")


class Basket(BaseModel):
    grocery_list: str
    state: str | None = None
    provider: str | None = None
    model: str | None = None
    api_key: str | None = None
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    radius_km: float | None = Field(default=None, gt=0, le=100)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_FILE = DATA_DIR / "pricecatcher.db"


@app.post("/basket", response_model=BasketResult, status_code=status.HTTP_200_OK)
def handle_basket(payload: Basket):

    # receives the grocery list text
    # grocery_list = "telur gred A, beras 5kg, minyak masak"
    if not DB_FILE.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database reference file missing!",
        )

    try:
        db_items_context = fetch_db_items(DB_FILE)
        matcher_response = match_items(
            payload.grocery_list,
            db_items_context,
            db_path=DB_FILE,
            model=payload.model,
            api_key=payload.api_key,
        )
        optimized_basket = optimize(
            matcher_response.matches,
            str(DB_FILE),
            state=payload.state,
            lat=payload.lat,
            lng=payload.lng,
            radius_km=payload.radius_km,
            ors_api_key=ORS_API_KEY,
        )
        optimized_basket.is_fuzzy_fallback = matcher_response.is_fuzzy_fallback
        if matcher_response.error:
            optimized_basket.error = matcher_response.error
        return optimized_basket

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your basket: {str(e)}",
        )


@app.get("/items")
def search_items(
    q: str = Query(None, description="Search query to filter items by name"),
):

    # simple search endpoint that lets frontend to lookup item names
    try:
        # fetch raw items from db
        db_items_context = fetch_db_items(DB_FILE)

        # return full list if no query provided
        if not q:
            return [
                {"item_code": item[0], "item_name": item[1]}
                for item in db_items_context
            ]

        # filter items by name
        search_term = q.lower().strip()
        filtered_items = [
            {"item_code": item[0], "item_name": item[1]}
            for item in db_items_context
            if search_term in item[1].lower()
        ]

        return filtered_items

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database search failed: {str(e)}")


@app.get("/meta")
def get_meta():
    # Non-critical info endpoint: never raise, just report what we know.
    try:
        if not DB_FILE.exists():
            return {"data_as_of": None}
        conn = sqlite3.connect(DB_FILE)
        row = conn.execute("SELECT MAX(date) FROM prices").fetchone()
        conn.close()
        if row is None or row[0] is None:
            return {"data_as_of": None}
        # `date` is stored as pandas datetime64 (ns-since-epoch).
        data_as_of = datetime.fromtimestamp(row[0] / 1e9, tz=timezone.utc).date().isoformat()
        return {"data_as_of": data_as_of}
    except Exception:
        return {"data_as_of": None}


@app.get("/items/{item_code}/prices")
def get_item_prices(
    item_code: int,
    state: str | None = Query(None, description="Filter prices by state"),
):
    try:
        from src.optimizer import get_item_prices_list
        prices = get_item_prices_list(item_code, str(DB_FILE), state=state)
        return prices
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch item prices: {str(e)}"
        )

