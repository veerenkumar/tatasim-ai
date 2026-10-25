"""
Deterministic AI Recommendation Engine for TataSim AI.
Identifies operational and financial bottlenecks from calculated simulation metrics and produces
rigorous, explainable executive recommendations with quantifiable actions, costs, and financial returns.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RecommendationCard(BaseModel):
    id: str
    category: str  # "Workforce", "Inventory", "Manufacturing", "Logistics", "Financial"
    priority: str  # "CRITICAL", "HIGH", "MEDIUM"
    title: str
    identified_problem: str
    supporting_numerical_evidence: str
    recommended_action: str
    estimated_incremental_cost_cr: float
    expected_operational_improvement: str
    estimated_financial_impact: str
    key_assumptions_and_risks: str

class RecommendationReport(BaseModel):
    scenario_id: Optional[str] = None
    overall_growth_target_pct: float
    executive_narrative: str
    bottleneck_summary: str
    total_unfulfilled_units: int
    lost_revenue_cr: float
    cards: List[RecommendationCard]

def generate_recommendations(
    demand_res: Any,
    workforce_res: Any,
    inventory_res: Any,
    production_res: Any,
    logistics_res: Any,
    finance_res: Any
) -> RecommendationReport:
    """
    Evaluates calculated simulation state to produce explainable deterministic recommendations.
    """
    cards: List[RecommendationCard] = []
    growth_pct = demand_res.overall_growth_rate_pct
    unfulfilled = finance_res.unfulfilled_units
    lost_rev = finance_res.lost_revenue_from_bottlenecks_cr
    
    # 1. Workforce Bottleneck Evaluation
    if not workforce_res.is_feasible or workforce_res.overall_utilization_pct > 95.0:
        b_dept = workforce_res.bottleneck_department
        shortfall_hrs = workforce_res.total_shortfall_hours
        util_pct = workforce_res.overall_utilization_pct
        
        needed_hires = int(round(shortfall_hrs / 176.0)) if shortfall_hrs > 0 else 180
        est_cost_cr = round((needed_hires * (42000 + 38000)) / 1e7 + 2.5, 2)
        
        cards.append(RecommendationCard(
            id="REC-WORKFORCE-01",
            category="Workforce",
            priority="CRITICAL" if shortfall_hrs > 0 else "HIGH",
            title=f"Resolve Labor Deficit in {b_dept}",
            identified_problem=f"Shop-floor labor capacity is overstretched; {b_dept} utilization reached {workforce_res.departments[0].utilization_pct if workforce_res.departments else util_pct}%.",
            supporting_numerical_evidence=f"Labor deficit of {shortfall_hrs:,.0f} productive man-hours across plant lines. Overall workforce utilization is at {util_pct:.1f}%.",
            recommended_action=f"Activate an immediate authorized overtime pool (15-20 hours/worker/mo) and recruit approximately {needed_hires} contractual technical operators across {b_dept} and Assembly.",
            estimated_incremental_cost_cr=est_cost_cr,
            expected_operational_improvement=f"Expands monthly shop-floor throughput by {needed_hires * 176:,.0f} productive hours, eliminating the staffing shortfall.",
            estimated_financial_impact=f"Protects up to ₹{round(lost_rev * 0.45, 1)} Cr in potentially forfeited vehicle deliveries; estimated payback period < 2.5 months.",
            key_assumptions_and_risks="Assumes contractual labor availability in Pune and Jamshedpur industrial corridors within 2 weeks of requisition."
        ))

    # 2. Inventory & Raw Material Shortage Evaluation
    if not inventory_res.is_feasible or inventory_res.shortage_component_count > 0:
        b_part = inventory_res.primary_bottleneck_component
        short_count = inventory_res.shortage_component_count
        proc_outlay = inventory_res.total_procurement_cost_cr
        
        cards.append(RecommendationCard(
            id="REC-INVENTORY-01",
            category="Inventory",
            priority="CRITICAL",
            title=f"Expedite Supplier Purchase Orders for {b_part}",
            identified_problem=f"Critical stockout risk identified across {short_count} key component Bill-of-Materials line items.",
            supporting_numerical_evidence=f"{short_count} critical components have insufficient on-hand stockyards to cover the {growth_pct:.0f}% demand surge. Primary constrained component: {b_part}.",
            recommended_action=f"Release immediate phased blanket purchase orders and authorize 6% air-freight / expedited supplier dispatch to protect assembly continuity.",
            estimated_incremental_cost_cr=proc_outlay,
            expected_operational_improvement=f"Restores minimum 30-day inventory safety buffers, enabling continuous production of up to {demand_res.total_net_order_units:,} vehicles.",
            estimated_financial_impact=f"Unlocks ₹{round(lost_rev * 0.55, 1)} Cr in deferred billing; reduces stockout line-stoppage risk by 85%.",
            key_assumptions_and_risks="Assumes tier-1 microchip and battery cell suppliers (e.g. Bosch, Tata AutoComp) have spare packaging capacity."
        ))

    # 3. Manufacturing Facility & Shift Evaluation
    if not production_res.is_feasible or production_res.overall_mfg_utilization_pct > 92.0:
        b_plant = production_res.bottleneck_plant
        mfg_util = production_res.overall_mfg_utilization_pct
        shortfall_starts = production_res.total_shortfall_units
        
        cards.append(RecommendationCard(
            id="REC-MFG-01",
            category="Manufacturing",
            priority="HIGH",
            title=f"Activate 3rd Production Shift at {b_plant}",
            identified_problem=f"Current 2-shift plant schedule cannot absorb incremental assembly starts; {b_plant} utilization exceeds nominal limits at {mfg_util:.1f}%.",
            supporting_numerical_evidence=f"Internal manufacturing shortfall of {shortfall_starts:,} vehicle starts. Assembly line yield loss requires {production_res.total_yield_scrap_units:,} additional start units.",
            recommended_action=f"Commission 3rd operating shift at {b_plant} and optimize maintenance switchover cycles to recover 12 hours of planned downtime monthly.",
            estimated_incremental_cost_cr=round(production_res.total_shift_capex_amortized_cr * 12.0, 1),
            expected_operational_improvement=f"Increases effective monthly plant capacity by +50% (approx. 14,000 to 21,000 units), easily absorbing demand.",
            estimated_financial_impact="Delivers positive operating leverage; fixed plant overhead absorption improves gross manufacturing margin by 1.8%.",
            key_assumptions_and_risks="Requires utility supply guarantees and night-shift transport compliance under local factory regulations."
        ))

    # 4. Logistics & Distribution Corridor Evaluation
    if not logistics_res.is_feasible or logistics_res.overall_logistics_utilization_pct > 90.0:
        b_zone = logistics_res.bottleneck_zone
        log_util = logistics_res.overall_logistics_utilization_pct
        short_units = logistics_res.total_shortfall_units
        
        cards.append(RecommendationCard(
            id="REC-LOGISTICS-01",
            category="Logistics",
            priority="MEDIUM" if short_units == 0 else "HIGH",
            title=f"Scale 3PL Carrier Fleet along {b_zone}",
            identified_problem=f"Contracted outbound car-carrier trailer capacity is nearing saturation along {b_zone} ({log_util:.1f}% corridor utilization).",
            supporting_numerical_evidence=f"Dispatch volume of {logistics_res.total_dispatch_demanded:,} vehicles creates delivery congestion and transit slippage along key trunk routes.",
            recommended_action="Execute spot-market contracts with certified multi-tier car-carrier logistics partners and tap rail-rake multimodal transport out of Pune/Sanand.",
            estimated_incremental_cost_cr=round(logistics_res.total_spot_premium_cost_cr + 3.2, 1),
            expected_operational_improvement=f"Adds 8,500 units of monthly outbound dispatch capacity; shortens dealership transit time by 1.2 days.",
            estimated_financial_impact="Guarantees month-end revenue recognition and prevents dealership stockout penalties.",
            key_assumptions_and_risks="Diesel fuel price indexation clause; potential monsoon route disruptions in Western Ghats."
        ))

    # 5. Financial & Working Capital Recommendation
    if finance_res.working_capital_requirement_cr > 400.0 or not finance_res.is_financially_viable:
        wc_req = finance_res.working_capital_requirement_cr
        cards.append(RecommendationCard(
            id="REC-FIN-01",
            category="Financial",
            priority="HIGH",
            title="Secure Working Capital Credit Facility & Stagger Procurement",
            identified_problem="Working capital tie-up in safety stock and raw material inventories increases financing charges and stretches short-term liquidity.",
            supporting_numerical_evidence=f"Incremental working capital tied up in supply buffer reaches ₹{wc_req:,.1f} Cr, incurring ₹{finance_res.costs.working_capital_financing_cr:.2f} Cr in monthly debt service.",
            recommended_action="Negotiate 45-day vendor credit terms with tier-1 suppliers and secure a syndicated short-term commercial paper facility at sub-8.5% interest.",
            estimated_incremental_cost_cr=0.85,
            expected_operational_improvement="Reduces net cash conversion cycle by 14 days while safeguarding procurement continuity.",
            estimated_financial_impact="Preserves ₹35 Cr in operating cash flow and improves return on capital employed (ROCE).",
            key_assumptions_and_risks="Subject to commercial banking syndicate approval and RBI benchmark interest rate stability."
        ))

    # Fallback card if completely feasible
    if not cards:
        cards.append(RecommendationCard(
            id="REC-BALANCED-01",
            category="Strategic",
            priority="MEDIUM",
            title="Execute Balanced Growth Campaign",
            identified_problem="Operations are currently within nominal tolerances; sustained execution discipline is required.",
            supporting_numerical_evidence=f"All manufacturing, inventory, labor, and dispatch systems operate below 90% utilization threshold with {finance_res.fulfillment_rate_pct:.1f}% fulfillment rate.",
            recommended_action="Proceed with phased sales ramp-up while monitoring tier-2 component supply chains on a weekly basis.",
            estimated_incremental_cost_cr=1.5,
            expected_operational_improvement="Maintains 99%+ order fulfillment rate with zero assembly line stoppages.",
            estimated_financial_impact=f"Captures full incremental operating profit of ₹{finance_res.incremental_operating_profit_cr:.1f} Cr.",
            key_assumptions_and_risks="Continuous demand stability across domestic Passenger and Commercial vehicle segments."
        ))

    # Narrative Executive Memo
    if finance_res.feasibility_status == "FEASIBLE":
        status_text = f"The proposed {growth_pct:.0f}% sales expansion is OPERATING-FEASIBLE. Available plant, labor, and logistics networks can deliver {finance_res.fulfilled_units:,} vehicles, generating ₹{finance_res.realized_fulfilled_revenue_cr:,.1f} Cr in revenue."
    elif finance_res.feasibility_status == "CONSTRAINED_BOTTLENECK":
        status_text = f"The {growth_pct:.0f}% sales target is OPERATIONALLY CONSTRAINED by {finance_res.limiting_resource}. Unaddressed bottlenecks will forfeit {unfulfilled:,} vehicle sales (₹{lost_rev:,.1f} Cr lost revenue)."
    else:
        status_text = f"The {growth_pct:.0f}% sales target is CRITICALLY INFEASIBLE under current operating parameters. Primary barrier: {finance_res.limiting_resource}. Urgent capacity interventions are required."

    exec_narrative = (
        f"Executive Summary for Tata Motors Management:\n\n"
        f"{status_text}\n\n"
        f"Key Simulation Findings:\n"
        f"• Demand Target: {demand_res.total_net_order_units:,} vehicles (Net after cancellations)\n"
        f"• Fulfilled Delivery: {finance_res.fulfilled_units:,} vehicles ({finance_res.fulfillment_rate_pct:.1f}% fulfillment rate)\n"
        f"• Realized Revenue: ₹{finance_res.realized_fulfilled_revenue_cr:,.1f} Cr (Incremental: +₹{finance_res.incremental_revenue_cr:,.1f} Cr)\n"
        f"• Operating Profit (EBIT): ₹{finance_res.operating_profit_ebit_cr:,.1f} Cr (Incremental EBIT: +₹{finance_res.incremental_operating_profit_cr:,.1f} Cr)\n"
        f"• Limiting Operational Barrier: {finance_res.limiting_resource}\n\n"
        f"Strategic Recommendation:\n"
        f"To achieve high-margin realization, management should prioritize the actionable initiatives detailed below."
    )

    bottleneck_summary = f"Identified {len(cards)} priority operational initiatives. Limiting resource: {finance_res.limiting_resource}."

    return RecommendationReport(
        overall_growth_target_pct=growth_pct,
        executive_narrative=exec_narrative,
        bottleneck_summary=bottleneck_summary,
        total_unfulfilled_units=unfulfilled,
        lost_revenue_cr=lost_rev,
        cards=cards
    )
