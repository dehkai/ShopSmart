#!/bin/sh
set -e

DB_PATH="/data/pricecatcher.db"

if [ ! -f "$DB_PATH" ]; then
    echo "Database not found. Fetching data..."
    python /scripts/fetch_data.py
    echo "Running ETL pipeline..."
    uv run python -m src.etl
    echo "Database ready."
fi

exec uv run uvicorn app:app --host 0.0.0.0 --port 8001
