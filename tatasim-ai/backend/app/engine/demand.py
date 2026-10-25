"""
Sales and Demand Planning Engine for TataSim AI.
Calculates projected sales, units demanded, cancellations, and net demand across segments.
Formula: Projected demand = Baseline demand * (1 + growth_rate) * seasonal_factor * (1 - cancellation_rate)
"""
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

class SegmentDemandInput(BaseModel):
    segment: str  # "PV", "CV", "EV"
    growth_rate_pct: float = 20.0
    asp_inr: float = 1150000.0
    cancellation_rate_pct: float = 4.2
    seasonal_factor: float = 1.0

class DemandPlanRequest(BaseModel):
    overall_growth_rate_pct: float = 20.0
    planning_horizon: str = "monthly"  # "monthly", "quarterly", "annual"
    target_segments: List[str] = ["PV", "CV", "EV"]
    seasonal_adjustment: float = 1.0
    demand_variation_pct: float = 0.0  # Optional manual shock
    cancellation_rate_override: float = None  # Optional override

class SegmentDemandResult(BaseModel):
    segment: str
    model_family: str
    baseline_units: int
    growth_rate_pct: float
    gross_demanded_units: int
    cancellation_units: int
    net_order_units: int
    asp_inr: float
    target_revenue_cr: float
    baseline_revenue_cr: float
    incremental_revenue_target_cr: float

class DemandPlanResult(BaseModel):
    horizon: str
    horizon_multiplier: int
    overall_growth_rate_pct: float
    total_baseline_units: int
    total_gross_demanded_units: int
    total_cancellation_units: int
    total_net_order_units: int
    total_baseline_revenue_cr: float
    total_target_revenue_cr: float
    total_incremental_revenue_cr: float
    segment_breakdown: List[SegmentDemandResult]

def calculate_demand(
    sales_df: pd.DataFrame,
    request: DemandPlanRequest
) -> DemandPlanResult:
    """
    Deterministic demand calculation across vehicle segments for Tata Motors.
    """
    multiplier = 1
    if request.planning_horizon == "quarterly":
        multiplier = 3
    elif request.planning_horizon == "annual":
        multiplier = 12

    segment_results = []
    tot_baseline_units = 0
    tot_gross_demanded = 0
    tot_cancellations = 0
    tot_net_orders = 0
    tot_baseline_rev = 0.0
    tot_target_rev = 0.0

    for _, row in sales_df.iterrows():
        seg = str(row["segment"]).strip()
        model_family = str(row["model_family"])
        base_monthly = int(row["baseline_monthly_units"])
        base_units = base_monthly * multiplier
        asp = float(row["avg_selling_price_inr"])
        default_cancel = float(row["cancellation_rate_pct"])

        # Determine growth rate for this segment
        if seg in request.target_segments:
            growth_pct = float(request.overall_growth_rate_pct)
        else:
            growth_pct = 0.0

        # Apply demand variation shock if any
        effective_growth = (growth_pct + request.demand_variation_pct) / 100.0

        # Gross demand before cancellation
        gross_demand = int(round(base_units * (1.0 + effective_growth) * request.seasonal_adjustment))
        
        # Cancellation rate
        cancel_rate = (request.cancellation_rate_override 
                       if request.cancellation_rate_override is not None 
                       else default_cancel) / 100.0
        
        cancellations = int(round(gross_demand * cancel_rate))
        net_orders = max(0, gross_demand - cancellations)

        # Revenue in Crores: units * ASP / 1e7
        base_rev_cr = round((base_units * asp) / 1e7, 2)
        target_rev_cr = round((net_orders * asp) / 1e7, 2)
        incr_rev_cr = round(target_rev_cr - base_rev_cr, 2)

        tot_baseline_units += base_units
        tot_gross_demanded += gross_demand
        tot_cancellations += cancellations
        tot_net_orders += net_orders
        tot_baseline_rev += base_rev_cr
        tot_target_rev += target_rev_cr

        segment_results.append(SegmentDemandResult(
            segment=seg,
            model_family=model_family,
            baseline_units=base_units,
            growth_rate_pct=round(growth_pct, 1),
            gross_demanded_units=gross_demand,
            cancellation_units=cancellations,
            net_order_units=net_orders,
            asp_inr=asp,
            target_revenue_cr=target_rev_cr,
            baseline_revenue_cr=base_rev_cr,
            incremental_revenue_target_cr=incr_rev_cr
        ))

    return DemandPlanResult(
        horizon=request.planning_horizon,
        horizon_multiplier=multiplier,
        overall_growth_rate_pct=round(request.overall_growth_rate_pct, 1),
        total_baseline_units=tot_baseline_units,
        total_gross_demanded_units=tot_gross_demanded,
        total_cancellation_units=tot_cancellations,
        total_net_order_units=tot_net_orders,
        total_baseline_revenue_cr=round(tot_baseline_rev, 2),
        total_target_revenue_cr=round(tot_target_rev, 2),
        total_incremental_revenue_cr=round(tot_target_rev - tot_baseline_rev, 2),
        segment_breakdown=segment_results
    )
