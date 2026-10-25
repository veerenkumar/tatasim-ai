"""
Automated Unit Tests for TataSim AI Deterministic Simulation Engines.
Verifies hand-computed formulas, physical capacity constraints, and edge cases.
"""
import pytest
import pandas as pd
import numpy as np

from app.services.data_loader import (
    load_sales_df, load_workforce_df, load_inventory_df,
    load_production_df, load_logistics_df, load_cost_assumptions_df
)
from app.engine.demand import calculate_demand, DemandPlanRequest
from app.engine.workforce import calculate_workforce_capacity
from app.engine.inventory import calculate_inventory_analysis
from app.engine.production import calculate_production_capacity
from app.engine.logistics import calculate_logistics_capacity
from app.engine.finance import calculate_financial_impact
from app.engine.optimizer import run_optimization, OptimizationRequest
from app.engine.risk import run_monte_carlo_simulation

@pytest.fixture
def sales_df():
    return load_sales_df()

@pytest.fixture
def workforce_df():
    return load_workforce_df()

@pytest.fixture
def inventory_df():
    return load_inventory_df()

@pytest.fixture
def production_df():
    return load_production_df()

@pytest.fixture
def logistics_df():
    return load_logistics_df()

def test_demand_calculation_baseline(sales_df):
    """Verify baseline 0% growth demand calculations against data."""
    req = DemandPlanRequest(overall_growth_rate_pct=0.0, planning_horizon="monthly")
    res = calculate_demand(sales_df, req)
    
    # 48500 (PV) + 32200 (CV) + 5800 (EV) = 86500 gross units
    assert res.total_baseline_units == 86500
    assert res.total_gross_demanded_units == 86500
    assert res.total_cancellation_units > 0
    assert res.total_net_order_units < res.total_gross_demanded_units
    assert res.total_baseline_revenue_cr > 1400.0

def test_demand_calculation_20_percent_growth(sales_df):
    """Verify 20% sales growth scaling."""
    req = DemandPlanRequest(overall_growth_rate_pct=20.0, planning_horizon="monthly")
    res = calculate_demand(sales_df, req)
    
    expected_gross = int(round(86500 * 1.2))
    assert res.total_gross_demanded_units == expected_gross
    assert res.total_incremental_revenue_cr > 0

def test_demand_zero_and_horizon_scaling(sales_df):
    """Test quarterly horizon (3x) and zero growth."""
    req_q = DemandPlanRequest(overall_growth_rate_pct=0.0, planning_horizon="quarterly")
    res_q = calculate_demand(sales_df, req_q)
    assert res_q.total_baseline_units == 86500 * 3
    assert res_q.horizon_multiplier == 3

def test_workforce_capacity_utilization(workforce_df):
    """Verify workforce labor hours and overtime mechanics."""
    # Baseline demand: ~46463 PV, ~30976 CV, ~5510 EV
    res_base = calculate_workforce_capacity(
        workforce_df, units_pv=46463, units_cv=30976, units_ev=5510,
        additional_hires=0, overtime_pct=0.0
    )
    assert res_base.total_available_hours > 0
    assert res_base.total_required_hours > 0
    assert res_base.total_regular_cost_cr > 0
    
    # With high demand and 20% overtime added, overtime hours are utilized
    res_ot = calculate_workforce_capacity(
        workforce_df, units_pv=60000, units_cv=42000, units_ev=8000,
        additional_hires=0, overtime_pct=20.0
    )
    assert res_ot.total_available_hours > res_base.total_available_hours
    assert res_ot.total_ot_hours_utilized > 0
    assert res_ot.total_ot_cost_cr > 0

def test_workforce_hiring_scenario(workforce_df):
    """Verify technician hiring increases headcount and incurs onboarding capex."""
    res_hire = calculate_workforce_capacity(
        workforce_df, units_pv=55000, units_cv=37000, units_ev=6600,
        additional_hires=300, overtime_pct=10.0
    )
    assert res_hire.total_additional_hires == 300
    assert res_hire.total_hiring_cost_cr > 0
    assert res_hire.total_recurring_salary_cr > 0

def test_inventory_shortages_and_reorders(inventory_df):
    """Verify inventory BOM consumption and stockout detection."""
    # Demanding heavy volume triggers component shortage
    res_inv = calculate_inventory_analysis(
        inventory_df, units_pv=60000, units_cv=40000, units_ev=8000,
        safety_stock_buffer_pct=0.0
    )
    assert res_inv.total_bom_consumption_cr > 0
    assert res_inv.total_working_capital_cr > 0
    assert res_inv.max_units_supported_by_inventory > 0

def test_production_shift_expansion_and_yield(production_df):
    """Verify production starts exceed finished units due to yield loss (~96.5%)."""
    res_prod = calculate_production_capacity(
        production_df, units_pv=46000, units_cv=31000, units_ev=5500,
        plants_with_3rd_shift=[]
    )
    assert res_prod.total_required_starts > res_prod.total_finished_demand
    assert res_prod.total_yield_scrap_units > 0
    
    # Activating 3rd shift at Pune must increase internal capacity
    res_prod_shift = calculate_production_capacity(
        production_df, units_pv=46000, units_cv=31000, units_ev=5500,
        plants_with_3rd_shift=["PLANT-PUN"]
    )
    assert res_prod_shift.total_internal_capacity > res_prod.total_internal_capacity
    assert res_prod_shift.total_shift_capex_amortized_cr > 0

def test_logistics_distribution_dispatch(logistics_df):
    """Verify logistics dispatch capacity and corridor bottlenecks."""
    res_log = calculate_logistics_capacity(
        logistics_df, total_vehicles_to_dispatch=85000, third_party_expansion_pct=0.0
    )
    assert res_log.total_feasible_dispatch == 85000
    assert res_log.is_feasible is True
    
    # Overcapacity dispatch volume
    res_log_heavy = calculate_logistics_capacity(
        logistics_df, total_vehicles_to_dispatch=140000, third_party_expansion_pct=0.0
    )
    assert res_log_heavy.total_shortfall_units > 0
    assert res_log_heavy.bottleneck_zone != "None"

def test_financial_impact_constraints():
    """Verify financial P&L calculation and bottleneck capping."""
    fin = calculate_financial_impact(
        demanded_units=100000,
        target_revenue_cr=1700.0,
        blended_asp_inr=1380000.0,
        workforce_max_units=95000,   # limiting
        inventory_max_units=110000,
        production_max_units=105000,
        logistics_max_units=102000,
        bom_material_cr=800.0,
        procurement_outlay_cr=50.0,
        holding_cost_cr=12.0,
        working_capital_tied_cr=350.0,
        reg_labor_cr=60.0,
        ot_labor_cr=10.0,
        hiring_cost_cr=5.0,
        recurring_salary_cr=8.0,
        var_mfg_cr=50.0,
        shift_capex_cr=2.0,
        subcontract_cr=0.0,
        logistics_cost_cr=30.0,
        baseline_rev_cr=1438.0,
        baseline_ebit_cr=186.0
    )
    # Fulfilled units must be capped by workforce_max_units (95,000)
    assert fin.fulfilled_units == 95000
    assert fin.unfulfilled_units == 5000
    assert fin.fulfillment_rate_pct == 95.0
    assert fin.lost_revenue_from_bottlenecks_cr > 0
    assert fin.limiting_resource == "Workforce Labor Capacity"
    assert fin.operating_contribution_cr > 0

def test_scipy_optimization(sales_df, workforce_df, inventory_df, production_df, logistics_df):
    """Verify SciPy optimizer finds optimal feasible allocation."""
    req = OptimizationRequest(
        objective="maximize_profit",
        growth_target_pct=20.0,
        min_fulfillment_pct=95.0
    )
    opt_res = run_optimization(sales_df, workforce_df, inventory_df, production_df, logistics_df, req)
    assert opt_res.is_optimal_found is True
    assert opt_res.achieved_fulfillment_pct >= 95.0
    assert opt_res.allocation.recommended_overtime_pct >= 0.0

def test_monte_carlo_reproducibility():
    """Verify Monte Carlo simulation produces deterministic results with fixed seed."""
    res1 = run_monte_carlo_simulation(
        base_target_demand=99400, base_capacity_limit=110000,
        base_asp_inr=1380000.0, base_variable_cost_cr=1050.0,
        base_fixed_cost_cr=250.0, iterations=200, random_seed=42
    )
    res2 = run_monte_carlo_simulation(
        base_target_demand=99400, base_capacity_limit=110000,
        base_asp_inr=1380000.0, base_variable_cost_cr=1050.0,
        base_fixed_cost_cr=250.0, iterations=200, random_seed=42
    )
    assert res1.mean_operating_profit_cr == res2.mean_operating_profit_cr
    assert res1.percentile_5th_var_cr == res2.percentile_5th_var_cr
    assert len(res1.histogram_bins) == 20
    assert len(res1.sensitivity_ranking) > 0
