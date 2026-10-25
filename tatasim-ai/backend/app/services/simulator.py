"""
Master Business Simulation Service for TataSim AI.
Orchestrates demand planning, workforce capacity, inventory & suppliers,
manufacturing facilities, logistics networks, and financial accounting.
"""
from typing import Dict, Any, Optional
import json

from app.schemas.scenario import ScenarioParameters, SimulationResponse
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
from app.engine.recommendations import generate_recommendations

def run_simulation(
    params: ScenarioParameters,
    scenario_id: Optional[str] = None,
    scenario_name: str = "Active Simulation Scenario"
) -> SimulationResponse:
    """
    Executes the deterministic business simulator pipeline for Tata Motors.
    """
    # 1. Load active datasets
    sales_df = load_sales_df()
    workforce_df = load_workforce_df()
    inventory_df = load_inventory_df()
    production_df = load_production_df()
    logistics_df = load_logistics_df()
    costs_df = load_cost_assumptions_df()

    # 2. Demand Planning
    demand_req = DemandPlanRequest(
        overall_growth_rate_pct=params.sales_growth_target_pct,
        planning_horizon=params.planning_horizon,
        target_segments=params.target_segments
    )
    demand_result = calculate_demand(sales_df, demand_req)

    # Extract net orders by segment
    units_pv = 0
    units_cv = 0
    units_ev = 0
    for s in demand_result.segment_breakdown:
        if s.segment == "PV":
            units_pv = s.net_order_units
        elif s.segment == "CV":
            units_cv = s.net_order_units
        elif s.segment == "EV":
            units_ev = s.net_order_units

    total_demanded = demand_result.total_net_order_units

    # 3. Workforce Capacity Analysis
    workforce_result = calculate_workforce_capacity(
        workforce_df=workforce_df,
        units_pv=units_pv,
        units_cv=units_cv,
        units_ev=units_ev,
        additional_hires=params.additional_hires,
        overtime_pct=params.overtime_pct
    )

    # 4. Inventory & Supplier Analysis
    inventory_result = calculate_inventory_analysis(
        inventory_df=inventory_df,
        units_pv=units_pv,
        units_cv=units_cv,
        units_ev=units_ev,
        safety_stock_buffer_pct=params.safety_stock_buffer_pct,
        expedite_orders=params.expedite_inventory
    )

    # 5. Manufacturing Plant Capacity
    production_result = calculate_production_capacity(
        production_df=production_df,
        units_pv=units_pv,
        units_cv=units_cv,
        units_ev=units_ev,
        plants_with_3rd_shift=params.plants_with_3rd_shift,
        subcontracting_units=params.subcontracting_units,
        downtime_reduction_pct=params.downtime_reduction_pct
    )

    # 6. Logistics & Distribution Simulator
    # Dispatch volume is constrained by manufactured output
    logistics_result = calculate_logistics_capacity(
        logistics_df=logistics_df,
        total_vehicles_to_dispatch=production_result.max_finished_units_supported,
        third_party_expansion_pct=params.third_party_logistics_pct,
        express_freight=params.express_freight
    )

    # 7. Financial Impact Engine
    finance_result = calculate_financial_impact(
        demanded_units=total_demanded,
        target_revenue_cr=demand_result.total_target_revenue_cr,
        blended_asp_inr=1380000.0,
        workforce_max_units=workforce_result.max_units_supported_by_workforce,
        inventory_max_units=inventory_result.max_units_supported_by_inventory,
        production_max_units=production_result.max_finished_units_supported,
        logistics_max_units=logistics_result.total_feasible_dispatch,
        bom_material_cr=inventory_result.total_bom_consumption_cr,
        procurement_outlay_cr=inventory_result.total_procurement_cost_cr,
        holding_cost_cr=inventory_result.total_holding_cost_cr,
        working_capital_tied_cr=inventory_result.total_working_capital_cr,
        reg_labor_cr=workforce_result.total_regular_cost_cr,
        ot_labor_cr=workforce_result.total_ot_cost_cr,
        hiring_cost_cr=workforce_result.total_hiring_cost_cr,
        recurring_salary_cr=workforce_result.total_recurring_salary_cr,
        var_mfg_cr=production_result.total_variable_mfg_cost_cr,
        shift_capex_cr=production_result.total_shift_capex_amortized_cr,
        subcontract_cr=production_result.total_subcontracting_cost_cr,
        logistics_cost_cr=logistics_result.total_logistics_cost_cr,
        baseline_rev_cr=demand_result.total_baseline_revenue_cr,
        baseline_ebit_cr=round(demand_result.total_baseline_revenue_cr * 0.129, 2)  # ~12.9% baseline margin = ~186.4 Cr
    )

    # 8. AI Recommendation Engine
    recommendations_result = generate_recommendations(
        demand_res=demand_result,
        workforce_res=workforce_result,
        inventory_res=inventory_result,
        production_res=production_result,
        logistics_res=logistics_result,
        finance_res=finance_result
    )

    return SimulationResponse(
        scenario_id=scenario_id,
        scenario_name=scenario_name,
        parameters=params,
        demand=demand_result,
        workforce=workforce_result,
        inventory=inventory_result,
        production=production_result,
        logistics=logistics_result,
        finance=finance_result,
        recommendations=recommendations_result
    )
