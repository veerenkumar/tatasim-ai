"""
Financial Impact Engine for TataSim AI.
Calculates end-to-end P&L, operating contribution, incremental margins, working capital,
and separates variable, fixed, recurring, and one-time setup expenses in INR (Crores & Lakhs).
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class CostBreakdown(BaseModel):
    # Variable operational costs
    bom_raw_material_cost_cr: float
    variable_manufacturing_cost_cr: float
    direct_regular_labor_cost_cr: float
    overtime_labor_cost_cr: float
    outbound_logistics_cost_cr: float
    subcontracting_outsourcing_cr: float
    total_variable_costs_cr: float
    
    # Fixed and recurring carrying costs
    fixed_plant_overhead_cr: float
    fixed_sga_overhead_cr: float
    inventory_carrying_cost_cr: float
    working_capital_financing_cr: float
    recurring_new_hire_payroll_cr: float
    total_fixed_recurring_costs_cr: float
    
    # One-time implementation / setup costs
    hiring_onboarding_capex_cr: float
    extra_shift_setup_amortized_cr: float
    total_one_time_costs_cr: float
    
    # Total operational cost
    total_modeled_operating_cost_cr: float

class FinancialImpactResult(BaseModel):
    # Demand vs Fulfillment
    demanded_units: int
    fulfilled_units: int
    unfulfilled_units: int
    fulfillment_rate_pct: float
    
    # Revenue metrics
    target_potential_revenue_cr: float
    realized_fulfilled_revenue_cr: float
    lost_revenue_from_bottlenecks_cr: float
    
    # Profitability metrics
    operating_contribution_cr: float
    contribution_margin_pct: float
    operating_profit_ebit_cr: float
    operating_margin_pct: float
    tax_expense_cr: float
    net_profit_after_tax_cr: float
    
    # Balance sheet / capital tie-up
    working_capital_requirement_cr: float
    procurement_cash_outlay_cr: float
    
    # Incremental vs Baseline comparison
    baseline_revenue_cr: float
    baseline_operating_profit_cr: float
    incremental_revenue_cr: float
    incremental_operating_profit_cr: float
    incremental_margin_pct: float
    roi_on_incremental_spend_pct: float
    
    # Cost details
    costs: CostBreakdown
    
    # Summary flags
    is_financially_viable: bool
    feasibility_status: str  # "FEASIBLE", "CONSTRAINED_BOTTLENECK", "INFEASIBLE"
    limiting_resource: str

def calculate_financial_impact(
    demanded_units: int,
    target_revenue_cr: float,
    blended_asp_inr: float,
    workforce_max_units: int,
    inventory_max_units: int,
    production_max_units: int,
    logistics_max_units: int,
    bom_material_cr: float,
    procurement_outlay_cr: float,
    holding_cost_cr: float,
    working_capital_tied_cr: float,
    reg_labor_cr: float,
    ot_labor_cr: float,
    hiring_cost_cr: float,
    recurring_salary_cr: float,
    var_mfg_cr: float,
    shift_capex_cr: float,
    subcontract_cr: float,
    logistics_cost_cr: float,
    baseline_rev_cr: float = 1438.67,
    baseline_ebit_cr: float = 186.40,
    fixed_plant_overhead_cr: float = 195.0,
    fixed_sga_overhead_cr: float = 48.0,
    working_capital_rate_annual: float = 9.25,
    corporate_tax_rate: float = 25.17
) -> FinancialImpactResult:
    """
    Computes rigorous managerial accounting and financial performance for TataSim AI scenarios.
    """
    # Constrained fulfillment by physical operational ceiling
    operational_ceiling = min(
        workforce_max_units,
        inventory_max_units,
        production_max_units,
        logistics_max_units
    )
    
    fulfilled_units = min(demanded_units, operational_ceiling)
    unfulfilled_units = max(0, demanded_units - fulfilled_units)
    fulfillment_rate = (fulfilled_units / demanded_units * 100.0) if demanded_units > 0 else 100.0
    
    # Pro-rata scaling of variable costs based on actual fulfilled volume
    fulfillment_ratio = (fulfilled_units / max(1, demanded_units))
    
    realized_revenue_cr = round(target_revenue_cr * fulfillment_ratio, 2)
    lost_revenue_cr = round(target_revenue_cr - realized_revenue_cr, 2)
    
    scaled_bom_cr = round(bom_material_cr * fulfillment_ratio, 2)
    scaled_var_mfg_cr = round(var_mfg_cr * fulfillment_ratio, 2)
    scaled_reg_labor_cr = round(reg_labor_cr * fulfillment_ratio, 2)
    scaled_ot_labor_cr = round(ot_labor_cr * fulfillment_ratio, 2)
    scaled_logistics_cr = round(logistics_cost_cr * fulfillment_ratio, 2)
    scaled_subcontract_cr = round(subcontract_cr * fulfillment_ratio, 2)
    
    total_variable_cr = round(
        scaled_bom_cr + scaled_var_mfg_cr + scaled_reg_labor_cr +
        scaled_ot_labor_cr + scaled_logistics_cr + scaled_subcontract_cr,
        2
    )
    
    operating_contribution_cr = round(realized_revenue_cr - total_variable_cr, 2)
    contrib_margin_pct = round((operating_contribution_cr / realized_revenue_cr * 100.0) if realized_revenue_cr > 0 else 0.0, 1)
    
    # Working capital monthly interest cost
    wc_monthly_interest_cr = round(working_capital_tied_cr * (working_capital_rate_annual / 12.0 / 100.0), 2)
    
    total_fixed_recurring_cr = round(
        fixed_plant_overhead_cr + fixed_sga_overhead_cr +
        holding_cost_cr + wc_monthly_interest_cr + recurring_salary_cr,
        2
    )
    
    total_one_time_cr = round(hiring_cost_cr + shift_capex_cr, 2)
    
    total_operating_cost_cr = round(total_variable_cr + total_fixed_recurring_cr + total_one_time_cr, 2)
    
    operating_profit_cr = round(realized_revenue_cr - total_operating_cost_cr, 2)
    operating_margin_pct = round((operating_profit_cr / realized_revenue_cr * 100.0) if realized_revenue_cr > 0 else 0.0, 1)
    
    tax_cr = round(max(0.0, operating_profit_cr * (corporate_tax_rate / 100.0)), 2)
    net_profit_cr = round(operating_profit_cr - tax_cr, 2)
    
    incremental_rev_cr = round(realized_revenue_cr - baseline_rev_cr, 2)
    incremental_ebit_cr = round(operating_profit_cr - baseline_ebit_cr, 2)
    
    incr_margin_pct = round(
        (incremental_ebit_cr / incremental_rev_cr * 100.0) if incremental_rev_cr > 0 else 0.0,
        1
    )
    
    incremental_costs_incurred = round(total_operating_cost_cr - (baseline_rev_cr - baseline_ebit_cr), 2)
    roi_pct = round(
        (incremental_ebit_cr / max(1.0, incremental_costs_incurred) * 100.0) if incremental_costs_incurred > 0 else 0.0,
        1
    )
    
    # Identify limiting resource
    limits = {
        "Workforce Labor Capacity": workforce_max_units,
        "Component Inventory Availability": inventory_max_units,
        "Manufacturing Plant Capacity": production_max_units,
        "Logistics & Carrier Fleet": logistics_max_units
    }
    
    bottleneck_resource = min(limits, key=limits.get)
    min_cap = limits[bottleneck_resource]
    
    if demanded_units <= min_cap:
        limiting_resource = "None (Fully Unconstrained)"
        feasibility_status = "FEASIBLE"
    elif min_cap >= demanded_units * 0.90:
        limiting_resource = bottleneck_resource
        feasibility_status = "CONSTRAINED_BOTTLENECK"
    else:
        limiting_resource = bottleneck_resource
        feasibility_status = "INFEASIBLE"
        
    is_financially_viable = (incremental_ebit_cr > 0) and (operating_profit_cr > 0)

    costs_obj = CostBreakdown(
        bom_raw_material_cost_cr=scaled_bom_cr,
        variable_manufacturing_cost_cr=scaled_var_mfg_cr,
        direct_regular_labor_cost_cr=scaled_reg_labor_cr,
        overtime_labor_cost_cr=scaled_ot_labor_cr,
        outbound_logistics_cost_cr=scaled_logistics_cr,
        subcontracting_outsourcing_cr=scaled_subcontract_cr,
        total_variable_costs_cr=total_variable_cr,
        fixed_plant_overhead_cr=fixed_plant_overhead_cr,
        fixed_sga_overhead_cr=fixed_sga_overhead_cr,
        inventory_carrying_cost_cr=round(holding_cost_cr, 2),
        working_capital_financing_cr=wc_monthly_interest_cr,
        recurring_new_hire_payroll_cr=round(recurring_salary_cr, 2),
        total_fixed_recurring_costs_cr=total_fixed_recurring_cr,
        hiring_onboarding_capex_cr=round(hiring_cost_cr, 2),
        extra_shift_setup_amortized_cr=round(shift_capex_cr, 2),
        total_one_time_costs_cr=total_one_time_cr,
        total_modeled_operating_cost_cr=total_operating_cost_cr
    )

    return FinancialImpactResult(
        demanded_units=demanded_units,
        fulfilled_units=fulfilled_units,
        unfulfilled_units=unfulfilled_units,
        fulfillment_rate_pct=round(fulfillment_rate, 1),
        target_potential_revenue_cr=target_revenue_cr,
        realized_fulfilled_revenue_cr=realized_revenue_cr,
        lost_revenue_from_bottlenecks_cr=lost_revenue_cr,
        operating_contribution_cr=operating_contribution_cr,
        contribution_margin_pct=contrib_margin_pct,
        operating_profit_ebit_cr=operating_profit_cr,
        operating_margin_pct=operating_margin_pct,
        tax_expense_cr=tax_cr,
        net_profit_after_tax_cr=net_profit_cr,
        working_capital_requirement_cr=round(working_capital_tied_cr, 2),
        procurement_cash_outlay_cr=round(procurement_outlay_cr, 2),
        baseline_revenue_cr=baseline_rev_cr,
        baseline_operating_profit_cr=baseline_ebit_cr,
        incremental_revenue_cr=incremental_rev_cr,
        incremental_operating_profit_cr=incremental_ebit_cr,
        incremental_margin_pct=incr_margin_pct,
        roi_on_incremental_spend_pct=roi_pct,
        costs=costs_obj,
        is_financially_viable=is_financially_viable,
        feasibility_status=feasibility_status,
        limiting_resource=limiting_resource
    )
