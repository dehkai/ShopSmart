import json
import urllib.error
from unittest.mock import MagicMock, patch

from src.routes_service import get_driving_distances_km


def _mock_response(payload: dict):
    mock = MagicMock()
    mock.__enter__.return_value.read.return_value = json.dumps(payload).encode("utf-8")
    return mock


def test_get_driving_distances_km_happy_path():
    destinations = [(10, 3.10, 101.60), (20, 3.20, 101.70)]
    payload = {"distances": [[5.2, 10.1]]}

    with patch("urllib.request.urlopen", return_value=_mock_response(payload)):
        result = get_driving_distances_km((3.0, 101.5), destinations, "fake-key")

    assert result == {10: 5.2, 20: 10.1}


def test_get_driving_distances_km_empty_destinations_returns_empty():
    assert get_driving_distances_km((3.0, 101.5), [], "fake-key") == {}


def test_get_driving_distances_km_network_error_falls_back_to_empty():
    destinations = [(10, 3.10, 101.60)]
    with patch(
        "urllib.request.urlopen",
        side_effect=urllib.error.URLError("connection refused"),
    ):
        result = get_driving_distances_km((3.0, 101.5), destinations, "fake-key")
    assert result == {}


def test_get_driving_distances_km_malformed_response_falls_back_to_empty():
    destinations = [(10, 3.10, 101.60), (20, 3.20, 101.70)]
    # distances row length doesn't match destination count -> treated as malformed
    payload = {"distances": [[5.2]]}

    with patch("urllib.request.urlopen", return_value=_mock_response(payload)):
        result = get_driving_distances_km((3.0, 101.5), destinations, "fake-key")

    assert result == {}


def test_get_driving_distances_km_uses_lng_lat_order():
    """ORS expects [lng, lat] — a common bug source since Google uses [lat, lng]."""
    captured_request = {}

    def fake_urlopen(request, timeout):
        captured_request["body"] = json.loads(request.data.decode("utf-8"))
        return _mock_response({"distances": [[1.0]]})

    destinations = [(10, 3.10, 101.60)]  # (premise_code, lat=3.10, lng=101.60)

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        get_driving_distances_km((3.0, 101.5), destinations, "fake-key")

    locations = captured_request["body"]["locations"]
    assert locations[0] == [101.5, 3.0]  # origin as [lng, lat]
    assert locations[1] == [101.60, 3.10]  # destination as [lng, lat]
