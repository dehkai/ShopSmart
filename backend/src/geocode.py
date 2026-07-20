"""Geocode premises.address -> lat/lng, cached in premise_geocache so the
nightly ETL's `to_sql(if_exists="replace")` on `premises` never wipes coords.

premise_geocache schema:
    premise_code   REAL PRIMARY KEY
    latitude       REAL
    longitude      REAL
    address_hash   TEXT
    geocode_source TEXT
    geocoded_at    TEXT
    status         TEXT
"""

import hashlib
import json
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
# Minimal field mask keeps the request in the cheapest Places SKU.
PLACES_FIELD_MASK = (
    "places.location,places.formattedAddress,"
    "places.addressComponents,places.displayName"
)
REQUEST_DELAY_SECONDS = 0.05  # keep well under Google's per-second quota

# A coordinate shared by more than this many premises is almost certainly a
# town/locality centroid (Google returning the town centre for an address it
# couldn't resolve), not a real per-store location. Such rows are nulled out
# so they fall back to state search instead of showing a wrong distance.
SHARED_CENTROID_THRESHOLD = 5

# Google's administrative_area_level_1 names for Malaysian states sometimes
# differ from the PriceCatcher dataset's `premises.state` values (e.g.
# "Penang" vs "Pulau Pinang"). Maps Google's long_name -> our dataset spelling.
STATE_ALIASES = {
    "penang": "Pulau Pinang",
    "p. pinang": "Pulau Pinang",
    "pinang": "Pulau Pinang",
    "malacca": "Melaka",
    "johor darul ta'zim": "Johor",
    "johor darul takzim": "Johor",
    "federal territory of kuala lumpur": "W.P. Kuala Lumpur",
    "wilayah persekutuan kuala lumpur": "W.P. Kuala Lumpur",
    "kuala lumpur": "W.P. Kuala Lumpur",
    "federal territory of putrajaya": "W.P. Putrajaya",
    "wilayah persekutuan putrajaya": "W.P. Putrajaya",
    "putrajaya": "W.P. Putrajaya",
    "federal territory of labuan": "W.P. Labuan",
    "wilayah persekutuan labuan": "W.P. Labuan",
    "labuan federal territory": "W.P. Labuan",
    "labuan": "W.P. Labuan",
}


def _normalize_state(name: str) -> str:
    key = name.strip().lower()
    return STATE_ALIASES.get(key, name.strip())


def _extract_state(payload_result: dict) -> str | None:
    for component in payload_result.get("address_components", []):
        if "administrative_area_level_1" in component.get("types", []):
            return _normalize_state(component.get("long_name", ""))
    return None


def _extract_state_places(place: dict) -> str | None:
    """State extractor for a Places API (New) result.

    Places uses `addressComponents[].longText` + `types`, unlike the classic
    Geocoding API's `address_components[].long_name`.
    """
    for component in place.get("addressComponents", []):
        if "administrative_area_level_1" in component.get("types", []):
            return _normalize_state(component.get("longText", ""))
    return None


@dataclass(frozen=True)
class GeocodeResult:
    premise_code: float
    latitude: float | None
    longitude: float | None
    address_hash: str
    geocode_source: str
    status: str


def address_hash(address: str, state: str) -> str:
    return hashlib.sha256(f"{address}|{state}".encode("utf-8")).hexdigest()


def ensure_geocache_table(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS premise_geocache (
            premise_code REAL PRIMARY KEY,
            latitude REAL,
            longitude REAL,
            address_hash TEXT NOT NULL,
            geocode_source TEXT NOT NULL,
            geocoded_at TEXT NOT NULL,
            status TEXT NOT NULL
        )
        """
    )
    connection.commit()


def find_stale_premises(
    connection: sqlite3.Connection, force: bool = False, retry_failed: bool = False
) -> list[tuple[float, str, str, str]]:
    """Return premises that are new or whose address/state changed since last geocode.

    With force=True, every geocodable premise is returned regardless of
    cache state — used for one-off re-validation passes (e.g. after adding
    the state-mismatch check retroactively).

    With retry_failed=True, only premises whose cached status isn't 'ok'
    are returned — cheaper than force when re-checking after a logic fix
    (e.g. an incomplete state-alias table) without re-paying for entries
    that already succeeded.

    Each row: (premise_code, premise, address, state)
    """
    rows = connection.execute(
        """
        SELECT p.premise_code, p.premise, p.address, p.state, g.address_hash, g.status
        FROM premises p
        LEFT JOIN premise_geocache g ON p.premise_code = g.premise_code
        """
    ).fetchall()

    stale = []
    for premise_code, premise, address, state, cached_hash, cached_status in rows:
        if not address or not state:
            continue
        if retry_failed:
            if cached_status is not None and cached_status != "ok":
                stale.append((premise_code, premise, address, state))
            continue
        current_hash = address_hash(address, state)
        if force or cached_hash != current_hash:
            stale.append((premise_code, premise, address, state))
    return stale


def geocode_address(address: str, state: str, api_key: str) -> GeocodeResult | None:
    query = f"{address}, {state}, Malaysia"
    params = urllib.parse.urlencode({"address": query, "key": api_key, "region": "my"})
    url = f"{GEOCODE_URL}?{params}"

    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError):
        return None

    api_status = payload.get("status")
    if api_status == "OK" and payload.get("results"):
        top_result = payload["results"][0]
        location = top_result["geometry"]["location"]
        matched_state = _extract_state(top_result)

        # Google occasionally disambiguates a vague/generic address to a
        # same-named street in the wrong state entirely. A result whose
        # matched state doesn't match our dataset's state is worse than no
        # result — it produces a confidently wrong short distance instead
        # of falling back to state/national search.
        if matched_state and matched_state != state.strip():
            return GeocodeResult(
                premise_code=0.0,
                latitude=None,
                longitude=None,
                address_hash="",
                geocode_source="google",
                status=f"failed:state_mismatch:{matched_state}",
            )

        return GeocodeResult(
            premise_code=0.0,  # filled in by caller
            latitude=location["lat"],
            longitude=location["lng"],
            address_hash="",  # filled in by caller
            geocode_source="google",
            status="ok",
        )
    if api_status == "ZERO_RESULTS":
        return GeocodeResult(
            premise_code=0.0,
            latitude=None,
            longitude=None,
            address_hash="",
            geocode_source="google",
            status="zero_results",
        )
    # OVER_QUERY_LIMIT, REQUEST_DENIED, INVALID_REQUEST, UNKNOWN_ERROR, etc.
    return GeocodeResult(
        premise_code=0.0,
        latitude=None,
        longitude=None,
        address_hash="",
        geocode_source="google",
        status=f"failed:{api_status}",
    )


def geocode_via_places(
    premise: str, address: str, state: str, api_key: str
) -> GeocodeResult | None:
    """Geocode a store via Google Places API (New) Text Search.

    Unlike the classic Geocoding API (which parses an address string and
    falls back to the town centre for anything vague), Places Text Search is
    business-aware: passing the premise NAME resolves the actual store POI,
    which fixes the ~22% town-centroid coordinates the Geocoding API produced.
    """
    body = json.dumps(
        {
            "textQuery": f"{premise}, {address}, {state}, Malaysia",
            "regionCode": "MY",
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        PLACES_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": PLACES_FIELD_MASK,
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # e.g. 403 REQUEST_DENIED when Places API isn't enabled on the key.
        return GeocodeResult(
            premise_code=0.0,
            latitude=None,
            longitude=None,
            address_hash="",
            geocode_source="google_places",
            status=f"failed:http_{exc.code}",
        )
    except (urllib.error.URLError, TimeoutError):
        return None

    places = payload.get("places") or []
    if not places:
        return GeocodeResult(
            premise_code=0.0,
            latitude=None,
            longitude=None,
            address_hash="",
            geocode_source="google_places",
            status="zero_results",
        )

    top = places[0]
    location = top.get("location") or {}
    lat, lng = location.get("latitude"), location.get("longitude")
    if lat is None or lng is None:
        return GeocodeResult(
            premise_code=0.0,
            latitude=None,
            longitude=None,
            address_hash="",
            geocode_source="google_places",
            status="zero_results",
        )

    matched_state = _extract_state_places(top)
    if matched_state and matched_state != state.strip():
        return GeocodeResult(
            premise_code=0.0,
            latitude=None,
            longitude=None,
            address_hash="",
            geocode_source="google_places",
            status=f"failed:state_mismatch:{matched_state}",
        )

    return GeocodeResult(
        premise_code=0.0,
        latitude=lat,
        longitude=lng,
        address_hash="",
        geocode_source="google_places",
        status="ok",
    )


def flag_shared_centroids(
    connection: sqlite3.Connection, threshold: int = SHARED_CENTROID_THRESHOLD
) -> int:
    """Null out coordinates shared by more than `threshold` premises.

    These are town/locality centroids, not real store locations. Returns the
    number of rows flagged. Only touches status='ok' rows.
    """
    clusters = connection.execute(
        """
        SELECT latitude, longitude
        FROM premise_geocache
        WHERE status = 'ok' AND latitude IS NOT NULL AND longitude IS NOT NULL
        GROUP BY latitude, longitude
        HAVING COUNT(*) > ?
        """,
        (threshold,),
    ).fetchall()

    flagged = 0
    for lat, lng in clusters:
        cursor = connection.execute(
            """
            UPDATE premise_geocache
            SET latitude = NULL, longitude = NULL, status = 'failed:shared_centroid'
            WHERE status = 'ok' AND latitude = ? AND longitude = ?
            """,
            (lat, lng),
        )
        flagged += cursor.rowcount
    connection.commit()
    return flagged


def snapshot_geocache(connection: sqlite3.Connection) -> str | None:
    """Copy premise_geocache into a timestamped backup table before a
    destructive pass (e.g. --force). If that pass fails partway (e.g. the
    API key lacks a permission), the backup lets a bad run be reversed
    instead of silently overwriting previously-good coordinates.

    Returns the backup table name, or None if premise_geocache is empty.
    """
    count = connection.execute("SELECT COUNT(*) FROM premise_geocache").fetchone()[0]
    if not count:
        return None

    table_name = f"premise_geocache_backup_{int(time.time())}"
    connection.execute(
        f'CREATE TABLE "{table_name}" AS SELECT * FROM premise_geocache'
    )
    connection.commit()
    return table_name


def upsert_geocache(connection: sqlite3.Connection, result: GeocodeResult) -> None:
    connection.execute(
        """
        INSERT INTO premise_geocache
            (premise_code, latitude, longitude, address_hash, geocode_source, geocoded_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(premise_code) DO UPDATE SET
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            address_hash=excluded.address_hash,
            geocode_source=excluded.geocode_source,
            geocoded_at=excluded.geocoded_at,
            status=excluded.status
        """,
        (
            result.premise_code,
            result.latitude,
            result.longitude,
            result.address_hash,
            result.geocode_source,
            datetime.now(timezone.utc).isoformat(),
            result.status,
        ),
    )


def run_geocode_pass(
    db_path: str,
    api_key: str,
    dry_run: bool = False,
    force: bool = False,
    retry_failed: bool = False,
) -> dict[str, int]:
    """Geocode all new/changed premises. Returns a summary of outcome counts."""
    connection = sqlite3.connect(db_path)
    try:
        ensure_geocache_table(connection)

        if force and not dry_run:
            backup_table = snapshot_geocache(connection)
            if backup_table:
                print(f"Backed up premise_geocache -> {backup_table}")

        # Snapshot of current statuses so a failed re-check never overwrites
        # a previously-good coordinate (see the http_403 incident: a --force
        # run with a not-yet-enabled API nulled every row).
        existing_status = dict(
            connection.execute("SELECT premise_code, status FROM premise_geocache")
        )

        stale = find_stale_premises(connection, force=force, retry_failed=retry_failed)

        summary = {
            "ok": 0,
            "zero_results": 0,
            "failed": 0,
            "skipped_dry_run": 0,
            "shared_centroid": 0,
            "preserved": 0,
        }

        for premise_code, premise, address, state in stale:
            if dry_run:
                summary["skipped_dry_run"] += 1
                continue

            geo = geocode_via_places(premise, address, state, api_key)
            if geo is None:
                geo = GeocodeResult(
                    premise_code=premise_code,
                    latitude=None,
                    longitude=None,
                    address_hash=address_hash(address, state),
                    geocode_source="google_places",
                    status="failed:network_error",
                )
            else:
                geo = GeocodeResult(
                    premise_code=premise_code,
                    latitude=geo.latitude,
                    longitude=geo.longitude,
                    address_hash=address_hash(address, state),
                    geocode_source=geo.geocode_source,
                    status=geo.status,
                )

            if geo.status != "ok" and existing_status.get(premise_code) == "ok":
                # Don't let a failed re-check wipe a previously-good coord.
                summary["preserved"] += 1
                time.sleep(REQUEST_DELAY_SECONDS)
                continue

            upsert_geocache(connection, geo)
            connection.commit()

            if geo.status == "ok":
                summary["ok"] += 1
            elif geo.status == "zero_results":
                summary["zero_results"] += 1
            else:
                summary["failed"] += 1

            time.sleep(REQUEST_DELAY_SECONDS)

        # After a full re-geocode, sweep out any residual town-centroid
        # coordinates (shared by many premises). Skipped on incremental runs
        # to avoid re-flagging legitimate same-building clusters.
        if force and not dry_run:
            flagged = flag_shared_centroids(connection)
            summary["shared_centroid"] = flagged
            summary["ok"] -= flagged

        return summary
    finally:
        connection.close()
