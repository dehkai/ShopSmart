import pytest
from unittest.mock import patch, MagicMock
from pydantic import ValidationError

from src.matcher import preprocess_text, fuzzy_match, match_items, MatcherResponse
from src.models import ItemMatch


def test_preprocess_text_empty():
    assert preprocess_text("") == ""
    assert preprocess_text(None) == ""


def test_preprocess_text_lowercasing_and_spacing():
    assert preprocess_text("BERAS 5KG") == "beras 5 kg"
    assert preprocess_text("Minyak Masak 1kg") == "minyak masak 1 kg"
    assert preprocess_text("susu 250ml") == "susu 250 ml"
    assert preprocess_text("1.5L air") == "1.5 l air"


def test_fuzzy_match_direct_match():
    # item: (item_code, item, unit)
    db_items = [
        (101, "Beras Siam", "5kg"),
        (102, "Minyak Masak", "1kg"),
        (103, "Telur Ayam Gred A", "10pcs"),
    ]
    
    results = fuzzy_match("beras siam 5kg, minyak masak", db_items)
    
    assert len(results) == 2
    assert results[0].resolved is True
    assert results[0].item_code == 101
    assert results[0].item_name == "Beras Siam"
    assert results[0].confidence > 0.6
    
    assert results[1].resolved is True
    assert results[1].item_code == 102
    assert results[1].item_name == "Minyak Masak"
    assert results[1].confidence > 0.6


def test_fuzzy_match_no_match():
    db_items = [
        (101, "Beras Siam", "5kg"),
    ]
    
    results = fuzzy_match("something completely unrelated", db_items)
    
    assert len(results) == 1
    assert results[0].resolved is False
    assert results[0].item_code is None
    assert results[0].item_name is None


def test_fuzzy_match_ignores_empty_queries():
    db_items = [
        (101, "Beras Siam", "5kg"),
    ]
    
    results = fuzzy_match("beras 5kg, , ", db_items)
    assert len(results) == 1
    assert results[0].resolved is True


@patch("src.matcher.prompt_model")
def test_match_items_happy_path(mock_prompt):
    db_items = [
        (101, "Beras Siam", "5kg"),
        (102, "Minyak Masak", "1kg"),
    ]
    
    mock_prompt.return_value = """
    {
      "matches": [
        {
          "query": "beras",
          "item_code": 101,
          "item_name": "Beras Siam",
          "confidence": 0.95,
          "resolved": true
        }
      ]
    }
    """
    
    response = match_items("beras", db_items)
    assert len(response.matches) == 1
    assert response.matches[0].resolved is True
    assert response.matches[0].item_code == 101
    assert response.matches[0].item_name == "Beras Siam"
    assert response.matches[0].confidence == 0.95


@patch("src.matcher.prompt_model")
def test_match_items_low_confidence_fallback(mock_prompt):
    db_items = [
        (101, "Beras Siam", "5kg"),
    ]
    
    # LLM returns match but with low confidence (< 0.7)
    mock_prompt.return_value = """
    {
      "matches": [
        {
          "query": "beras 5kg",
          "item_code": 101,
          "item_name": "Beras Siam",
          "confidence": 0.5,
          "resolved": true
        }
      ]
    }
    """
    
    response = match_items("beras 5kg", db_items)
    assert len(response.matches) == 1
    # Fallback to fuzzy match should still resolve it if it meets the rapidfuzz threshold
    assert response.matches[0].resolved is True
    assert response.matches[0].item_code == 101


@patch("src.matcher.prompt_model")
def test_match_items_invalid_code_fallback(mock_prompt):
    db_items = [
        (101, "Beras Siam", "5kg"),
    ]
    
    # LLM returns invalid item_code 999
    mock_prompt.return_value = """
    {
      "matches": [
        {
          "query": "beras 5kg",
          "item_code": 999,
          "item_name": "Ghost Item",
          "confidence": 0.95,
          "resolved": true
        }
      ]
    }
    """
    
    response = match_items("beras 5kg", db_items)
    assert len(response.matches) == 1
    # Fallback to fuzzy match should match "beras 5kg" to code 101
    assert response.matches[0].resolved is True
    assert response.matches[0].item_code == 101


@patch("src.matcher.prompt_model")
def test_match_items_invalid_json_fallback(mock_prompt):
    db_items = [
        (101, "Beras Siam", "5kg"),
    ]
    
    mock_prompt.return_value = "invalid json format here"
    
    # If JSON is invalid, should fall back entirely to fuzzy match
    response = match_items("beras 5kg", db_items)
    assert len(response.matches) == 1
    assert response.matches[0].resolved is True
    assert response.matches[0].item_code == 101


def test_fetch_db_items_success(tmp_path):
    import sqlite3
    from pathlib import Path
    from src.matcher import fetch_db_items

    db_file = tmp_path / "test_db.db"
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE items (
            item_code INTEGER,
            item TEXT,
            unit TEXT
        )
    """)
    cursor.execute("INSERT INTO items VALUES (101, 'Beras Siam', '5kg')")
    conn.commit()
    conn.close()

    items = fetch_db_items(Path(db_file))
    assert len(items) == 1
    assert items[0] == (101, "Beras Siam", "5kg")


def test_fetch_db_items_missing_file():
    from pathlib import Path
    from src.matcher import fetch_db_items

    with pytest.raises(SystemExit) as exc_info:
        fetch_db_items(Path("non_existent_db_file.db"))
    
    assert exc_info.value.code == 1

