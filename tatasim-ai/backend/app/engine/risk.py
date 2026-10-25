"""
Monte Carlo Risk and Uncertainty Analysis Engine for TataSim AI.
Performs probabilistic simulations across demand shocks, supplier lead time delays,
plant machine breakdowns, logistics disruptions, and input cost volatility.
"""
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

class HistogramBin(BaseModel):
    bin_range: str
    bin_center_cr: float
    frequency: int
    probability_pct: float

class RiskSensitivityFactor(BaseModel):
    risk_factor: str
    correlation_with_profit: float
    impact_severity: str  # "HIGH", "MEDIUM", "LOW"
    description: str

class MonteCarloRiskResult(BaseModel):
    iterations_run: int
    random_seed: int
    mean_operating_profit_cr: float
    median_operating_profit_cr: float
    std_dev_profit_cr: float
    percentile_5th_var_cr: float  # Value at Risk
    percentile_95th_cr: float
    probability_meeting_sales_target_pct: float
    probability_material_shortage_pct: float
    probability_budget_overrun_pct: float
    risk_level_summary: str
    histogram_bins: List[HistogramBin]
    sensitivity_ranking: List[RiskSensitivityFactor]

def run_monte_carlo_simulation(
    base_target_demand: int,
    base_capacity_limit: int,
    base_asp_inr: float,
    base_variable_cost_cr: float,
    base_fixed_cost_cr: float,
    iterations: int = 1000,
    random_seed: int = 42
) -> MonteCarloRiskResult:
    """
    Executes vectorized Monte Carlo simulation with reproducible seed.
    """
    np.random.seed(random_seed)
    n = max(100, min(5000, iterations))
    
    # 1. Stochastic demand factor: Normal(mean=1.0, std=0.06)
    demand_factors = np.random.normal(loc=1.0, scale=0.06, size=n)
    simulated_demand = np.maximum(base_target_demand * 0.75, base_target_demand * demand_factors)
    
    # 2. Plant capacity / breakdown shock: Beta(alpha=18, beta=2) -> range ~0.85 to 0.99
    plant_uptime_factors = np.random.beta(a=18, b=2, size=n)
    simulated_mfg_cap = base_capacity_limit * plant_uptime_factors
    
    # 3. Supplier material availability shock: Beta(14, 2)
    material_avail_factors = np.random.beta(a=14, b=2, size=n)
    simulated_mat_cap = base_capacity_limit * 1.05 * material_avail_factors
    
    # 4. Logistics fleet availability shock: Normal(1.0, 0.04)
    logistics_factors = np.random.normal(loc=1.0, scale=0.04, size=n)
    simulated_log_cap = base_capacity_limit * 1.02 * logistics_factors
    
    # 5. Raw material price shock: Normal(mean=1.0, std=0.045)
    cost_inflation_factors = np.random.normal(loc=1.0, scale=0.045, size=n)
    
    # Physical fulfillment in each run is the minimum of demand and all operational limits
    physical_ceilings = np.minimum(simulated_mfg_cap, np.minimum(simulated_mat_cap, simulated_log_cap))
    fulfilled_units = np.minimum(simulated_demand, physical_ceilings)
    
    fulfillment_ratios = fulfilled_units / simulated_demand
    
    # Financial results
    # Revenue = fulfilled * ASP
    revenues_cr = (fulfilled_units * base_asp_inr) / 1e7
    var_costs_cr = base_variable_cost_cr * (fulfilled_units / max(1, base_target_demand)) * cost_inflation_factors
    operating_profits_cr = revenues_cr - var_costs_cr - base_fixed_cost_cr
    
    # Statistics
    mean_profit = float(np.mean(operating_profits_cr))
    median_profit = float(np.median(operating_profits_cr))
    std_profit = float(np.std(operating_profits_cr))
    p5 = float(np.percentile(operating_profits_cr, 5))
    p95 = float(np.percentile(operating_profits_cr, 95))
    
    # Probabilities
    prob_target_met = float(np.mean(fulfillment_ratios >= 0.98) * 100.0)
    prob_stockout = float(np.mean(simulated_mat_cap < simulated_demand) * 100.0)
    prob_loss = float(np.mean(operating_profits_cr < 150.0) * 100.0)
    
    # Histogram generation (20 bins)
    hist, bin_edges = np.histogram(operating_profits_cr, bins=20)
    bins_data = []
    total_samples = len(operating_profits_cr)
    
    for i in range(len(hist)):
        low = bin_edges[i]
        high = bin_edges[i+1]
        mid = (low + high) / 2.0
        pct = (hist[i] / total_samples) * 100.0
        bins_data.append(HistogramBin(
            bin_range=f"₹{int(low)} - ₹{int(high)} Cr",
            bin_center_cr=round(float(mid), 1),
            frequency=int(hist[i]),
            probability_pct=round(pct, 1)
        ))
        
    # Sensitivity ranking (Correlations with Operating Profit)
    corr_demand = float(np.corrcoef(simulated_demand, operating_profits_cr)[0, 1])
    corr_mfg = float(np.corrcoef(simulated_mfg_cap, operating_profits_cr)[0, 1])
    corr_mat = float(np.corrcoef(simulated_mat_cap, operating_profits_cr)[0, 1])
    corr_cost = float(np.corrcoef(cost_inflation_factors, operating_profits_cr)[0, 1])
    corr_log = float(np.corrcoef(simulated_log_cap, operating_profits_cr)[0, 1])
    
    sensitivities = [
        RiskSensitivityFactor(
            risk_factor="Market Demand Shock",
            correlation_with_profit=round(corr_demand, 3),
            impact_severity="HIGH" if abs(corr_demand) > 0.4 else "MEDIUM",
            description="Variations in customer booking order volume drive top-line revenue scale."
        ),
        RiskSensitivityFactor(
            risk_factor="Raw Material & Component Stockout",
            correlation_with_profit=round(corr_mat, 3),
            impact_severity="HIGH" if abs(corr_mat) > 0.3 else "MEDIUM",
            description="Supplier delivery delays cap maximum assembly throughput."
        ),
        RiskSensitivityFactor(
            risk_factor="Input Material Cost Inflation",
            correlation_with_profit=round(corr_cost, 3),
            impact_severity="HIGH" if abs(corr_cost) > 0.3 else "MEDIUM",
            description="Volatility in steel, cell chemistry, and freight spot rates erode margins."
        ),
        RiskSensitivityFactor(
            risk_factor="Plant Unplanned Downtime",
            correlation_with_profit=round(corr_mfg, 3),
            impact_severity="MEDIUM",
            description="Machine breakdowns and tooling maintenance restrict line output."
        ),
        RiskSensitivityFactor(
            risk_factor="Outbound Logistics Disruption",
            correlation_with_profit=round(corr_log, 3),
            impact_severity="LOW",
            description="Trunk highway carrier delays impact dispatch throughput."
        )
    ]
    
    sensitivities.sort(key=lambda s: abs(s.correlation_with_profit), reverse=True)
    
    if prob_target_met >= 85.0 and prob_stockout < 20.0:
        summary = "LOW RISK PROFILE: Operational buffers are resilient against 90%+ of stochastic disruptions."
    elif prob_target_met >= 65.0:
        summary = "MODERATE RISK PROFILE: Vulnerable to simultaneous supplier delays and assembly line downtime."
    else:
        summary = "HIGH RISK PROFILE: >35% probability of severe fulfillment slippage without active buffers."

    return MonteCarloRiskResult(
        iterations_run=n,
        random_seed=random_seed,
        mean_operating_profit_cr=round(mean_profit, 2),
        median_operating_profit_cr=round(median_profit, 2),
        std_dev_profit_cr=round(std_profit, 2),
        percentile_5th_var_cr=round(p5, 2),
        percentile_95th_cr=round(p95, 2),
        probability_meeting_sales_target_pct=round(prob_target_met, 1),
        probability_material_shortage_pct=round(prob_stockout, 1),
        probability_budget_overrun_pct=round(prob_loss, 1),
        risk_level_summary=summary,
        histogram_bins=bins_data,
        sensitivity_ranking=sensitivities
    )
