#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

# Navigate to the project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== Starting daily ShopSmart data update: $(date) ==="

# 1. Fetch the latest month's pricecatcher data and lookup files
echo "Fetching latest data..."
uv run python scripts/fetch_data.py

# 2. Run the ETL script to parse parquet files and update the SQLite database
echo "Running ETL pipeline to update SQLite..."
cd backend
uv run python -c "from src.etl import run_all; run_all()"

# 3. Geocode any new/changed premises (incremental — cached premises are skipped)
# Non-fatal: a missing/expired API key or Google API outage must not take
# down the price data update that already succeeded above.
echo "Geocoding new/changed premises..."
uv run python ../scripts/geocode_premises.py || echo "WARNING: geocoding step failed, continuing (price data already updated)"

echo "=== Data update completed successfully: $(date) ==="
