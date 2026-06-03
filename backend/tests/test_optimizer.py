import pytest
import sqlite3
from pathlib import Path
from src.optimizer import (
    find_cheapest_item,
    get_premise_info,
    get_item_price_at_store,
    find_cheapest_store,
    state_ranking,
    top_stores_in_state,
    _average_total,
    optimize
)
from src.models import ItemMatch, PremisePrice, BasketResult


@pytest.fixture
def test_db(tmp_path):
    db_file = tmp_path / "test_pricecatcher.db"
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
        CREATE TABLE items (
            item_code INTEGER PRIMARY KEY,
            item TEXT,
            unit TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE premises (
            premise_code INTEGER PRIMARY KEY,
            premise TEXT,
            state TEXT,
            address TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE prices (
            item_code INTEGER,
            premise_code INTEGER,
            price REAL,
            date TEXT,
            PRIMARY KEY (item_code, premise_code)
        )
    """)
    
    # Insert dummy items
    cursor.executemany("INSERT INTO items VALUES (?, ?, ?)", [
        (1, "Beras 5kg", "5kg"),
        (2, "Minyak 1kg", "1kg"),
        (3, "Telur 10pcs", "10pcs"),
        (4, "Susu 1L", "1L"),
    ])
    
    # Insert dummy premises
    cursor.executemany("INSERT INTO premises VALUES (?, ?, ?, ?)", [
        (10, "Mydin Shah Alam", "Selangor", "Address A"),
        (11, "Lotus's Ara Damansara", "Selangor", "Address B"),
        (20, "Giant Cheras", "W.P. Kuala Lumpur", "Address C"),
        (21, "Aeon Wangsa Maju", "W.P. Kuala Lumpur", "Address D"),
    ])
    
    # Insert dummy prices
    cursor.executemany("INSERT INTO prices VALUES (?, ?, ?, ?)", [
        # Selangor Store 10 stocks all 3 items
        (1, 10, 10.0, "2026-05-01"),
        (2, 10, 5.0, "2026-05-01"),
        (3, 10, 3.0, "2026-05-01"),
        # Selangor Store 11 stocks items 1 & 2 but cheaper
        (1, 11, 9.0, "2026-05-01"),
        (2, 11, 4.5, "2026-05-01"),
        # KL Store 20 stocks all 3 items (cheaper than store 10)
        (1, 20, 8.5, "2026-05-01"),
        (2, 20, 4.0, "2026-05-01"),
        (3, 20, 2.5, "2026-05-01"),
        # KL Store 21 stocks only item 1 (very cheap) and item 4
        (1, 21, 8.0, "2026-05-01"),
        (4, 21, 4.0, "2026-05-01"),
    ])
    
    conn.commit()
    conn.close()
    
    return str(db_file)


def test_find_cheapest_item_global(test_db):
    cheapest = find_cheapest_item(1, test_db)
    assert cheapest is not None
    assert cheapest.premise_code == 21  # Aeon Wangsa Maju (8.0)
    assert cheapest.price == 8.0
    assert cheapest.state == "W.P. Kuala Lumpur"


def test_find_cheapest_item_state_filtered(test_db):
    cheapest = find_cheapest_item(1, test_db, state="Selangor")
    assert cheapest is not None
    assert cheapest.premise_code == 11  # Lotus's (9.0)
    assert cheapest.price == 9.0
    assert cheapest.state == "Selangor"


def test_find_cheapest_item_missing(test_db):
    cheapest = find_cheapest_item(999, test_db)
    assert cheapest is None


def test_get_premise_info(test_db):
    info = get_premise_info(10, test_db)
    assert info == ("Mydin Shah Alam", "Selangor", "Address A")
    
    assert get_premise_info(999, test_db) is None


def test_get_item_price_at_store(test_db):
    price = get_item_price_at_store(1, 10, test_db)
    assert price == 10.0
    
    assert get_item_price_at_store(3, 11, test_db) is None


def test_find_cheapest_store_global(test_db):
    # Store 20 stocks all 3 (8.5 + 4.0 + 2.5 = 15.0)
    # Store 10 stocks all 3 (10 + 5 + 3 = 18.0)
    result = find_cheapest_store([1, 2, 3], test_db)
    assert result == (20, 15.0)


def test_find_cheapest_store_state_filtered(test_db):
    # Selangor: only Store 10 stocks all 3 items (total 18.0)
    result = find_cheapest_store([1, 2, 3], test_db, state="Selangor")
    assert result == (10, 18.0)
    
    # Store 11 does not stock item 3, so looking for all 3 in Selangor on store 11 returns None
    result_none = find_cheapest_store([1, 2, 3], test_db, state="Perak")
    assert result_none is None


def test_state_ranking(test_db):
    rankings = state_ranking([1, 2], test_db)
    # Selangor has Store 11 (9 + 4.5 = 13.5)
    # KL has Store 20 (8.5 + 4 = 12.5)
    assert len(rankings) == 2
    assert rankings[0].state == "W.P. Kuala Lumpur"
    assert rankings[0].total == 12.5
    assert rankings[1].state == "Selangor"
    assert rankings[1].total == 13.5


def test_top_stores_in_state_complete_stock(test_db):
    stores = top_stores_in_state([1, 2], test_db, state="Selangor")
    # Both Store 11 (13.5) and Store 10 (15.0) stock both items
    assert len(stores) == 2
    assert stores[0].premise_code == 11
    assert stores[0].total == 13.5
    assert stores[0].items_found == 2
    assert stores[1].premise_code == 10
    assert stores[1].total == 15.0
    assert stores[1].items_found == 2


def test_top_stores_in_state_partial_stock_fallback(test_db):
    # KL: items 2, 3, 4.
    # No store stocks all 3 (Store 20 has 2 & 3; Store 21 has 4).
    # Since complete stock is empty, should fallback.
    stores = top_stores_in_state([2, 3, 4], test_db, state="W.P. Kuala Lumpur")
    # Store 20 has 2 items (total = 4.0 + 2.5 = 6.5)
    # Store 21 has 1 item (total = 4.0)
    assert len(stores) == 2
    assert stores[0].premise_code == 20
    assert stores[0].items_found == 2
    assert stores[0].total == 6.5
    assert stores[1].premise_code == 21
    assert stores[1].items_found == 1
    assert stores[1].total == 4.0



def test_average_total(test_db):
    # Item 1 avg: (10 + 9 + 8.5 + 8) / 4 = 8.875
    # Item 2 avg: (5 + 4.5 + 4) / 3 = 4.5
    # Total avg: 8.875 + 4.5 = 13.375 -> round to 13.38
    avg = _average_total([1, 2], test_db)
    assert abs(avg - 13.375) < 1e-4


def test_optimize_happy_path(test_db):
    matches = [
        ItemMatch(query="beras", item_code=1, item_name="Beras 5kg", confidence=0.9, resolved=True),
        ItemMatch(query="minyak", item_code=2, item_name="Minyak 1kg", confidence=0.9, resolved=True),
    ]
    
    result = optimize(matches, test_db)
    assert isinstance(result, BasketResult)
    assert result.total == 12.5  # Store 20 (8.5 + 4.0)
    assert result.is_single_store is True
    assert len(result.items) == 2
    assert result.items[0].store_price == 8.5
    assert result.items[1].store_price == 4.0
    assert len(result.unresolved) == 0


def test_optimize_with_unresolved_and_partial_database_errors(test_db):
    matches = [
        ItemMatch(query="beras", item_code=1, item_name="Beras 5kg", confidence=0.9, resolved=True),
        ItemMatch(query="something weird", resolved=False),
    ]
    
    result = optimize(matches, test_db)
    assert result.total == 8.0  # Store 21 has item 1 for 8.0
    assert len(result.items) == 1
    assert result.unresolved == ["something weird"]
    
    # Test error handling when database doesn't exist
    result_err = optimize(matches, "non_existent_db.db")
    assert result_err.error is not None
    assert "Database error" in result_err.error
