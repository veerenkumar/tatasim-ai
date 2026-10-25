"""
Manufacturing Capacity Simulator for TataSim AI.
Calculates plant-level production capacity, shift utilization, yield loss (production starts vs finished units),
planned maintenance downtime, subcontracting/outsourcing, and bottleneck resources.
"""
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

class PlantCapacityResult(BaseModel):
    plant_id: str
    plant_name: str
    location: str
    primary_segments: str
    base_installed_capacity: int
    active_shifts: int
    effective_capacity: int
    required_starts: int
    finished_output_feasible: int
    utilization_pct: float
    shortfall_units: int
    yield_loss_scrap_units: int
    variable_mfg_cost_cr: float
    extra_shift_capex_cr: float
    subcontracted_units: int
    subcontracting_cost_cr: float
    is_bottleneck: bool

class ProductionAnalysisResult(BaseModel):
    total_finished_demand: int
    total_required_starts: int
    total_yield_scrap_units: int
    total_internal_capacity: int
    overall_mfg_utilization_pct: float
    total_shortfall_units: int
    total_subcontracted_units: int
    total_variable_mfg_cost_cr: float
    total_shift_capex_amortized_cr: float
    total_subcontracting_cost_cr: float
    total_mfg_cost_cr: float
    bottleneck_plant: str
    max_finished_units_supported: int
    is_feasible: bool
    plants: List[PlantCapacityResult]

def calculate_production_capacity(
    production_df: pd.DataFrame,
    units_pv: int,
    units_cv: int,
    units_ev: int,
    plants_with_3rd_shift: List[str] = [],
    subcontracting_units: int = 0,
    downtime_reduction_pct: float = 0.0
) -> ProductionAnalysisResult:
    """
    Simulates Pune, Sanand, Jamshedpur, Pantnagar, and Lucknow plants subject to yield loss and shifts.
    """
    total_finished_demanded = units_pv + units_cv + units_ev
    pv_ev_demand = units_pv + units_ev
    cv_demand = units_cv

    # Calculate required production starts accounting for average yield losses (~96.5%)
    # Starts = Finished / (yield_rate / 100)
    
    # Split plants by segment capability
    pv_ev_plants = []
    cv_plants = []
    
    for _, row in production_df.iterrows():
        segs = str(row["primary_segments"])
        pid = str(row["plant_id"]).strip()
        if "PV" in segs or "EV" in segs:
            pv_ev_plants.append(pid)
        else:
            cv_plants.append(pid)

    # Calculate effective capacity for each plant
    plant_capacities = {}
    plant_yields = {}
    total_pv_ev_base_cap = 0
    total_cv_base_cap = 0

    for _, row in production_df.iterrows():
        pid = str(row["plant_id"]).strip()
        base_cap = int(row["installed_monthly_capacity"])
        yield_rate = float(row["yield_rate_pct"]) / 100.0
        plant_yields[pid] = yield_rate
        
        has_3rd_shift = pid in plants_with_3rd_shift
        # 3rd shift increases shift capacity from 2 shifts to 3 shifts (+50%)
        shift_multiplier = 1.5 if has_3rd_shift else 1.0
        
        # Downtime reduction efficiency (each 10% downtime reduction gives +1.5% effective capacity)
        dt_boost = 1.0 + (min(50.0, downtime_reduction_pct) * 0.0015)
        
        effective_cap = int(round(base_cap * shift_multiplier * dt_boost))
        plant_capacities[pid] = effective_cap
        
        if pid in pv_ev_plants:
            total_pv_ev_base_cap += effective_cap
        else:
            total_cv_base_cap += effective_cap

    # Allocate demand starts across plants
    plant_results = []
    tot_req_starts = 0
    tot_scrap_units = 0
    tot_internal_cap = 0
    tot_shortfall = 0
    tot_var_cost = 0.0
    tot_capex_cr = 0.0
    tot_subcontract_cost = 0.0
    tot_subcontract_units = 0

    max_utilization = -1.0
    bottleneck_plant = "None"
    total_feasible_finished = 0

    # Distribute subcontracting units between PV/EV and CV if requested
    sub_pv_ev = int(subcontracting_units * (pv_ev_demand / max(1, total_finished_demanded)))
    sub_cv = subcontracting_units - sub_pv_ev

    net_pv_ev_demand = max(0, pv_ev_demand - sub_pv_ev)
    net_cv_demand = max(0, cv_demand - sub_cv)

    for _, row in production_df.iterrows():
        pid = str(row["plant_id"]).strip()
        pname = str(row["plant_name"]).strip()
        loc = str(row["location"]).strip()
        segs = str(row["primary_segments"]).strip()
        base_cap = int(row["installed_monthly_capacity"])
        effective_cap = plant_capacities[pid]
        yield_rate = plant_yields[pid]
        
        has_3rd_shift = pid in plants_with_3rd_shift
        shifts_active = 3 if has_3rd_shift else 2
        
        # Allocate share of net demand
        if pid in pv_ev_plants:
            share = effective_cap / max(1, total_pv_ev_base_cap)
            target_finished = int(round(net_pv_ev_demand * share))
            sub_allocated = int(round(sub_pv_ev * share))
        else:
            share = effective_cap / max(1, total_cv_base_cap)
            target_finished = int(round(net_cv_demand * share))
            sub_allocated = int(round(sub_cv * share))

        # Required production starts to achieve target finished units
        req_starts = int(round(target_finished / yield_rate)) if yield_rate > 0 else target_finished
        scrap_units = max(0, req_starts - target_finished)
        
        utilization = (req_starts / effective_cap * 100.0) if effective_cap > 0 else 999.0
        shortfall_starts = max(0, req_starts - effective_cap)
        
        # Output feasible within internal capacity
        feasible_starts = min(req_starts, effective_cap)
        feasible_finished = int(round(feasible_starts * yield_rate)) + sub_allocated
        
        # Costs
        var_cost_unit = float(row["variable_mfg_cost_unit_inr"])
        var_mfg_cr = (feasible_starts * var_cost_unit) / 1e7
        
        shift_capex_full = float(row["extra_shift_capex_cr"]) if has_3rd_shift else 0.0
        # Monthly amortized capex over 12 months
        shift_capex_month_cr = shift_capex_full / 12.0
        
        # Subcontracting cost
        sub_markup = float(row["subcontracting_markup_pct"]) / 100.0
        sub_cost_cr = (sub_allocated * var_cost_unit * (1.0 + sub_markup)) / 1e7

        if utilization > max_utilization:
            max_utilization = utilization
            bottleneck_plant = pname

        tot_req_starts += req_starts
        tot_scrap_units += scrap_units
        tot_internal_cap += effective_cap
        tot_shortfall += shortfall_starts
        tot_var_cost += var_mfg_cr
        tot_capex_cr += shift_capex_month_cr
        tot_subcontract_cost += sub_cost_cr
        tot_subcontract_units += sub_allocated
        total_feasible_finished += feasible_finished

        plant_results.append(PlantCapacityResult(
            plant_id=pid,
            plant_name=pname,
            location=loc,
            primary_segments=segs,
            base_installed_capacity=base_cap,
            active_shifts=shifts_active,
            effective_capacity=effective_cap,
            required_starts=req_starts,
            finished_output_feasible=feasible_finished,
            utilization_pct=round(utilization, 1),
            shortfall_units=shortfall_starts,
            yield_loss_scrap_units=scrap_units,
            variable_mfg_cost_cr=round(var_mfg_cr, 2),
            extra_shift_capex_cr=round(shift_capex_month_cr, 2),
            subcontracted_units=sub_allocated,
            subcontracting_cost_cr=round(sub_cost_cr, 2),
            is_bottleneck=False
        ))

    for p in plant_results:
        if p.plant_name == bottleneck_plant and p.utilization_pct > 100.0:
            p.is_bottleneck = True

    overall_mfg_util = (tot_req_starts / tot_internal_cap * 100.0) if tot_internal_cap > 0 else 0.0
    is_feas = tot_shortfall == 0 and max_utilization <= 100.0

    return ProductionAnalysisResult(
        total_finished_demand=total_finished_demanded,
        total_required_starts=tot_req_starts,
        total_yield_scrap_units=tot_scrap_units,
        total_internal_capacity=tot_internal_cap,
        overall_mfg_utilization_pct=round(overall_mfg_util, 1),
        total_shortfall_units=tot_shortfall,
        total_subcontracted_units=tot_subcontract_units,
        total_variable_mfg_cost_cr=round(tot_var_cost, 2),
        total_shift_capex_amortized_cr=round(tot_capex_cr, 2),
        total_subcontracting_cost_cr=round(tot_subcontract_cost, 2),
        total_mfg_cost_cr=round(tot_var_cost + tot_capex_cr + tot_subcontract_cost, 2),
        bottleneck_plant=bottleneck_plant if max_utilization > 100.0 else "None",
        max_finished_units_supported=total_feasible_finished,
        is_feasible=is_feas,
        plants=plant_results
    )
