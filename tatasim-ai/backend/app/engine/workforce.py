"""
Workforce Capacity Analysis Engine for TataSim AI.
Calculates labor hours required, effective hours available, overtime usage,
staffing shortfall, and direct labor costs across manufacturing departments.
"""
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

class DepartmentWorkforceResult(BaseModel):
    department: str
    active_headcount: int
    additional_hires: int
    effective_headcount: float
    standard_hours_available: float
    max_ot_hours_allowed: float
    total_hours_available: float
    required_labor_hours: float
    utilization_pct: float
    shortfall_hours: float
    surplus_hours: float
    staffing_gap_fte: float
    ot_hours_utilized: float
    regular_labor_cost_cr: float
    ot_labor_cost_cr: float
    hiring_cost_cr: float
    recurring_salary_cost_cr: float
    total_workforce_cost_cr: float
    is_bottleneck: bool
    max_units_supported: int

class WorkforceAnalysisResult(BaseModel):
    total_active_headcount: int
    total_additional_hires: int
    total_effective_headcount: float
    total_available_hours: float
    total_required_hours: float
    overall_utilization_pct: float
    total_shortfall_hours: float
    total_ot_hours_utilized: float
    total_regular_cost_cr: float
    total_ot_cost_cr: float
    total_hiring_cost_cr: float
    total_recurring_salary_cr: float
    total_labor_cost_cr: float
    bottleneck_department: str
    max_units_supported_by_workforce: int
    is_feasible: bool
    departments: List[DepartmentWorkforceResult]

def calculate_workforce_capacity(
    workforce_df: pd.DataFrame,
    units_pv: int,
    units_cv: int,
    units_ev: int,
    additional_hires: int = 0,
    overtime_pct: float = 0.0,
    absenteeism_override: Optional[float] = None
) -> WorkforceAnalysisResult:
    """
    Evaluates workforce constraints across Body Shop, Paint Shop, Assembly, Powertrain, Quality, and Plant Logistics.
    """
    total_units_demanded = units_pv + units_cv + units_ev
    num_depts = len(workforce_df)
    # Distribute additional hires proportionally across departments if provided globally
    dept_hires_dist = {}
    total_base_headcount = workforce_df["active_headcount"].sum()
    allocated_sum = 0
    depts = list(workforce_df["department"])
    
    for i, dept in enumerate(depts):
        if i == len(depts) - 1:
            # Last department gets remainder
            dept_hires_dist[dept] = max(0, additional_hires - allocated_sum)
        else:
            base_hc = int(workforce_df.loc[workforce_df["department"] == dept, "active_headcount"].iloc[0])
            dept_h = int(round(additional_hires * (base_hc / total_base_headcount)))
            dept_hires_dist[dept] = dept_h
            allocated_sum += dept_h

    dept_results = []
    tot_base_hc = 0
    tot_hires = 0
    tot_eff_hc = 0.0
    tot_avail_hrs = 0.0
    tot_req_hrs = 0.0
    tot_shortfall = 0.0
    tot_ot_hrs = 0.0
    tot_reg_cost = 0.0
    tot_ot_cost = 0.0
    tot_hire_cost = 0.0
    tot_salary_cost = 0.0
    
    max_utilization = -1.0
    bottleneck_dept = "None"
    min_units_supported = 99999999

    for _, row in workforce_df.iterrows():
        dept = str(row["department"])
        base_hc = int(row["active_headcount"])
        add_hc = dept_hires_dist.get(dept, 0)
        tot_hc = base_hc + add_hc
        
        std_hrs = float(row["standard_hours_month"])
        absent_pct = absenteeism_override if absenteeism_override is not None else float(row["absenteeism_pct"])
        
        eff_hc = tot_hc * (1.0 - (absent_pct / 100.0))
        std_hrs_avail = eff_hc * std_hrs
        
        max_ot_per_worker = float(row["max_ot_hours_worker"])
        # Overtime hours available based on user setting (0% to 100%)
        ot_hrs_avail = eff_hc * max_ot_per_worker * (max(0.0, min(100.0, overtime_pct)) / 100.0)
        tot_dept_capacity_hrs = std_hrs_avail + ot_hrs_avail
        
        # Labor requirements per vehicle type
        hrs_pv = float(row["labor_hours_pv"])
        hrs_cv = float(row["labor_hours_cv"])
        hrs_ev = float(row["labor_hours_ev"])
        
        req_hrs = (units_pv * hrs_pv) + (units_cv * hrs_cv) + (units_ev * hrs_ev)
        
        utilization = (req_hrs / tot_dept_capacity_hrs * 100.0) if tot_dept_capacity_hrs > 0 else 999.0
        shortfall = max(0.0, req_hrs - tot_dept_capacity_hrs)
        surplus = max(0.0, tot_dept_capacity_hrs - req_hrs)
        staffing_gap = shortfall / std_hrs if std_hrs > 0 else 0.0
        
        # Overtime utilized
        ot_utilized = min(ot_hrs_avail, max(0.0, req_hrs - std_hrs_avail))
        
        # Rates and costs
        reg_rate = float(row["hourly_rate_inr"])
        ot_rate = float(row["ot_rate_inr"])
        hire_cost_unit = float(row["hire_cost_inr"])
        monthly_salary = float(row["salary_month_inr"])
        
        reg_cost_cr = (min(req_hrs, std_hrs_avail) * reg_rate) / 1e7
        ot_cost_cr = (ot_utilized * ot_rate) / 1e7
        hire_cost_cr = (add_hc * hire_cost_unit) / 1e7
        salary_cost_cr = (add_hc * monthly_salary) / 1e7
        total_dept_cost_cr = reg_cost_cr + ot_cost_cr + hire_cost_cr + salary_cost_cr
        
        # Department maximum units supported based on current mix
        blended_hours_per_unit = (req_hrs / total_units_demanded) if total_units_demanded > 0 else (hrs_pv + hrs_cv + hrs_ev) / 3.0
        dept_max_units = int(tot_dept_capacity_hrs / blended_hours_per_unit) if blended_hours_per_unit > 0 else 0
        if dept_max_units < min_units_supported:
            min_units_supported = dept_max_units

        if utilization > max_utilization:
            max_utilization = utilization
            bottleneck_dept = dept

        tot_base_hc += base_hc
        tot_hires += add_hc
        tot_eff_hc += eff_hc
        tot_avail_hrs += tot_dept_capacity_hrs
        tot_req_hrs += req_hrs
        tot_shortfall += shortfall
        tot_ot_hrs += ot_utilized
        tot_reg_cost += reg_cost_cr
        tot_ot_cost += ot_cost_cr
        tot_hire_cost += hire_cost_cr
        tot_salary_cost += salary_cost_cr

        dept_results.append(DepartmentWorkforceResult(
            department=dept,
            active_headcount=base_hc,
            additional_hires=add_hc,
            effective_headcount=round(eff_hc, 1),
            standard_hours_available=round(std_hrs_avail, 1),
            max_ot_hours_allowed=round(ot_hrs_avail, 1),
            total_hours_available=round(tot_dept_capacity_hrs, 1),
            required_labor_hours=round(req_hrs, 1),
            utilization_pct=round(utilization, 1),
            shortfall_hours=round(shortfall, 1),
            surplus_hours=round(surplus, 1),
            staffing_gap_fte=round(staffing_gap, 1),
            ot_hours_utilized=round(ot_utilized, 1),
            regular_labor_cost_cr=round(reg_cost_cr, 2),
            ot_labor_cost_cr=round(ot_cost_cr, 2),
            hiring_cost_cr=round(hire_cost_cr, 2),
            recurring_salary_cost_cr=round(salary_cost_cr, 2),
            total_workforce_cost_cr=round(total_dept_cost_cr, 2),
            is_bottleneck=False,
            max_units_supported=dept_max_units
        ))

    # Mark the bottleneck department
    for d in dept_results:
        if d.department == bottleneck_dept and d.utilization_pct > 100.0:
            d.is_bottleneck = True

    overall_util = (tot_req_hrs / tot_avail_hrs * 100.0) if tot_avail_hrs > 0 else 0.0
    is_feasible = tot_shortfall <= 0.001 and max_utilization <= 100.0

    return WorkforceAnalysisResult(
        total_active_headcount=tot_base_hc,
        total_additional_hires=tot_hires,
        total_effective_headcount=round(tot_eff_hc, 1),
        total_available_hours=round(tot_avail_hrs, 1),
        total_required_hours=round(tot_req_hrs, 1),
        overall_utilization_pct=round(overall_util, 1),
        total_shortfall_hours=round(tot_shortfall, 1),
        total_ot_hours_utilized=round(tot_ot_hrs, 1),
        total_regular_cost_cr=round(tot_reg_cost, 2),
        total_ot_cost_cr=round(tot_ot_cost, 2),
        total_hiring_cost_cr=round(tot_hire_cost, 2),
        total_recurring_salary_cr=round(tot_salary_cost, 2),
        total_labor_cost_cr=round(tot_reg_cost + tot_ot_cost + tot_hire_cost + tot_salary_cost, 2),
        bottleneck_department=bottleneck_dept if max_utilization > 100.0 else "None",
        max_units_supported_by_workforce=min_units_supported,
        is_feasible=is_feasible,
        departments=dept_results
    )
