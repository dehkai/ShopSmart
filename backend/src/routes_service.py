"""Real road-network driving distance via OpenRouteService's free Matrix API.

Haversine (src/geo.py) is straight-line and can differ from Google Maps'
driving distance by 10km+ where roads detour around rivers/coastline (common
in Malaysia). This module fetches actual driving distance for the small set
of stores actually shown to the user — never the full radius candidate set —
to stay well within ORS's free tier (2,500 req/day, 40,000/month, up to
50x50 locations per request).
"""

import json
import urllib.error
import urllib.request

ORS_MATRIX_URL = "https://api.openrouteservice.org/v2/matrix/driving-car"
REQUEST_TIMEOUT_SECONDS = 8


def get_driving_distances_km(
    origin: tuple[float, float],
    destinations: list[tuple[int, float, float]],
    api_key: str,
) -> dict[int, float]:
    """Return {premise_code: driving_distance_km} for reachable destinations.

    origin: (lat, lng).
    destinations: list of (premise_code, lat, lng).
    On any failure (network, auth, malformed response) returns {} so the
    caller can fall back to the already-computed haversine distance —
    driving distance is a nice-to-have, never a hard requirement.
    """
    if not destinations:
        return {}

    # ORS uses [lng, lat] order (GeoJSON convention) — opposite of Google's
    # [lat, lng]. Index 0 is always the origin.
    locations = [[origin[1], origin[0]]] + [
        [lng, lat] for _premise_code, lat, lng in destinations
    ]
    body = {
        "locations": locations,
        "sources": [0],
        "destinations": list(range(1, len(locations))),
        "metrics": ["distance"],
        "units": "km",
    }

    request = urllib.request.Request(
        ORS_MATRIX_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request, timeout=REQUEST_TIMEOUT_SECONDS
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"ORS Matrix request failed: HTTP {e.code} — {body}")
        return {}
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        print(f"ORS Matrix request failed: {e!r}")
        return {}

    distances_row = payload.get("distances", [[]])
    if not distances_row or len(distances_row[0]) != len(destinations):
        print(f"ORS Matrix response shape mismatch: {payload}")
        return {}

    result = {}
    for (premise_code, _lat, _lng), distance in zip(
        destinations, distances_row[0]
    ):
        if distance is not None:
            result[premise_code] = round(distance, 2)
    return result
