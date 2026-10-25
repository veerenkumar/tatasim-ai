"""
Logistics and Distribution Simulator for TataSim AI.
Calculates outbound dispatch throughput, carrier capacity, corridor bottlenecks,
third-party (3PL) emergency buffer fleet utilization, and distribution costs.
"""
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

class ZoneLogisticsResult(BaseModel):
    zone_id: str
    zone_name: str
    primary_hub: str
    transport_mode: str
    contracted_capacity: int
    third_party_buffer_capacity: int
    total_effective_capacity: int
    required_dispatch_units: int
    feasible_dispatch_units: int
    utilization_pct: float
    shortfall_units: int
    transit_days_avg: float
    base_freight_cost_cr: float
    spot_premium_cost_cr: float
    total_corridor_cost_cr: float
    delay_risk_level: str
    is_bottleneck: bool

class LogisticsAnalysisResult(BaseModel):
    total_dispatch_demanded: int
    total_contracted_capacity: int
    total_effective_capacity: int
    total_feasible_dispatch: int
    overall_logistics_utilization_pct: float
    total_shortfall_units: int
    total_base_freight_cost_cr: float
    total_spot_premium_cost_cr: float
    total_logistics_cost_cr: float
    bottleneck_zone: str
    is_feasible: bool
    zones: List[ZoneLogisticsResult]

def calculate_logistics_capacity(
    logistics_df: pd.DataFrame,
    total_vehicles_to_dispatch: int,
    third_party_expansion_pct: float = 0.0,
    express_freight: bool = False
) -> LogisticsAnalysisResult:
    """
    Simulates outbound automotive carrier dispatch across Western, Northern, Southern, and Eastern corridors.
    """
    # Zonal demand distribution shares based on Indian automotive market volume
    zone_demand_weights = {
        "ZONE-WST": 0.33,
        "ZONE-NTH": 0.28,
        "ZONE-STH": 0.24,
        "ZONE-EST": 0.15
    }

    zone_results = []
    tot_contracted_cap = 0
    tot_effective_cap = 0
    tot_req_dispatch = 0
    tot_feasible = 0
    tot_shortfall = 0
    tot_base_cost = 0.0
    tot_spot_cost = 0.0

    max_utilization = -1.0
    bottleneck_zone = "None"

    for _, row in logistics_df.iterrows():
        zid = str(row["zone_id"]).strip()
        zname = str(row["zone_name"]).strip()
        hub = str(row["primary_hub"]).strip()
        mode = str(row["transport_mode"]).strip()
        
        contract_cap = int(row["monthly_dispatch_capacity"])
        base_buffer = int(row["third_party_buffer_cap"])
        buffer_allowed = int(round(base_buffer * (max(0.0, min(100.0, third_party_expansion_pct)) / 100.0)))
        
        total_corridor_cap = contract_cap + buffer_allowed
        
        weight = zone_demand_weights.get(zid, 0.25)
        req_units = int(round(total_vehicles_to_dispatch * weight))
        
        utilization = (req_units / total_corridor_cap * 100.0) if total_corridor_cap > 0 else 999.0
        shortfall = max(0, req_units - total_corridor_cap)
        feasible = min(req_units, total_corridor_cap)
        
        # Buffer utilized beyond contracted capacity
        buffer_used = max(0, min(buffer_allowed, req_units - contract_cap))
        
        unit_cost = float(row["cost_per_vehicle_inr"]) * (1.10 if express_freight else 1.0)
        premium_rate = float(row["third_party_rate_premium_pct"]) / 100.0
        
        base_cost_cr = (feasible * unit_cost) / 1e7
        spot_cost_cr = (buffer_used * unit_cost * premium_rate) / 1e7
        tot_corridor_cost_cr = base_cost_cr + spot_cost_cr
        
        transit_days = float(row["transit_days_avg"]) * (0.80 if express_freight else 1.0)
        
        if utilization > 100.0:
            delay_risk = "Critical"
        elif utilization > 92.0:
            delay_risk = "High"
        elif utilization > 80.0:
            delay_risk = "Medium"
        else:
            delay_risk = "Low"

        if utilization > max_utilization:
            max_utilization = utilization
            bottleneck_zone = zname

        tot_contracted_cap += contract_cap
        tot_effective_cap += total_corridor_cap
        tot_req_dispatch += req_units
        tot_feasible += feasible
        tot_shortfall += shortfall
        tot_base_cost += base_cost_cr
        tot_spot_cost += spot_cost_cr

        zone_results.append(ZoneLogisticsResult(
            zone_id=zid,
            zone_name=zname,
            primary_hub=hub,
            transport_mode=mode,
            contracted_capacity=contract_cap,
            third_party_buffer_capacity=buffer_allowed,
            total_effective_capacity=total_corridor_cap,
            required_dispatch_units=req_units,
            feasible_dispatch_units=feasible,
            utilization_pct=round(utilization, 1),
            shortfall_units=shortfall,
            transit_days_avg=round(transit_days, 1),
            base_freight_cost_cr=round(base_cost_cr, 2),
            spot_premium_cost_cr=round(spot_cost_cr, 2),
            total_corridor_cost_cr=round(tot_corridor_cost_cr, 2),
            delay_risk_level=delay_risk,
            is_bottleneck=False
        ))

    for z in zone_results:
        if z.zone_name == bottleneck_zone and z.utilization_pct > 100.0:
            z.is_bottleneck = True

    overall_util = (tot_req_dispatch / tot_effective_cap * 100.0) if tot_effective_cap > 0 else 0.0
    is_feas = tot_shortfall == 0 and max_utilization <= 100.0

    return LogisticsAnalysisResult(
        total_dispatch_demanded=tot_req_dispatch,
        total_contracted_capacity=tot_contracted_cap,
        total_effective_capacity=tot_effective_cap,
        total_feasible_dispatch=tot_feasible,
        overall_logistics_utilization_pct=round(overall_util, 1),
        total_shortfall_units=tot_shortfall,
        total_base_freight_cost_cr=round(tot_base_cost, 2),
        total_spot_premium_cost_cr=round(tot_spot_cost, 2),
        total_logistics_cost_cr=round(tot_base_cost + tot_spot_cost, 2),
        bottleneck_zone=bottleneck_zone if max_utilization > 100.0 else "None",
        is_feasible=is_feas,
        zones=zone_results
    )
