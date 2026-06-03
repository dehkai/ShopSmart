import re
import sys
import json
import sqlite3
from typing import List, Tuple, Set
from pathlib import Path

from pydantic import BaseModel, ValidationError
from rapidfuzz import fuzz, process

from src.models import ItemMatch
from src.week_2.prompt_model import prompt_model


class MatcherLLMResponse(BaseModel):
    matches: List[ItemMatch]


class MatcherResponse(BaseModel):
    matches: List[ItemMatch]
    is_fuzzy_fallback: bool = False
    error: str | None = None



# --- 3-LAYER ITEM MATCHING FROM MESSY TEXT INPUT ---



def preprocess_text(text: str) -> str:

    if not text:
        return ""

    text = text.lower()
    text = re.sub(
        r"(\d+)\s*([a-zA-Z%]+)", r"\1 \2", text
    )  # "5kg" -> "5 kg", "1kg" -> "1 kg"

    return text


# --- layer 1 : fuzzy fallback using rapidfuzz (safety net when AI fails) ---
def fuzzy_match(
    query_text: str, db_items: List[Tuple[int, str, str]]
) -> List[ItemMatch]:

    # split individual messy line: "telur gred A, beras 5kg" -> ["telur gred A", "beras 5kg"]
    queries = [q.strip() for q in query_text.split(",") if q.strip()]
    results = []

    # separate item names and units from the db for the rapidfuzz processor to scan
    # "item_name", "unit" -> "item_name unit"
    catalog_combined = [preprocess_text(f"{item[1]} {item[2]}") for item in db_items]

    for sub_query in queries:
        cleaned_query = preprocess_text(sub_query)

        match_result = process.extractOne(
            cleaned_query,
            catalog_combined,
            scorer=fuzz.token_set_ratio,
            score_cutoff=60.0,
        )

        if match_result:
            matched_name, score, index = match_result
            corresponding_code = db_items[index][0]
            original_item_name = db_items[index][1]

            results.append(
                ItemMatch(
                    query=sub_query,
                    item_code=corresponding_code,
                    item_name=original_item_name,
                    confidence=round(score / 100.0, 2),
                    resolved=True,
                )
            )
        else:
            results.append(ItemMatch(query=sub_query, resolved=False))

    return results


# gets list of items, item codes and its units from the db
def fetch_db_items(db_path: Path) -> List[Tuple[int, str, str]]:

    if not db_path.exists():
        print(f"[Error] Database not found at {db_path}", file=sys.stderr)
        sys.exit(1)

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute(
        """
            SELECT item_code, item, unit
            FROM items
        """
    )
    rows = cursor.fetchall()
    connection.close()

    return rows

# gets list of item codes with price records from prices table
def fetch_db_prices(db_path: Path) -> Set[int]:

    connection = None
    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()
        cursor.execute(
            """
                SELECT DISTINCT item_code 
                FROM prices 
                WHERE price IS NOT NULL AND price != 0 AND TRIM(CAST(price AS TEXT)) != ''
            """
        )
        rows = cursor.fetchall()

        # extract individual codes into a hash set for price record validation
        return {row[0] for row in rows}
        
    except sqlite3.Error as e:
        print(f"Database error while fetching price records: {e}")
        return set()
    finally:
        if connection:
            connection.close()


# --- layer 2 : LLM function that sends the grocery lines to gemini
# with a list of items from the db & asks it to return json matches ---
def llm_match(
    query_text: str,
    db_context: List[Tuple[int, str, str]],
    model: str | None = None,
    api_key: str | None = None,
) -> str:

    # format the structured tuple list into a clean, text-based catalog for the LLM
    catelog_lines = []
    for (
        item_code,
        item,
        unit,
    ) in db_context:
        catelog_lines.append(f"Code: {item_code} | Name: {item} | Unit: {unit}")

    formatted_db_context = "\n".join(catelog_lines)

    matcher_prompt = f"""
        You are an expert data normalization agent mapping messy grocery items to an official Malaysian database catalog.

        ### IMPORTANT LANGUAGE RULES:
        - User input may be in English, Malay, or a mix of both.
        - The database catalog is in Malay (Bahasa Malaysia).
        - You MUST translate English item names to their Malay equivalents before matching.
        - Common translations: onion=bawang, rice=beras, egg=telur, chicken=ayam, milk=susu,
          flour=tepung, sugar=gula, oil=minyak, fish=ikan, beef=daging lembu, pork=babi,
          salt=garam, bread=roti, butter=mentega, potato=kentang, carrot=lobak merah,
          tomato=tomato, garlic=bawang putih, chili=cili, prawn=udang, crab=ketam.
        - Also handle typos and partial words (e.g. "bwang" -> "bawang").

        ### TASKS:
        1. Parse the following messy user input string: "{query_text}"
        2. For each identified grocery item, translate to Malay if needed, then find the absolute best semantic match from the Official Database Catalog. Consider both Item Name and Unit.
        3. Select exactly ONE best matching item_code per input item. Do not return multiple brands.
        4. If an item matches reasonably well, populate item_code and item_name from the catalog, set confidence (0.0-1.0), and set resolved to true.
        5. If no logical match exists, set item_code and item_name to null and resolved to false.

        ### OFFICIAL DATABASE CATALOG:
        {formatted_db_context}

        ### OUTPUT FORMAT:
        Return a JSON object matching this JSON Schema:
        {json.dumps(MatcherLLMResponse.model_json_schema(), indent=2)}
    """


    resolved_model = model or "gemini-2.5-flash-lite"
    response = prompt_model(resolved_model, matcher_prompt, api_key=api_key)
    return response


# --- layer 3: tries LLM first, validate results, then falls back to fuzzy matching if needed ---
def match_items(
    query_text: str,
    db_items: List[Tuple[int, str, str]],
    db_path: Path,
    model: str | None = None,
    api_key: str | None = None,
) -> MatcherResponse:
    print(f"Attempting item match via LLM for: '{query_text}'...")

    # get raw llm output and clean it
    raw_llm_output = llm_match(query_text, db_items, model=model, api_key=api_key)
    llm_json_output = raw_llm_output.strip()

    is_fuzzy_fallback = False
    error_msg = None

    if raw_llm_output.startswith(("[Error]", "[Gemini Error]", "[Ollama Error]")):
        is_fuzzy_fallback = True
        error_msg = raw_llm_output
        print(f"LLM call failed with error: {error_msg}. Executing full fuzzy match fallback...")
        final_matches = fuzzy_match(query_text, db_items)
    else:
        llm_json_output = re.sub(r"^\s*```json", "", llm_json_output)
        llm_json_output = re.sub(r"\s*```$", "", llm_json_output)

        # get valid item codes from db for verification
        valid_db_codes = {item[0] for item in db_items}
        valid_price_codes = fetch_db_prices(db_path)
        final_matches: List[ItemMatch] = []

        try:
            llm_response = MatcherLLMResponse.model_validate_json(llm_json_output)

            for match in llm_response.matches:
                is_valid_code = match.item_code in valid_db_codes
                has_price_record = match.item_code in valid_price_codes
                is_confident = match.confidence >= 0.7

                # check for resolve, item_code exists in db, high confidence
                if match.resolved and match.item_code and is_valid_code and has_price_record and is_confident:
                    final_matches.append(match)
                else:
                    # fallback to fuzzy_match()
                    print(
                        f"LLM item match failed validation for '{match.query}'. Falling back to fuzzy match..."
                    )
                    is_fuzzy_fallback = True
                    if not error_msg:
                        if not match.resolved or not match.item_code:
                            reason = "unresolved in catalog"
                        elif not is_valid_code:
                            reason = "returned invalid catalog code"
                        elif not has_price_record:
                            reason = "price record unavailable for this item"
                        else:
                            reason = f"low confidence ({match.confidence})"
                        error_msg = f"LLM matched item '{match.query}' failed validation: {reason}"
                    fallback_results = fuzzy_match(match.query, db_items)
                    if fallback_results and fallback_results[0].item_code in valid_price_codes:
                        fuzzy_result = fallback_results[0]
                        final_matches.append(ItemMatch(
                            query=fuzzy_result.query,
                            item_code=fuzzy_result.item_code,
                            item_name=fuzzy_result.item_name,
                            confidence=fuzzy_result.confidence,
                            resolved=fuzzy_result.resolved,
                            match_type="fuzzy",
                        ))
                    else:
                        had_catalog_match = bool(match.item_name and match.item_code)
                        final_matches.append(ItemMatch(
                            query=match.query,
                            item_code=None,
                            item_name=match.item_name if had_catalog_match else None,
                            confidence=match.confidence if had_catalog_match else 0.0,
                            resolved=False,
                            match_type="fuzzy",
                        ))

        except (ValidationError, json.JSONDecodeError) as e:
            # fallback to fuzzy_match()
            is_fuzzy_fallback = True
            error_msg = f"LLM returned invalid JSON structure: {e}"
            print(
                f"LLM returned invalid structure: {e}. Executing full fuzzy match fallback..."
            )
            fallback_results = fuzzy_match(query_text, db_items)
            final_matches = [
                ItemMatch(
                    query=res.query,
                    item_code=res.item_code,
                    item_name=res.item_name,
                    confidence=res.confidence,
                    resolved=res.resolved,
                    match_type="fuzzy",
                )
                for res in fallback_results
                if res.item_code in valid_price_codes
            ]

    return MatcherResponse(matches=final_matches, is_fuzzy_fallback=is_fuzzy_fallback, error=error_msg)



def main():
    # test input = "telur gred A, beras 5kg, minyak masak"
    # capture input from terminal execution: uv run matcher.py <test input>
    if len(sys.argv) < 2:
        print("[Error] Please provide a grocery list.", file=sys.stderr)
        print('Usage: uv run matcher.py "telur gred A, beras 5kg"', file=sys.stderr)
        sys.exit(1)

    user_query = sys.argv[1]

    output_dir = Path(__file__).resolve().parent.parent.parent / "data"
    db_file = output_dir / "pricecatcher.db"

    print("Fetching reference catalog from database...")
    db_items_context = fetch_db_items(db_file)

    # call three-layered item matching
    final_response = match_items(user_query, db_items_context)

    print("\n--- Final Validated Match Results ---")
    print(final_response.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
