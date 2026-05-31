import sys
import urllib.request
from datetime import date
from pathlib import Path

URL_DATA = "https://storage.data.gov.my/pricecatcher"
RAW_PATH = Path(__file__).resolve().parent.parent / "data" / "raw"

def fetch(month: str) -> None:
    RAW_PATH.mkdir(parents=True, exist_ok=True)
    
    files = [
        f"pricecatcher_{month}.parquet",
        "lookup_item.parquet",
        "lookup_premise.parquet",
    ]
    
    for filename in files:
        url = f"{URL_DATA}/{filename}"
        dest = RAW_PATH / filename
        print(f"downloading {filename}...")
        urllib.request.urlretrieve(url, dest)
        print(f"  saved {dest.stat().st_size:,} bytes")

if __name__ == "__main__":
    month = sys.argv[1] if len(sys.argv) > 1 else date.today().strftime("%Y-%m")
    fetch(month)