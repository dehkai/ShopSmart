import sqlite3
from unittest.mock import patch

import pytest

from src.geocode import (
    GeocodeResult,
    _extract_state_places,
    _normalize_state,
    ensure_geocache_table,
    flag_shared_centroids,
    run_geocode_pass,
    snapshot_geocache,
)


def test_normalize_state_aliases():
    assert _normalize_state("Penang") == "Pulau Pinang"
    assert _normalize_state("Johor Darul Ta'zim") == "Johor"
    assert _normalize_state("Wilayah Persekutuan Kuala Lumpur") == "W.P. Kuala Lumpur"
    # Unknown / already-correct names pass through unchanged.
    assert _normalize_state("Selangor") == "Selangor"


def test_extract_state_places_uses_longtext():
    place = {
        "addressComponents": [
            {"longText": "Kuala Lumpur", "types": ["locality"]},
            {
                "longText": "Penang",
                "types": ["administrative_area_level_1", "political"],
            },
        ]
    }
    assert _extract_state_places(place) == "Pulau Pinang"


def test_extract_state_places_missing_returns_none():
    assert _extract_state_places({"addressComponents": []}) is None
    assert _extract_state_places({}) is None


@pytest.fixture
def centroid_db(tmp_path):
    db_file = tmp_path / "centroid.db"
    conn = sqlite3.connect(db_file)
    ensure_geocache_table(conn)
    rows = []
    # 6 premises share one coordinate -> town centroid (> threshold of 5).
    for code in range(1, 7):
        rows.append((float(code), 5.42, 116.79))
    # 2 premises legitimately near each other but distinct coords.
    rows.append((10.0, 3.10, 101.60))
    rows.append((11.0, 3.11, 101.61))
    conn.executemany(
        """
        INSERT INTO premise_geocache
            (premise_code, latitude, longitude, address_hash, geocode_source, geocoded_at, status)
        VALUES (?, ?, ?, 'h', 'google_places', '2026-01-01T00:00:00+00:00', 'ok')
        """,
        rows,
    )
    conn.commit()
    return conn


def test_flag_shared_centroids_nulls_town_centre(centroid_db):
    flagged = flag_shared_centroids(centroid_db, threshold=5)
    assert flagged == 6  # the 6-premise cluster

    # Clustered rows nulled + marked; distinct rows untouched.
    centroid_rows = centroid_db.execute(
        "SELECT latitude, longitude, status FROM premise_geocache WHERE premise_code <= 6"
    ).fetchall()
    assert all(
        lat is None and lng is None and status == "failed:shared_centroid"
        for lat, lng, status in centroid_rows
    )

    kept = centroid_db.execute(
        "SELECT COUNT(*) FROM premise_geocache WHERE status = 'ok'"
    ).fetchone()[0]
    assert kept == 2
    centroid_db.close()


def test_flag_shared_centroids_keeps_small_clusters(centroid_db):
    # With a high threshold nothing is flagged (the 6-cluster is <= threshold).
    flagged = flag_shared_centroids(centroid_db, threshold=10)
    assert flagged == 0
    kept = centroid_db.execute(
        "SELECT COUNT(*) FROM premise_geocache WHERE status = 'ok'"
    ).fetchone()[0]
    assert kept == 8
    centroid_db.close()


def test_snapshot_geocache_returns_none_when_empty(tmp_path):
    db_file = tmp_path / "empty.db"
    conn = sqlite3.connect(db_file)
    ensure_geocache_table(conn)
    assert snapshot_geocache(conn) is None
    conn.close()


def test_snapshot_geocache_creates_backup_table(centroid_db):
    backup_name = snapshot_geocache(centroid_db)
    assert backup_name is not None
    assert backup_name.startswith("premise_geocache_backup_")

    original_count = centroid_db.execute(
        "SELECT COUNT(*) FROM premise_geocache"
    ).fetchone()[0]
    backup_count = centroid_db.execute(
        f'SELECT COUNT(*) FROM "{backup_name}"'
    ).fetchone()[0]
    assert backup_count == original_count == 8
    centroid_db.close()


@pytest.fixture
def geocode_pass_db(tmp_path):
    """A full premises + premise_geocache db for exercising run_geocode_pass."""
    db_file = tmp_path / "pass.db"
    conn = sqlite3.connect(db_file)
    conn.execute(
        "CREATE TABLE premises (premise_code REAL PRIMARY KEY, premise TEXT, "
        "address TEXT, state TEXT)"
    )
    conn.execute(
        "INSERT INTO premises VALUES (1.0, 'Good Store', 'Addr 1', 'Selangor')"
    )
    ensure_geocache_table(conn)
    conn.execute(
        """
        INSERT INTO premise_geocache
            (premise_code, latitude, longitude, address_hash, geocode_source, geocoded_at, status)
        VALUES (1.0, 3.14, 101.69, 'stale-hash', 'google_places', '2026-01-01T00:00:00+00:00', 'ok')
        """
    )
    conn.commit()
    conn.close()
    return str(db_file)


def test_run_geocode_pass_preserves_ok_on_failed_retry(geocode_pass_db):
    """Regression test for the incident where a --force run against an API
    key without Places permission wiped every previously-good coordinate by
    overwriting 'ok' rows with 'failed:http_403'.
    """
    failing_result = GeocodeResult(
        premise_code=0.0,
        latitude=None,
        longitude=None,
        address_hash="",
        geocode_source="google_places",
        status="failed:http_403",
    )

    with patch("src.geocode.geocode_via_places", return_value=failing_result):
        summary = run_geocode_pass(geocode_pass_db, api_key="fake", force=True)

    assert summary["preserved"] == 1
    assert summary["failed"] == 0

    conn = sqlite3.connect(geocode_pass_db)
    row = conn.execute(
        "SELECT latitude, longitude, status FROM premise_geocache WHERE premise_code = 1.0"
    ).fetchone()
    conn.close()
    assert row == (3.14, 101.69, "ok")  # untouched, not overwritten


def test_run_geocode_pass_backs_up_before_force_run(geocode_pass_db):
    ok_result = GeocodeResult(
        premise_code=0.0,
        latitude=3.20,
        longitude=101.70,
        address_hash="",
        geocode_source="google_places",
        status="ok",
    )

    with patch("src.geocode.geocode_via_places", return_value=ok_result):
        run_geocode_pass(geocode_pass_db, api_key="fake", force=True)

    conn = sqlite3.connect(geocode_pass_db)
    backup_tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' "
        "AND name LIKE 'premise_geocache_backup_%'"
    ).fetchall()
    conn.close()
    assert len(backup_tables) == 1
