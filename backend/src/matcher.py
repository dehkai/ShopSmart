import sys
import json
import sqlite3
from typing import List
from pathlib import Path
from models import ItemMatch
from pydantic import BaseModel
from week_2.prompt_model import prompt_model


class MatcherResponse(BaseModel):
    matches: List[ItemMatch]


# gets list of items and its codes from the db
def fetch_db_items(db_path: Path) -> str:

    if not db_path.exists():
        print(f"[Error] Database not found at {db_path}", file=sys.stderr)
        sys.exit(1)

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute(
        """
            SELECT item_code, item
            FROM items
        """
    )
    rows = cursor.fetchall()
    connection.close()

    db_items = "\n".join([f"Code: {row[0]} | Name: {row[1]}" for row in rows])
    return db_items


# llm function that send the grocery lines to gemini with a list of items from the db
# and asks it to return json matches
def llm_match(query_text: str, db_context: str) -> str:

    matcher_prompt = f"""
        You are an expert data normalization agent mapping messy grocery items to an official database catalog.

        ### TASKS:
        1. Parse the following messy user input string: "{query_text}"
        2. For each identified grocery item in the input, find the absolute best semantic match from the provided Official Database Catalog.
        3. If an item matches reasonably well, populate the item_code and item_name from the catalog, calculate a confidence score (0.0 to 1.0), and set resolved to true.
        4. If no logical match exists in the catalog, set item_code and item_name to null, and resolved to false.

        ### OFFICIAL DATABASE CATALOG:
        {db_context}

        ### OUTPUT FORMAT:
        Return a JSON object matching this JSON Schema:
        {json.dumps(MatcherResponse.model_json_schema(), indent=2)}
    """

    response = prompt_model("gemini-2.5-flash-lite", matcher_prompt)
    return response


def main():
    # test input: "telur gred A, beras 5kg, minyak masak"
    # capture input from terminal execution: uv run matcher.py "grocery, list, here"
    if len(sys.argv) < 2:
        print("[Error] Please provide a grocery list.", file=sys.stderr)
        print('Usage: uv run matcher.py "telur gred A, beras 5kg"', file=sys.stderr)
        sys.exit(1)

    user_query = sys.argv[1]

    output_dir = Path(__file__).resolve().parent.parent.parent / "data"
    db_file = output_dir / "pricecatcher.db"

    print("Fetching reference catalog from database...")
    db_items_context = fetch_db_items(db_file)

    print(f"Processing semantic matches for: '{user_query}'...")
    raw_json_response = llm_match(user_query, db_items_context)

    print("\n--- Match Results ---")
    print(raw_json_response)


if __name__ == "__main__":
    main()
