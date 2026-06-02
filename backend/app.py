from fastapi import FastAPI, status, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pathlib import Path

from src.matcher import fetch_db_items, match_items 
from src.optimizer import optimize
from src.models import BasketResult

app = FastAPI()

class Basket(BaseModel):
    grocery_list: str

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_FILE = DATA_DIR / "pricecatcher.db"

# POST /basket endpoint
@app.post("/basket", response_model=BasketResult, status_code=status.HTTP_200_OK)

# def handle_basket(grocery_list: str):
def handle_basket(payload: Basket):

    # receives the grocery list text
    # grocery_list = "telur gred A, beras 5kg, minyak masak"
    if not DB_FILE.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database reference file missing!"
        )
    
    try:
        db_items_context = fetch_db_items(DB_FILE)
        # calls the match_items(grocery_list: str, db_path: str) -> MatcherResponse
        matcher_response = match_items(payload.grocery_list, db_items_context)
        # passes the result to the optimize(matches: list[ItemMatch], db_path: str) -> BasketResult
        optimized_basket = optimize(matcher_response.matches, str(DB_FILE))
        return optimized_basket
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your basket: {str(e)}"
        )

# GET /items endpoint
@app.get("/items")
def search_items(q: str = Query(None, description="Search query to filter items by name")):
    
    # simple search endpoint that lets frontend to lookup item names
    try:
        # fetch raw items from db
        db_items_context = fetch_db_items(DB_FILE)

        # return full list if no query provided
        if not q:
            return [{"item_code": item[0], "item_name": item[1]} for item in db_items_context]
        
        # filter items by name
        search_term = q.lower().strip()
        filtered_items = [
            {"item_code": item[0], "item_name": item[1]}
            for item in db_items_context
            if search_term in item[1].lower()
        ]

        return filtered_items
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database search failed: {str(e)}"
        )