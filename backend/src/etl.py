import sqlite3
import pandas as pd
from pathlib import Path

etl_dir = Path(__file__).resolve().parent
raw_data_dir = etl_dir.parent.parent / "data" / "raw"
output_dir = etl_dir.parent.parent / "data"


# extract data from fetched parquest file and store them into dataframes
def extract_data():
    print("--- Step 1: Extracting Data ---")

    # read the 3 parquet files (data/raw/*.parquet) into pandas dataframes
    items_df = pd.read_parquet(raw_data_dir / "lookup_item.parquet")
    premises_df = pd.read_parquet(raw_data_dir / "lookup_premise.parquet")
    prices_df = pd.read_parquet(raw_data_dir / "pricecatcher_2026-05.parquet")

    print(
        f"Loaded {len(items_df)} items, {len(premises_df)} premises, and {len(prices_df)} price records."
    )
    return items_df, premises_df, prices_df


def clean_data(items_df, premises_df, prices_df):
    print("\n--- Step 2: Cleaning Data ---")

    # clean item & premise data (remove rows with any NaN values)
    clean_items_df = items_df[~items_df.isna().any(axis=1)].copy()
    clean_premises_df = premises_df[~premises_df.isna().any(axis=1)].copy()

    # clean price data (remove any rows where price is missing/zero)
    clean_prices_df = prices_df[
        (prices_df["price"].notna()) & (prices_df["price"] > 0)
    ].copy()

    # keep only the most recent price for each item at each store
    clean_prices_df = clean_prices_df.sort_values(by="date")  # ascending order
    latest_prices_df = clean_prices_df.drop_duplicates(
        subset=["premise_code", "item_code"], keep="last"
    ).copy()

    print(
        f"Cleaned Data Size -> Items: {len(clean_items_df)}, Premises: {len(clean_premises_df)}, Prices: {len(latest_prices_df)}"
    )
    return clean_items_df, clean_premises_df, latest_prices_df


# save everything into a sqlite database with 3 tables: prices, items, and premises
def load_data(items_df, premises_df, latest_prices_df):
    print("\n--- Step 3: Loading Data to SQLite ---")

    db_file = output_dir / "pricecatcher.db"
    connection = sqlite3.connect(db_file)

    # auto-create and insert data using to_sql
    # index=False to prevent additional auto-increment column
    try:
        items_df.to_sql("items", connection, if_exists="replace", index=False)
        premises_df.to_sql("premises", connection, if_exists="replace", index=False)
        latest_prices_df.to_sql("prices", connection, if_exists="replace", index=False)
        print("All data successfully saved to SQLite database!")
    finally:
        connection.close()


# wire all 3 steps into one run_all() function to run the whole pipeline
def run_all():
    print("\nStarting ETL Pipeline Execution...")
    print("=" * 50)

    # execute the individual components sequentially
    items, premises, prices = extract_data()
    items_clean, premises_clean, prices_clean = clean_data(items, premises, prices)
    load_data(items_clean, premises_clean, prices_clean)

    print("=" * 50)
    print("ETL Pipeline completed successfully!\n")


if __name__ == "__main__":
    run_all()
