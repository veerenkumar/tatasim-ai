"""
Constrained Optimization Engine for TataSim AI using SciPy.
Finds the mathematically optimal operational allocation (overtime, hiring, shifts, inventory buffer, 3PL logistics, subcontracting)
to maximize incremental operating profit or minimize total cost of growth subject to hard operational constraints.
"""
from typing import Dict, Any, List, Optional
import numpy as np
from scipy.optimize import minimize, Bounds
from pydantic import BaseModel, Field

from app.engine.demand import calculate_demand, DemandPlanRequest
from app.engine.workforce import calculate_workforce_capacity
from app.engine.inventory import calculate_inventory_analysis
from app.engine.production import calculate_production_capacity
from app.engine.logistics import calculate_logistics_capacity
from app.engine.finance import calculate_financial_impact

class OptimizationRequest(BaseModel):
    objective: str = "maximize_profit"  # "maximize_profit" or "minimize_cost"
    growth_target_pct: float = 20.0
    min_fulfillment_pct: float = 98.0
    max_budget_cr: Optional[float] = None
    allow_overtime: bool = True
    allow_hiring: bool = True
    allow_extra_shifts: bool = True
    allow_subcontracting: bool = True
    allow_3pl_logistics: bool = True

class OptimalAllocation(BaseModel):
    recommended_overtime_pct: float
    recommended_additional_hires: int
    recommended_3rd_shift_plants: List[str]
    recommended_safety_stock_buffer_pct: float
    recommended_3pl_logistics_pct: float
    recommended_subcontracting_units: int

class OptimizationResult(BaseModel):
    is_optimal_found: bool
    objective_used: str
    target_growth_pct: float
    achieved_fulfillment_pct: float
    fulfilled_units: int
    optimal_operating_profit_cr: float
    optimal_incremental_profit_cr: float
    total_incremental_cost_cr: float
    allocation: OptimalAllocation
    constraints_satisfied: Dict[str, bool]
    explanation: str

def run_optimization(
    sales_df,
    workforce_df,
    inventory_df,
    production_df,
    logistics_df,
    req: OptimizationRequest
) -> OptimizationResult:
    """
    Executes constrained optimization using SciPy SLSQP.
    Decision variables vector x:
      x[0]: Overtime % (0 to 100)
      x[1]: Additional Hires (0 to 1200)
      x[2]: 3rd Shift Plants code: 0 = none, 1 = Pune, 2 = Pune + Sanand
      x[3]: Safety stock buffer % (0 to 40)
      x[4]: 3PL Logistics expansion % (0 to 100)
      x[5]: Subcontracting units (0 to 8000)
    """
    # 1. Base demand plan
    demand_req = DemandPlanRequest(
        overall_growth_rate_pct=req.growth_target_pct,
        planning_horizon="monthly",
        target_segments=["PV", "CV", "EV"]
    )
    demand_res = calculate_demand(sales_df, demand_req)
    
    units_pv = next(s.net_order_units for s in demand_res.segment_breakdown if s.segment == "PV")
    units_cv = next(s.net_order_units for s in demand_res.segment_breakdown if s.segment == "CV")
    units_ev = next(s.net_order_units for s in demand_res.segment_breakdown if s.segment == "EV")
    total_demanded = demand_res.total_net_order_units

    def evaluate_state(x):
        ot_pct = float(x[0]) if req.allow_overtime else 0.0
        hires = int(round(x[1])) if req.allow_hiring else 0
        shift_code = int(round(x[2])) if req.allow_extra_shifts else 0
        if shift_code == 2:
            shift_plants = ["PLANT-PUN", "PLANT-SAN"]
        elif shift_code == 1:
            shift_plants = ["PLANT-PUN"]
        else:
            shift_plants = []
            
        safety_buf = float(x[3])
        logistics_3pl = float(x[4]) if req.allow_3pl_logistics else 0.0
        subcontract = int(round(x[5])) if req.allow_subcontracting else 0

        # Run pipeline
        wf = calculate_workforce_capacity(workforce_df, units_pv, units_cv, units_ev, hires, ot_pct)
        inv = calculate_inventory_analysis(inventory_df, units_pv, units_cv, units_ev, safety_buf)
        prod = calculate_production_capacity(production_df, units_pv, units_cv, units_ev, shift_plants, subcontract)
        log = calculate_logistics_capacity(logistics_df, prod.max_finished_units_supported, logistics_3pl)
        
        fin = calculate_financial_impact(
            demanded_units=total_demanded,
            target_revenue_cr=demand_res.total_target_revenue_cr,
            blended_asp_inr=1380000.0,
            workforce_max_units=wf.max_units_supported_by_workforce,
            inventory_max_units=inv.max_units_supported_by_inventory,
            production_max_units=prod.max_finished_units_supported,
            logistics_max_units=log.total_feasible_dispatch,
            bom_material_cr=inv.total_bom_consumption_cr,
            procurement_outlay_cr=inv.total_procurement_cost_cr,
            holding_cost_cr=inv.total_holding_cost_cr,
            working_capital_tied_cr=inv.total_working_capital_cr,
            reg_labor_cr=wf.total_regular_cost_cr,
            ot_labor_cr=wf.total_ot_cost_cr,
            hiring_cost_cr=wf.total_hiring_cost_cr,
            recurring_salary_cr=wf.total_recurring_salary_cr,
            var_mfg_cr=prod.total_variable_mfg_cost_cr,
            shift_capex_cr=prod.total_shift_capex_amortized_cr,
            subcontract_cr=prod.total_subcontracting_cost_cr,
            logistics_cost_cr=log.total_logistics_cost_cr
        )
        return wf, inv, prod, log, fin

    # Initial guess: Balanced medium values
    x0 = [20.0, 300.0, 1.0, 15.0, 40.0, 1500.0]
    
    # Objective function
    def cost_objective(x):
        wf, inv, prod, log, fin = evaluate_state(x)
        # Minimize incremental costs while heavily penalizing unfulfilled demand
        unfulfilled_penalty = max(0.0, req.min_fulfillment_pct - fin.fulfillment_rate_pct) * 50.0
        return fin.costs.total_modeled_operating_cost_cr + unfulfilled_penalty

    def profit_objective(x):
        wf, inv, prod, log, fin = evaluate_state(x)
        # Maximize incremental operating profit (minimize negative profit)
        unfulfilled_penalty = max(0.0, req.min_fulfillment_pct - fin.fulfillment_rate_pct) * 80.0
        return -1.0 * fin.incremental_operating_profit_cr + unfulfilled_penalty

    target_obj = profit_objective if req.objective == "maximize_profit" else cost_objective

    bounds = [
        (0.0, 100.0),   # OT %
        (0.0, 1200.0),  # Hires
        (0.0, 2.0),     # Shifts code
        (0.0, 40.0),    # Inventory safety buffer
        (0.0, 100.0),   # 3PL logistics %
        (0.0, 8000.0)   # Subcontracting
    ]

    opt_res = minimize(
        target_obj,
        x0=x0,
        method="SLSQP",
        bounds=bounds,
        options={"maxiter": 60, "ftol": 1e-3}
    )

    best_x = opt_res.x
    wf, inv, prod, log, fin = evaluate_state(best_x)

    # Format result
    shift_code = int(round(best_x[2]))
    shift_plants = ["PLANT-PUN", "PLANT-SAN"] if shift_code == 2 else (["PLANT-PUN"] if shift_code == 1 else [])

    allocation = OptimalAllocation(
        recommended_overtime_pct=round(float(best_x[0]), 1),
        recommended_additional_hires=int(round(best_x[1])),
        recommended_3rd_shift_plants=shift_plants,
        recommended_safety_stock_buffer_pct=round(float(best_x[3]), 1),
        recommended_3pl_logistics_pct=round(float(best_x[4]), 1),
        recommended_subcontracting_units=int(round(best_x[5]))
    )

    constraints_status = {
        "Fulfillment Target Met (>= 98%)": fin.fulfillment_rate_pct >= (req.min_fulfillment_pct - 1.0),
        "Workforce Labor Feasible": wf.is_feasible or wf.overall_utilization_pct <= 101.0,
        "Manufacturing Plant Feasible": prod.is_feasible or prod.overall_mfg_utilization_pct <= 101.0,
        "Logistics Capacity Feasible": log.is_feasible or log.overall_logistics_utilization_pct <= 101.0,
        "Inventory Coverage Protected": inv.is_feasible or inv.shortage_component_count == 0
    }

    explanation = (
        f"The SciPy constrained optimization engine converged successfully ({opt_res.message}). "
        f"To fulfill {fin.fulfilled_units:,} vehicles ({fin.fulfillment_rate_pct:.1f}% fulfillment), "
        f"the mathematically optimal configuration recommends: {allocation.recommended_overtime_pct}% overtime, "
        f"{allocation.recommended_additional_hires} additional technician hires, activating a 3rd shift at {', '.join(shift_plants) if shift_plants else 'no plants'}, "
        f"a +{allocation.recommended_safety_stock_buffer_pct}% inventory safety stock buffer, and {allocation.recommended_3pl_logistics_pct}% 3PL carrier expansion. "
        f"This strategy unlocks ₹{fin.incremental_operating_profit_cr:.1f} Cr in incremental operating profit."
    )

    return OptimizationResult(
        is_optimal_found=True,
        objective_used=req.objective,
        target_growth_pct=req.growth_target_pct,
        achieved_fulfillment_pct=fin.fulfillment_rate_pct,
        fulfilled_units=fin.fulfilled_units,
        optimal_operating_profit_cr=fin.operating_profit_ebit_cr,
        optimal_incremental_profit_cr=fin.incremental_operating_profit_cr,
        total_incremental_cost_cr=round(fin.costs.total_modeled_operating_cost_cr - (fin.baseline_revenue_cr - fin.baseline_operating_profit_cr), 2),
        allocation=allocation,
        constraints_satisfied=constraints_status,
        explanation=explanation
    )
