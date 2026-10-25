"""
Pydantic Schemas for TataSim AI API Requests and Responses.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.engine.demand import DemandPlanResult
from app.engine.workforce import WorkforceAnalysisResult
from app.engine.inventory import InventoryAnalysisResult
from app.engine.production import ProductionAnalysisResult
from app.engine.logistics import LogisticsAnalysisResult
from app.engine.finance import FinancialImpactResult
from app.engine.recommendations import RecommendationReport
from app.engine.optimizer import OptimizationResult
from app.engine.risk import MonteCarloRiskResult

class ScenarioParameters(BaseModel):
    sales_growth_target_pct: float = Field(20.0, ge=0.0, le=100.0, description="Target sales growth rate in %")
    planning_horizon: str = Field("monthly", description="'monthly', 'quarterly', or 'annual'")
    target_segments: List[str] = Field(["PV", "CV", "EV"], description="Target segments")
    additional_hires: int = Field(0, ge=0, le=5000, description="Additional technician hires")
    overtime_pct: float = Field(0.0, ge=0.0, le=100.0, description="Authorized overtime pool utilization %")
    plants_with_3rd_shift: List[str] = Field([], description="Plant IDs activating 3rd shift")
    safety_stock_buffer_pct: float = Field(0.0, ge=-50.0, le=100.0, description="Inventory safety buffer adjustment %")
    expedite_inventory: bool = Field(False, description="Authorize air freight / expedited PO releases")
    subcontracting_units: int = Field(0, ge=0, le=25000, description="Outsourced contract assembly units")
    third_party_logistics_pct: float = Field(0.0, ge=0.0, le=100.0, description="3PL emergency transport fleet %")
    downtime_reduction_pct: float = Field(0.0, ge=0.0, le=50.0, description="Maintenance downtime reduction %")
    express_freight: bool = Field(False, description="Express transit freight delivery")

class SimulationResponse(BaseModel):
    scenario_id: Optional[str] = None
    scenario_name: str
    parameters: ScenarioParameters
    demand: DemandPlanResult
    workforce: WorkforceAnalysisResult
    inventory: InventoryAnalysisResult
    production: ProductionAnalysisResult
    logistics: LogisticsAnalysisResult
    finance: FinancialImpactResult
    recommendations: RecommendationReport

class ScenarioCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    description: Optional[str] = None
    parameters: ScenarioParameters

class ScenarioUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[ScenarioParameters] = None

class ScenarioListItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_preset: bool
    parameters: ScenarioParameters
    feasibility_status: Optional[str] = None
    fulfilled_units: Optional[int] = None
    revenue_cr: Optional[float] = None
    operating_profit_cr: Optional[float] = None
    incremental_profit_cr: Optional[float] = None
    limiting_resource: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ScenarioCompareRequest(BaseModel):
    scenario_ids: List[str]

class ScenarioComparisonItem(BaseModel):
    scenario_id: str
    scenario_name: str
    sales_growth_target_pct: float
    demanded_units: int
    fulfilled_units: int
    unfulfilled_units: int
    fulfillment_rate_pct: float
    revenue_cr: float
    operating_profit_cr: float
    incremental_profit_cr: float
    total_operating_cost_cr: float
    working_capital_cr: float
    feasibility_status: str
    limiting_resource: str
    bottleneck_department: str
    bottleneck_plant: str
    bottleneck_inventory: str
    bottleneck_logistics: str
    workforce_utilization_pct: float
    production_utilization_pct: float
    logistics_utilization_pct: float

class ScenarioComparisonResponse(BaseModel):
    scenarios: List[ScenarioComparisonItem]
    best_profit_scenario_id: str
    most_feasible_scenario_id: str
    summary_analysis: str

class ExecutiveDashboardSummary(BaseModel):
    current_monthly_sales_revenue_cr: float
    target_monthly_sales_revenue_cr: float
    baseline_units: int
    target_projected_units: int
    fulfilled_units: int
    unfulfilled_units: int
    fulfillment_rate_pct: float
    available_workforce_headcount: int
    effective_workforce_utilization_pct: float
    inventory_shortage_components_count: int
    manufacturing_capacity_utilization_pct: float
    logistics_capacity_utilization_pct: float
    estimated_operating_costs_cr: float
    projected_operating_profit_cr: float
    incremental_operating_profit_cr: float
    number_of_operational_bottlenecks: int
    overall_growth_feasibility_status: str
    limiting_resource: str
    active_scenario_name: str
    illustrative_data_disclaimer: str

class CSVUploadResponse(BaseModel):
    filename: str
    dataset_type: str
    rows_processed: int
    validation_status: str
    errors: List[str]
    message: str
