import pytest
import sqlite3
from src.optimizer import (
    find_cheapest_item,
    get_premise_info,
    get_item_price_at_store,
    find_cheapest_store,
    state_ranking,
    top_stores_in_state,
    _average_total,
    optimize,
)
from src.models import ItemMatch, BasketResult


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
    cursor.executemany(
        "INSERT INTO items VALUES (?, ?, ?)",
        [
            (1, "Beras 5kg", "5kg"),
            (2, "Minyak 1kg", "1kg"),
            (3, "Telur 10pcs", "10pcs"),
            (4, "Susu 1L", "1L"),
        ],
    )

    # Insert dummy premises
    cursor.executemany(
        "INSERT INTO premises VALUES (?, ?, ?, ?)",
        [
            (10, "Mydin Shah Alam", "Selangor", "Address A"),
            (11, "Lotus's Ara Damansara", "Selangor", "Address B"),
            (20, "Giant Cheras", "W.P. Kuala Lumpur", "Address C"),
            (21, "Aeon Wangsa Maju", "W.P. Kuala Lumpur", "Address D"),
        ],
    )

    # Insert dummy prices
    cursor.executemany(
        "INSERT INTO prices VALUES (?, ?, ?, ?)",
        [
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
        ],
    )

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
        ItemMatch(
            query="beras",
            item_code=1,
            item_name="Beras 5kg",
            confidence=0.9,
            resolved=True,
        ),
        ItemMatch(
            query="minyak",
            item_code=2,
            item_name="Minyak 1kg",
            confidence=0.9,
            resolved=True,
        ),
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
        ItemMatch(
            query="beras",
            item_code=1,
            item_name="Beras 5kg",
            confidence=0.9,
            resolved=True,
        ),
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


def test_top_stores_in_state_national(test_db):
    stores = top_stores_in_state([1, 2], test_db, state=None)
    # Store 20 total = 8.5 + 4.0 = 12.5
    # Store 11 total = 9.0 + 4.5 = 13.5
    # Store 10 total = 10.0 + 5.0 = 15.0
    assert len(stores) == 3
    assert stores[0].premise_code == 20
    assert stores[0].total == 12.5
    assert stores[1].premise_code == 11
    assert stores[1].total == 13.5
    assert stores[2].premise_code == 10
    assert stores[2].total == 15.0


# --- GPS radius filtering: premise_codes / distances plumbing ---


def test_find_cheapest_item_premise_codes_filter(test_db):
    # Restrict to KL stores only (20, 21), ignoring state entirely
    cheapest = find_cheapest_item(1, test_db, premise_codes=[20, 21])
    assert cheapest is not None
    assert cheapest.premise_code == 21  # 8.0 cheaper than store 20's 8.5
    assert cheapest.distance_km is None  # no distances dict supplied


def test_find_cheapest_item_premise_codes_with_distances(test_db):
    cheapest = find_cheapest_item(
        1, test_db, premise_codes=[20, 21], distances={20: 3.3, 21: 33.0}
    )
    assert cheapest.premise_code == 21
    assert cheapest.distance_km == 33.0


def test_find_cheapest_store_premise_codes_filter(test_db):
    # Both 10 (Selangor) and 20 (KL) stock all 3 items; 20 is cheaper
    result = find_cheapest_store([1, 2, 3], test_db, premise_codes=[10, 20])
    assert result == (20, 15.0)


def test_top_stores_in_state_premise_codes_filter(test_db):
    stores = top_stores_in_state([1, 2], test_db, premise_codes=[10, 20])
    assert len(stores) == 2
    assert stores[0].premise_code == 20
    assert stores[1].premise_code == 10


def test_top_stores_in_state_premise_codes_partial_stock_fallback(test_db):
    # Mirrors test_top_stores_in_state_partial_stock_fallback but filtered via
    # premise_codes instead of state — same partial-stock fallback path.
    stores = top_stores_in_state([2, 3, 4], test_db, premise_codes=[20, 21])
    assert len(stores) == 2
    assert stores[0].premise_code == 20
    assert stores[0].items_found == 2
    assert stores[1].premise_code == 21
    assert stores[1].items_found == 1


def test_average_total_premise_codes_filter(test_db):
    # premise_codes=[10, 11] (both Selangor): item1 (10+9)/2=9.5, item2 (5+4.5)/2=4.75
    avg = _average_total([1, 2], test_db, premise_codes=[10, 11])
    assert abs(avg - 14.25) < 1e-4


# --- optimize() with GPS coords ---


@pytest.fixture
def test_db_with_geocache(test_db):
    conn = sqlite3.connect(test_db)
    conn.execute(
        """
        CREATE TABLE premise_geocache (
            premise_code REAL PRIMARY KEY,
            latitude REAL,
            longitude REAL,
            address_hash TEXT,
            geocode_source TEXT,
            geocoded_at TEXT,
            status TEXT
        )
        """
    )
    conn.executemany(
        """
        INSERT INTO premise_geocache
            (premise_code, latitude, longitude, address_hash, geocode_source, geocoded_at, status)
        VALUES (?, ?, ?, 'h', 'google', '2026-01-01T00:00:00+00:00', 'ok')
        """,
        [
            (10, 1.000, 101.000),  # Selangor — user's exact location, 0 km
            (20, 1.030, 101.000),  # KL — ~3.3 km away
            (11, 1.300, 101.000),  # Selangor — ~33 km away
            (21, 1.300, 101.000),  # KL — ~33 km away
        ],
    )
    conn.commit()
    conn.close()
    return test_db


def test_optimize_radius_crosses_state_boundary(test_db_with_geocache):
    # User located exactly at store 10 (Selangor), 5km radius should reach
    # store 20 (KL, ~3.3km) too but not stores 11/21 (~33km, same states).
    matches = [
        ItemMatch(query="beras", item_code=1, item_name="Beras 5kg", resolved=True),
        ItemMatch(query="minyak", item_code=2, item_name="Minyak 1kg", resolved=True),
        ItemMatch(query="telur", item_code=3, item_name="Telur 10pcs", resolved=True),
    ]

    result = optimize(
        matches, test_db_with_geocache, lat=1.000, lng=101.000, radius_km=5
    )

    assert result.radius_km_used == 5.0
    assert result.no_stores_in_radius is False

    ranked_codes = {s.premise_code for s in result.store_ranking}
    assert ranked_codes <= {10, 20}
    assert 11 not in ranked_codes
    assert 21 not in ranked_codes

    # Store 20 (KL) is cheaper (15.0) despite user being physically at the
    # Selangor store — confirms radius replaces state as the filter.
    assert result.total == 15.0
    assert result.is_single_store is True
    assert all(s.distance_km is not None for s in result.store_ranking)
    assert result.items[0].cheapest.distance_km is not None


@pytest.fixture
def sparse_geo_db(tmp_path):
    db_file = tmp_path / "sparse_geo.db"
    conn = sqlite3.connect(db_file)
    conn.execute("CREATE TABLE items (item_code INTEGER PRIMARY KEY, item TEXT, unit TEXT)")
    conn.execute(
        "CREATE TABLE premises (premise_code INTEGER PRIMARY KEY, premise TEXT, state TEXT, address TEXT)"
    )
    conn.execute(
        """
        CREATE TABLE prices (
            item_code INTEGER, premise_code INTEGER, price REAL, date TEXT,
            PRIMARY KEY (item_code, premise_code)
        )
        """
    )
    conn.execute(
        "CREATE TABLE premise_geocache (premise_code REAL PRIMARY KEY, latitude REAL, longitude REAL, address_hash TEXT, geocode_source TEXT, geocoded_at TEXT, status TEXT)"
    )
    conn.execute("INSERT INTO items VALUES (1, 'Item X', '1pc')")
    conn.execute("INSERT INTO premises VALUES (100, 'Lone Store', 'Selangor', 'Addr')")
    conn.execute("INSERT INTO prices VALUES (1, 100, 5.0, '2026-05-01')")
    conn.execute(
        """
        INSERT INTO premise_geocache
            (premise_code, latitude, longitude, address_hash, geocode_source, geocoded_at, status)
        VALUES (100, 0.135, 0.0, 'h', 'google', '2026-01-01T00:00:00+00:00', 'ok')
        """
    )  # ~15 km from user at (0, 0)
    conn.commit()
    conn.close()
    return str(db_file)


def test_optimize_radius_expands_when_default_empty(sparse_geo_db):
    matches = [ItemMatch(query="x", item_code=1, item_name="Item X", resolved=True)]

    # Default radius (10km) misses the ~15km store; expansion to 25km finds it.
    result = optimize(matches, sparse_geo_db, lat=0.0, lng=0.0)

    assert result.no_stores_in_radius is False
    assert result.radius_km_used == 25.0
    assert len(result.store_ranking) == 1
    assert result.store_ranking[0].premise_code == 100
    assert result.store_ranking[0].distance_km is not None
    assert 10 < result.store_ranking[0].distance_km < 25


def test_optimize_no_stores_in_radius_falls_back(sparse_geo_db):
    matches = [ItemMatch(query="x", item_code=1, item_name="Item X", resolved=True)]

    # User far from the only geocoded store, even after expansion to 25km.
    result = optimize(matches, sparse_geo_db, lat=5.0, lng=5.0, radius_km=5)

    assert result.no_stores_in_radius is True
    # Falls back to the unfiltered (national) path — item is still found.
    assert result.total == 5.0
    assert result.store_ranking[0].distance_km is None

