"""
API Integration Tests for TataSim AI FastAPI endpoints.
Tests health, dashboard summary, scenario CRUD, simulation, optimization, and exports.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Tata Motors" in data["disclaimer"]

def test_api_dashboard_summary(client):
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "current_monthly_sales_revenue_cr" in data
    assert "overall_growth_feasibility_status" in data
    assert "limiting_resource" in data

def test_api_scenarios_list(client):
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) >= 8
    preset_ids = [s["id"] for s in scenarios if s["is_preset"]]
    assert "scenario-baseline" in preset_ids
    assert "scenario-sales-growth-only" in preset_ids

def test_api_simulate_on_the_fly(client):
    payload = {
        "sales_growth_target_pct": 20.0,
        "planning_horizon": "monthly",
        "target_segments": ["PV", "CV", "EV"],
        "additional_hires": 250,
        "overtime_pct": 15.0,
        "plants_with_3rd_shift": ["PLANT-PUN"],
        "safety_stock_buffer_pct": 10.0,
        "expedite_inventory": False,
        "subcontracting_units": 0,
        "third_party_logistics_pct": 20.0,
        "downtime_reduction_pct": 5.0,
        "express_freight": False
    }
    res = client.post("/api/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "demand" in data
    assert "workforce" in data
    assert "inventory" in data
    assert "production" in data
    assert "logistics" in data
    assert "finance" in data
    assert "recommendations" in data

def test_api_scenarios_compare(client):
    payload = {
        "scenario_ids": [
            "scenario-baseline",
            "scenario-sales-growth-only",
            "scenario-balanced-growth"
        ]
    }
    res = client.post("/api/scenarios/compare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["scenarios"]) == 3
    assert "best_profit_scenario_id" in data

def test_api_reports_csv_export(client):
    res = client.get("/api/reports/export/csv/scenario-baseline")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Scenario Name" in res.text
