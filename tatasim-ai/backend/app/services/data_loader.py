"""
Data loader and validation service for TataSim AI.
Loads synthetic baseline CSVs and validates user uploaded CSV datasets.
"""
import os
import pandas as pd
from typing import Dict, Any, Tuple, List

# Find tatasim-ai project root (parent of backend)
CURRENT_FILE = os.path.abspath(__file__)
# CURRENT_FILE: .../tatasim-ai/backend/app/services/data_loader.py
SERVICES_DIR = os.path.dirname(CURRENT_FILE)
APP_DIR = os.path.dirname(SERVICES_DIR)
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

DATA_DIR = os.path.join(PROJECT_ROOT, "data")
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.join(BACKEND_DIR, "data")

REQUIRED_SCHEMAS = {
    "sales": [
        "segment", "model_family", "baseline_monthly_units",
        "avg_selling_price_inr", "cancellation_rate_pct"
    ],
    "workforce": [
        "department", "active_headcount", "standard_hours_month",
        "absenteeism_pct", "labor_hours_pv", "labor_hours_cv", "labor_hours_ev"
    ],
    "inventory": [
        "component_id", "component_name", "category",
        "current_stock_units", "safety_stock_units", "unit_cost_inr",
        "pv_usage", "cv_usage", "ev_usage"
    ],
    "production_capacity": [
        "plant_id", "plant_name", "primary_segments",
        "installed_monthly_capacity", "active_shifts"
    ],
    "suppliers": [
        "supplier_id", "supplier_name", "primary_component",
        "lead_time_days", "on_time_delivery_pct"
    ],
    "logistics": [
        "zone_id", "zone_name", "monthly_dispatch_capacity", "cost_per_vehicle_inr"
    ],
    "cost_assumptions": [
        "parameter", "default_value"
    ]
}

def get_file_path(filename: str) -> str:
    return os.path.join(DATA_DIR, filename)

def load_sales_df() -> pd.DataFrame:
    return pd.read_csv(get_file_path("sales.csv"))

def load_workforce_df() -> pd.DataFrame:
    return pd.read_csv(get_file_path("workforce.csv"))

def load_inventory_df() -> pd.DataFrame:
    return pd.read_csv(get_file_path("inventory.csv"))

def load_production_df() -> pd.DataFrame:
    return pd.read_csv(get_file_path("production_capacity.csv"))

def load_suppliers_df() -> pd.DataFrame:
    return pd.read_csv(get_file_path("suppliers.csv"))

def load_logistics_df() -> pd.DataFrame:
    return pd.read_csv(get_file_path("logistics.csv"))

def load_cost_assumptions_df() -> pd.DataFrame:
    return pd.read_csv(get_file_path("cost_assumptions.csv"))

def validate_and_save_csv(filename: str, file_bytes: bytes) -> Tuple[bool, str, List[str], int]:
    """
    Validates uploaded CSV file against expected schemas and constraints.
    Returns (is_valid, dataset_type, errors, row_count).
    """
    errors = []
    # Determine dataset type from filename
    lower_name = filename.lower()
    dataset_type = None
    for key in REQUIRED_SCHEMAS.keys():
        if key in lower_name:
            dataset_type = key
            break
            
    if not dataset_type:
        # Check by reading columns
        try:
            import io
            test_df = pd.read_csv(io.BytesIO(file_bytes), nrows=2)
            cols = set(test_df.columns)
            for k, req_cols in REQUIRED_SCHEMAS.items():
                if set(req_cols).issubset(cols):
                    dataset_type = k
                    break
        except Exception as e:
            return False, "unknown", [f"File is not a valid readable CSV: {str(e)}"], 0

    if not dataset_type:
        return False, "unknown", [
            f"Could not identify dataset type for '{filename}'. Expected one of: " +
            ", ".join(REQUIRED_SCHEMAS.keys())
        ], 0

    import io
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        return False, dataset_type, [f"Failed to parse CSV: {str(e)}"], 0

    row_count = len(df)
    if row_count == 0:
        return False, dataset_type, ["The uploaded CSV file is empty."], 0

    # Check required columns
    required_cols = REQUIRED_SCHEMAS[dataset_type]
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns for '{dataset_type}': {', '.join(missing_cols)}")

    # Check for empty / null values
    null_counts = df.isnull().sum()
    for col, null_c in null_counts.items():
        if null_c > 0 and col in required_cols:
            errors.append(f"Column '{col}' contains {null_c} missing or empty cells.")

    # Check numeric columns for negative values
    numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
    for c in numeric_cols:
        if (df[c] < 0).any():
            errors.append(f"Column '{c}' contains negative numbers, which is not permitted.")

    if errors:
        return False, dataset_type, errors, row_count

    # Save to data directory
    target_path = os.path.join(DATA_DIR, f"{dataset_type}.csv")
    df.to_csv(target_path, index=False)
    return True, dataset_type, [], row_count
