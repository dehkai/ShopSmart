import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app import app
from src.models import BasketResult, ItemMatch, BasketItemResult


@pytest.fixture
def client():
    return TestClient(app)


@patch("app.DB_FILE")
def test_handle_basket_missing_db(mock_db_file, client):
    # Simulate DB file missing
    mock_db_file.exists.return_value = False

    response = client.post("/basket", json={"grocery_list": "telur, beras"})
    assert response.status_code == 500
    assert response.json()["detail"] == "Database reference file missing!"


@patch("app.DB_FILE")
@patch("app.fetch_db_items")
@patch("app.match_items")
@patch("app.optimize")
def test_handle_basket_success(
    mock_optimize, mock_match_items, mock_fetch_db_items, mock_db_file, client
):
    mock_db_file.exists.return_value = True
    mock_fetch_db_items.return_value = [(1, "Beras", "5kg")]

    # Mock MatcherResponse
    mock_matches = [
        ItemMatch(
            query="beras", item_code=1, item_name="Beras", confidence=0.9, resolved=True
        )
    ]
    mock_matcher_res = MagicMock()
    mock_matcher_res.matches = mock_matches
    mock_matcher_res.is_fuzzy_fallback = False
    mock_matcher_res.error = None
    mock_match_items.return_value = mock_matcher_res

    # Mock BasketResult
    mock_basket_result = BasketResult(
        matches=mock_matches,
        items=[BasketItemResult(item_code=1, item_name="Beras", store_price=9.0)],
        total=9.0,
        savings=1.0,
        is_single_store=True,
    )
    mock_optimize.return_value = mock_basket_result

    payload = {
        "grocery_list": "beras",
        "state": "Selangor",
        "provider": "gemini",
        "model": "gemini-2.5-flash",
        "api_key": "dummy-key",
    }
    response = client.post("/basket", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 9.0
    assert data["savings"] == 1.0
    assert len(data["items"]) == 1
    assert data["items"][0]["item_name"] == "Beras"


@patch("app.DB_FILE")
def test_handle_basket_invalid_payload(mock_db_file, client):
    mock_db_file.exists.return_value = True

    # Missing required 'grocery_list'
    response = client.post("/basket", json={"state": "Selangor"})
    assert response.status_code == 422  # Pydantic validation error


@patch("app.DB_FILE")
@patch("app.fetch_db_items")
def test_search_items_all(mock_fetch_db_items, mock_db_file, client):
    mock_db_file.exists.return_value = True
    mock_fetch_db_items.return_value = [
        (1, "Beras Siam", "5kg"),
        (2, "Minyak Masak", "1kg"),
    ]

    response = client.get("/items")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["item_code"] == 1
    assert data[0]["item_name"] == "Beras Siam"


@patch("app.DB_FILE")
@patch("app.fetch_db_items")
def test_search_items_filtered(mock_fetch_db_items, mock_db_file, client):
    mock_db_file.exists.return_value = True
    mock_fetch_db_items.return_value = [
        (1, "Beras Siam", "5kg"),
        (2, "Minyak Masak", "1kg"),
    ]

    response = client.get("/items?q=beras")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["item_name"] == "Beras Siam"

    # Case-insensitive / whitespace trimmed check
    response_trim = client.get("/items?q=  MINYAK  ")
    assert response_trim.status_code == 200
    data_trim = response_trim.json()
    assert len(data_trim) == 1
    assert data_trim[0]["item_name"] == "Minyak Masak"
