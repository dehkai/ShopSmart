import math
import sqlite3

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def premises_within_radius(
    db_path: str, lat: float, lng: float, radius_km: float
) -> dict[int, float]:
    """Return {premise_code: distance_km} for geocoded premises within radius_km.

    Table premise_geocache is expected to exist (created by src.geocode).
    """
    return {
        code: dist
        for code, (dist, _, _) in premises_within_radius_with_coords(
            db_path, lat, lng, radius_km
        ).items()
    }


def premises_within_radius_with_coords(
    db_path: str, lat: float, lng: float, radius_km: float
) -> dict[int, tuple[float, float, float]]:
    """Like premises_within_radius but each value is (distance_km, lat, lng).

    Lets callers surface the store's own coordinates (e.g. for map links that
    must point at the exact pin the distance was measured from).
    Table premise_geocache is expected to exist (created by src.geocode).
    """
    with sqlite3.connect(db_path) as conn:
        try:
            rows = conn.execute(
                """
                SELECT premise_code, latitude, longitude
                FROM premise_geocache
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                """
            ).fetchall()
        except sqlite3.OperationalError:
            # premise_geocache not present (e.g. geocoding backfill never run)
            return {}

    result: dict[int, tuple[float, float, float]] = {}
    for premise_code, premise_lat, premise_lng in rows:
        distance = haversine_km(lat, lng, premise_lat, premise_lng)
        if distance <= radius_km:
            result[premise_code] = (round(distance, 2), premise_lat, premise_lng)
    return result
