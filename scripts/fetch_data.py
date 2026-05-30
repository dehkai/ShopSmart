import sys
import urllib.request
from datetime import date
from pathlib import Path

BASE = "https://storage.data.gov.my/pricecatcher"
RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"

LOOKUPS = ["lookup_item.csv", "lookup_premise.csv"]


def _download(url: str, dest: Path) -> None:
    print(f"downloading {url}")
    urllib.request.urlretrieve(url, dest)
    print(f"  saved -> {dest} ({dest.stat().st_size:,} bytes)")


def fetch(month: str) -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    _download(f"{BASE}/pricecatcher_{month}.csv", RAW_DIR / f"pricecatcher_{month}.csv")
    for name in LOOKUPS:
        _download(f"{BASE}/{name}", RAW_DIR / name)


def main() -> None:
    month = sys.argv[1] if len(sys.argv) > 1 else date.today().strftime("%Y-%m")
    fetch(month)


if __name__ == "__main__":
    main()
