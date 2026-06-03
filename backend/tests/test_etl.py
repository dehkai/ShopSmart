import pytest
import pandas as pd
import numpy as np
from src.etl import clean_data


def test_clean_data_filters_nans_and_duplicates():
    # 1. Setup mock items dataframe with a NaN row
    items_data = {
        "item_code": [1, 2, 3],
        "item": ["Beras", None, "Telur"],
        "unit": ["5kg", "1kg", "10pcs"]
    }
    items_df = pd.DataFrame(items_data)
    
    # 2. Setup mock premises dataframe with a NaN state row
    premises_data = {
        "premise_code": [10, 11],
        "premise": ["Store A", "Store B"],
        "state": ["Selangor", None]
    }
    premises_df = pd.DataFrame(premises_data)
    
    # 3. Setup mock prices dataframe with:
    # - a zero price
    # - a NaN price
    # - duplicate items for the same store (should keep latest date)
    prices_data = {
        "item_code": [1, 1, 2, 2, 3],
        "premise_code": [10, 10, 10, 10, 10],
        "price": [10.0, 9.5, 0.0, np.nan, 3.0],
        "date": ["2026-05-01", "2026-05-02", "2026-05-01", "2026-05-01", "2026-05-01"]
    }
    prices_df = pd.DataFrame(prices_data)
    
    # Run cleaner
    clean_items, clean_premises, clean_prices = clean_data(items_df, premises_df, prices_df)
    
    # Assert NaN row removed from items
    assert len(clean_items) == 2
    assert 2 not in clean_items["item_code"].values
    
    # Assert NaN row removed from premises
    assert len(clean_premises) == 1
    assert 11 not in clean_premises["premise_code"].values
    
    # Assert zero & NaN prices are filtered
    # Only items 1 and 3 should remain
    assert len(clean_prices) == 2
    assert 2 not in clean_prices["item_code"].values
    
    # Assert duplicate prices for (item_code=1, premise_code=10) are resolved to the latest date
    # Date "2026-05-02" has price 9.5
    latest_price_row = clean_prices[clean_prices["item_code"] == 1]
    assert len(latest_price_row) == 1
    assert latest_price_row.iloc[0]["price"] == 9.5
    assert latest_price_row.iloc[0]["date"] == "2026-05-02"
