import sqlite3

import pytest

from src.geo import (
    haversine_km,
    premises_within_radius,
    premises_within_radius_with_coords,
)


def test_haversine_zero_distance():
    assert haversine_km(3.1, 101.6, 3.1, 101.6) == 0.0


def test_haversine_known_distance():
    # ~111.19 km per degree of latitude
    d = haversine_km(0.0, 0.0, 1.0, 0.0)
    assert abs(d - 111.19) < 1.0


def test_haversine_symmetric():
    a = haversine_km(3.0, 101.0, 3.2, 101.3)
    b = haversine_km(3.2, 101.3, 3.0, 101.0)
    assert abs(a - b) < 1e-9


@pytest.fixture
def geocache_db(tmp_path):
    db_file = tmp_path / "geo_test.db"
    conn = sqlite3.connect(db_file)
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
            (1.0, 3.00, 101.0),  # 0 km from user
            (2.0, 3.05, 101.0),  # ~5.6 km
            (3.0, 3.20, 101.0),  # ~22.2 km
            (4.0, 5.00, 101.0),  # ~222 km
        ],
    )
    conn.commit()
    conn.close()
    return str(db_file)


def test_premises_within_radius_filters_by_distance(geocache_db):
    result = premises_within_radius(geocache_db, 3.00, 101.0, 10.0)
    assert set(result.keys()) == {1.0, 2.0}
    assert result[1.0] == 0.0
    assert abs(result[2.0] - 5.56) < 0.2


def test_premises_within_radius_expanded_radius_includes_more(geocache_db):
    result = premises_within_radius(geocache_db, 3.00, 101.0, 25.0)
    assert set(result.keys()) == {1.0, 2.0, 3.0}


def test_premises_within_radius_none_in_range(geocache_db):
    # Query from an area with nothing nearby (all fixture premises are ~11N,101E)
    result = premises_within_radius(geocache_db, -10.0, 50.0, 1.0)
    assert result == {}


def test_premises_within_radius_with_coords_returns_store_location(geocache_db):
    result = premises_within_radius_with_coords(geocache_db, 3.00, 101.0, 10.0)
    assert set(result.keys()) == {1.0, 2.0}
    dist, lat, lng = result[2.0]
    assert abs(dist - 5.56) < 0.2
    assert (lat, lng) == (3.05, 101.0)  # store's own coords, not the user's


def test_premises_within_radius_missing_table(tmp_path):
    db_file = tmp_path / "no_geocache.db"
    conn = sqlite3.connect(db_file)
    conn.execute("CREATE TABLE dummy (x INTEGER)")
    conn.commit()
    conn.close()

    result = premises_within_radius(str(db_file), 3.0, 101.0, 10.0)
    assert result == {}


def test_premises_within_radius_ignores_null_coords(tmp_path):
    db_file = tmp_path / "null_coords.db"
    conn = sqlite3.connect(db_file)
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
    conn.execute(
        """
        INSERT INTO premise_geocache VALUES
            (1.0, NULL, NULL, 'h', 'google', '2026-01-01T00:00:00+00:00', 'zero_results')
        """
    )
    conn.commit()
    conn.close()

    result = premises_within_radius(str(db_file), 3.0, 101.0, 100.0)
    assert result == {}
