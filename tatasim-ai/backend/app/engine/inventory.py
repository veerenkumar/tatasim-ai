"""
Inventory and Supplier Analysis Engine for TataSim AI.
Calculates component bill-of-materials demand, inventory coverage, stockout shortages,
procurement requirements, working capital tied up, and supplier lead-time risks.
"""
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

class ComponentInventoryResult(BaseModel):
    component_id: str
    component_name: str
    category: str
    current_stock: float
    safety_stock: float
    required_units: float
    coverage_days: float
    shortage_units: float
    reorder_units: float
    unit_cost_inr: float
    bom_cost_cr: float
    procurement_cost_cr: float
    holding_cost_cr: float
    working_capital_cr: float
    lead_time_weeks: float
    supplier_reliability_pct: float
    risk_level: str
    is_shortage: bool
    max_vehicles_supported: int

class InventoryAnalysisResult(BaseModel):
    total_bom_consumption_cr: float
    total_procurement_cost_cr: float
    total_holding_cost_cr: float
    total_working_capital_cr: float
    shortage_component_count: int
    critical_shortages: List[str]
    primary_bottleneck_component: str
    max_units_supported_by_inventory: int
    is_feasible: bool
    components: List[ComponentInventoryResult]

def calculate_inventory_analysis(
    inventory_df: pd.DataFrame,
    units_pv: int,
    units_cv: int,
    units_ev: int,
    safety_stock_buffer_pct: float = 0.0,
    expedite_orders: bool = False
) -> InventoryAnalysisResult:
    """
    Evaluates raw materials, electronics, battery packs, chassis, and assemblies against production targets.
    """
    total_units_demanded = units_pv + units_cv + units_ev
    comp_results = []
    
    tot_bom_cost = 0.0
    tot_proc_cost = 0.0
    tot_hold_cost = 0.0
    tot_working_cap = 0.0
    shortage_count = 0
    critical_list = []
    
    min_vehicles_supported = 99999999
    bottleneck_part = "None"
    lowest_coverage = 999999.0

    for _, row in inventory_df.iterrows():
        cid = str(row["component_id"]).strip()
        cname = str(row["component_name"]).strip()
        cat = str(row["category"]).strip()
        
        curr_stock = float(row["current_stock_units"])
        base_safety = float(row["safety_stock_units"])
        safety_stock = base_safety * (1.0 + max(-50.0, safety_stock_buffer_pct) / 100.0)
        
        base_unit_cost = float(row["unit_cost_inr"])
        effective_unit_cost = base_unit_cost * (1.06 if expedite_orders else 1.0)
        
        usage_pv = float(row["pv_usage"])
        usage_cv = float(row["cv_usage"])
        usage_ev = float(row["ev_usage"])
        
        req_units = (units_pv * usage_pv) + (units_cv * usage_cv) + (units_ev * usage_ev)
        
        # Coverage in days
        daily_burn = req_units / 30.0 if req_units > 0 else 0.001
        coverage_days = curr_stock / daily_burn if daily_burn > 0 else 999.0
        
        # Shortages and reorders
        shortage = max(0.0, req_units - curr_stock)
        reorder = max(0.0, req_units + safety_stock - curr_stock)
        
        # Costs in Crores
        bom_cr = (req_units * base_unit_cost) / 1e7
        proc_cr = (reorder * effective_unit_cost) / 1e7
        
        annual_holding_pct = float(row["holding_cost_annual_pct"])
        monthly_holding_rate = (annual_holding_pct / 12.0) / 100.0
        hold_cr = ((curr_stock + reorder * 0.5) * base_unit_cost * monthly_holding_rate) / 1e7
        work_cap_cr = ((curr_stock + reorder) * effective_unit_cost) / 1e7
        
        lead_time = float(row["lead_time_weeks"])
        rel_pct = float(row["supplier_reliability_pct"])
        
        # Risk assessment
        if shortage > 0 or (lead_time > 5.0 and rel_pct < 88.0):
            risk = "High"
        elif coverage_days < 25.0 or lead_time > 4.0:
            risk = "Medium"
        else:
            risk = "Low"
            
        # Max vehicles this part could support based on current inventory and procurement actions
        blended_usage_per_veh = req_units / total_units_demanded if total_units_demanded > 0 else (usage_pv + usage_cv + usage_ev) / 3.0
        # If no procurement buffer intervention is authorized, capacity is strictly limited to on-hand stock
        supplied_stock = curr_stock + (reorder if (expedite_orders or safety_stock_buffer_pct > 0.0) else 0.0)
        veh_supported = int(supplied_stock / blended_usage_per_veh) if blended_usage_per_veh > 0 else 99999999
        
        if veh_supported < min_vehicles_supported:
            min_vehicles_supported = veh_supported
            bottleneck_part = cname

        is_short = shortage > 0.1
        if is_short:
            shortage_count += 1
            critical_list.append(f"{cname} (Short: {int(shortage):,} units)")

        tot_bom_cost += bom_cr
        tot_proc_cost += proc_cr
        tot_hold_cost += hold_cr
        tot_working_cap += work_cap_cr

        comp_results.append(ComponentInventoryResult(
            component_id=cid,
            component_name=cname,
            category=cat,
            current_stock=round(curr_stock, 1),
            safety_stock=round(safety_stock, 1),
            required_units=round(req_units, 1),
            coverage_days=round(coverage_days, 1),
            shortage_units=round(shortage, 1),
            reorder_units=round(reorder, 1),
            unit_cost_inr=base_unit_cost,
            bom_cost_cr=round(bom_cr, 2),
            procurement_cost_cr=round(proc_cr, 2),
            holding_cost_cr=round(hold_cr, 2),
            working_capital_cr=round(work_cap_cr, 2),
            lead_time_weeks=lead_time,
            supplier_reliability_pct=rel_pct,
            risk_level=risk,
            is_shortage=is_short,
            max_vehicles_supported=veh_supported
        ))

    is_feas = (shortage_count == 0)

    return InventoryAnalysisResult(
        total_bom_consumption_cr=round(tot_bom_cost, 2),
        total_procurement_cost_cr=round(tot_proc_cost, 2),
        total_holding_cost_cr=round(tot_hold_cost, 2),
        total_working_capital_cr=round(tot_working_cap, 2),
        shortage_component_count=shortage_count,
        critical_shortages=critical_list,
        primary_bottleneck_component=bottleneck_part if shortage_count > 0 else "None",
        max_units_supported_by_inventory=min_vehicles_supported,
        is_feasible=is_feas,
        components=comp_results
    )
