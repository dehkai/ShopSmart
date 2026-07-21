import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from src.geocode import run_geocode_pass  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = REPO_ROOT / "data" / "pricecatcher.db"
BACKEND_ENV_PATH = REPO_ROOT / "backend" / ".env"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Geocode new/changed premises.address into premise_geocache."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report how many premises need geocoding without calling the API.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-geocode every premise regardless of cache state (for one-off "
        "re-validation passes, e.g. after a geocoding logic fix).",
    )
    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="Re-geocode only premises whose cached status isn't 'ok' — cheaper "
        "than --force when re-checking after a logic fix.",
    )
    args = parser.parse_args()

    load_dotenv(BACKEND_ENV_PATH)
    api_key = os.environ.get("GOOGLE_GEOCODING_API_KEY")
    if not api_key and not args.dry_run:
        print("GOOGLE_GEOCODING_API_KEY not set (checked backend/.env).")
        sys.exit(1)

    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}. Run the ETL pipeline first.")
        sys.exit(1)

    print(
        f"Geocoding premises in {DB_PATH} "
        f"(dry_run={args.dry_run}, force={args.force}, retry_failed={args.retry_failed})..."
    )
    summary = run_geocode_pass(
        str(DB_PATH),
        api_key or "",
        dry_run=args.dry_run,
        force=args.force,
        retry_failed=args.retry_failed,
    )

    print("--- Geocode Summary ---")
    for key, count in summary.items():
        print(f"{key}: {count}")


if __name__ == "__main__":
    main()
