"""
FastAPI REST Endpoints for TataSim AI.
Handles scenario simulations, dashboard summaries, SciPy optimization, Monte Carlo risk, and CSV uploads/exports.
"""
from typing import List, Optional
import uuid
import json
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scenario import ScenarioModel
from app.schemas.scenario import (
    ScenarioParameters, SimulationResponse, ScenarioCreateRequest,
    ScenarioUpdateRequest, ScenarioListItem, ScenarioCompareRequest,
    ScenarioComparisonResponse, ScenarioComparisonItem, ExecutiveDashboardSummary,
    CSVUploadResponse
)
from app.services.simulator import run_simulation
from app.services.data_loader import (
    validate_and_save_csv, load_sales_df, load_workforce_df,
    load_inventory_df, load_production_df, load_logistics_df,
    load_suppliers_df, load_cost_assumptions_df
)
from app.engine.optimizer import run_optimization, OptimizationRequest, OptimizationResult
from app.engine.risk import run_monte_carlo_simulation, MonteCarloRiskResult

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TataSim AI — What-If Business Simulator",
        "version": "1.0.0",
        "disclaimer": "All simulated metrics are illustrative synthetic models for Tata Motors Limited operations research."
    }

@router.get("/dashboard/summary", response_model=ExecutiveDashboardSummary)
def get_dashboard_summary(scenario_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns high-level executive dashboard summary KPIs for the active or requested scenario.
    Defaults to the 20% sales growth scenario if none specified.
    """
    target_id = scenario_id if scenario_id else "scenario-sales-growth-only"
    scenario = db.query(ScenarioModel).filter_by(id=target_id).first()
    
    if not scenario:
        # Fallback to baseline
        scenario = db.query(ScenarioModel).filter_by(id="scenario-baseline").first()

    if not scenario:
        # In-memory execution
        params = ScenarioParameters(sales_growth_target_pct=20.0)
        sim_res = run_simulation(params, scenario_name="Default 20% Growth Scenario")
    else:
        if scenario.cached_results:
            sim_res = SimulationResponse.model_validate_json(scenario.cached_results)
        else:
            p_dict = scenario.to_dict()["parameters"]
            params = ScenarioParameters(**p_dict)
            sim_res = run_simulation(params, scenario_id=scenario.id, scenario_name=scenario.name)
            scenario.cached_results = sim_res.model_dump_json()
            db.commit()

    # Count identified bottlenecks
    bottleneck_count = 0
    if not sim_res.workforce.is_feasible:
        bottleneck_count += 1
    if not sim_res.inventory.is_feasible:
        bottleneck_count += 1
    if not sim_res.production.is_feasible:
        bottleneck_count += 1
    if not sim_res.logistics.is_feasible:
        bottleneck_count += 1

    return ExecutiveDashboardSummary(
        current_monthly_sales_revenue_cr=sim_res.demand.total_baseline_revenue_cr,
        target_monthly_sales_revenue_cr=sim_res.finance.target_potential_revenue_cr,
        baseline_units=sim_res.demand.total_baseline_units,
        target_projected_units=sim_res.demand.total_net_order_units,
        fulfilled_units=sim_res.finance.fulfilled_units,
        unfulfilled_units=sim_res.finance.unfulfilled_units,
        fulfillment_rate_pct=sim_res.finance.fulfillment_rate_pct,
        available_workforce_headcount=sim_res.workforce.total_active_headcount + sim_res.workforce.total_additional_hires,
        effective_workforce_utilization_pct=sim_res.workforce.overall_utilization_pct,
        inventory_shortage_components_count=sim_res.inventory.shortage_component_count,
        manufacturing_capacity_utilization_pct=sim_res.production.overall_mfg_utilization_pct,
        logistics_capacity_utilization_pct=sim_res.logistics.overall_logistics_utilization_pct,
        estimated_operating_costs_cr=sim_res.finance.costs.total_modeled_operating_cost_cr,
        projected_operating_profit_cr=sim_res.finance.operating_profit_ebit_cr,
        incremental_operating_profit_cr=sim_res.finance.incremental_operating_profit_cr,
        number_of_operational_bottlenecks=bottleneck_count,
        overall_growth_feasibility_status=sim_res.finance.feasibility_status,
        limiting_resource=sim_res.finance.limiting_resource,
        active_scenario_name=sim_res.scenario_name,
        illustrative_data_disclaimer="SYNTHETIC DEMONSTRATION DATA: Never interpret as confidential internal Tata Motors records."
    )

@router.get("/scenarios", response_model=List[ScenarioListItem])
def list_scenarios(db: Session = Depends(get_db)):
    """
    Lists all saved preset and user-created scenarios with key performance outcomes.
    """
    scenarios = db.query(ScenarioModel).all()
    results = []
    
    for s in scenarios:
        s_dict = s.to_dict()
        params = ScenarioParameters(**s_dict["parameters"])
        
        sim_data = None
        if s.cached_results:
            try:
                sim_data = json.loads(s.cached_results)
            except Exception:
                pass
                
        results.append(ScenarioListItem(
            id=s.id,
            name=s.name,
            description=s.description,
            is_preset=s.is_preset,
            parameters=params,
            feasibility_status=sim_data["finance"]["feasibility_status"] if sim_data else "UNKNOWN",
            fulfilled_units=sim_data["finance"]["fulfilled_units"] if sim_data else None,
            revenue_cr=sim_data["finance"]["realized_fulfilled_revenue_cr"] if sim_data else None,
            operating_profit_cr=sim_data["finance"]["operating_profit_ebit_cr"] if sim_data else None,
            incremental_profit_cr=sim_data["finance"]["incremental_operating_profit_cr"] if sim_data else None,
            limiting_resource=sim_data["finance"]["limiting_resource"] if sim_data else None,
            created_at=s_dict["created_at"],
            updated_at=s_dict["updated_at"]
        ))
    return results

@router.post("/scenarios", response_model=SimulationResponse)
def create_scenario(req: ScenarioCreateRequest, db: Session = Depends(get_db)):
    """
    Creates and persists a new custom scenario.
    """
    scenario_id = f"custom-{uuid.uuid4().hex[:8]}"
    sim_res = run_simulation(req.parameters, scenario_id=scenario_id, scenario_name=req.name)
    
    new_scenario = ScenarioModel(
        id=scenario_id,
        name=req.name,
        description=req.description,
        is_preset=False,
        sales_growth_target_pct=req.parameters.sales_growth_target_pct,
        planning_horizon=req.parameters.planning_horizon,
        target_segments=json.dumps(req.parameters.target_segments),
        additional_hires=req.parameters.additional_hires,
        overtime_pct=req.parameters.overtime_pct,
        plants_with_3rd_shift=json.dumps(req.parameters.plants_with_3rd_shift),
        safety_stock_buffer_pct=req.parameters.safety_stock_buffer_pct,
        expedite_inventory=req.parameters.expedite_inventory,
        subcontracting_units=req.parameters.subcontracting_units,
        third_party_logistics_pct=req.parameters.third_party_logistics_pct,
        downtime_reduction_pct=req.parameters.downtime_reduction_pct,
        express_freight=req.parameters.express_freight,
        cached_results=sim_res.model_dump_json()
    )
    db.add(new_scenario)
    db.commit()
    return sim_res

@router.get("/scenarios/{scenario_id}", response_model=SimulationResponse)
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full simulation details for a scenario.
    """
    s = db.query(ScenarioModel).filter_by(id=scenario_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    if s.cached_results:
        return SimulationResponse.model_validate_json(s.cached_results)
        
    s_dict = s.to_dict()
    params = ScenarioParameters(**s_dict["parameters"])
    sim_res = run_simulation(params, scenario_id=s.id, scenario_name=s.name)
    s.cached_results = sim_res.model_dump_json()
    db.commit()
    return sim_res

@router.put("/scenarios/{scenario_id}", response_model=SimulationResponse)
def update_scenario(scenario_id: str, req: ScenarioUpdateRequest, db: Session = Depends(get_db)):
    """
    Updates parameters of an existing scenario and recomputes outcomes.
    """
    s = db.query(ScenarioModel).filter_by(id=scenario_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    if req.name:
        s.name = req.name
    if req.description is not None:
        s.description = req.description
        
    if req.parameters:
        s.sales_growth_target_pct = req.parameters.sales_growth_target_pct
        s.planning_horizon = req.parameters.planning_horizon
        s.target_segments = json.dumps(req.parameters.target_segments)
        s.additional_hires = req.parameters.additional_hires
        s.overtime_pct = req.parameters.overtime_pct
        s.plants_with_3rd_shift = json.dumps(req.parameters.plants_with_3rd_shift)
        s.safety_stock_buffer_pct = req.parameters.safety_stock_buffer_pct
        s.expedite_inventory = req.parameters.expedite_inventory
        s.subcontracting_units = req.parameters.subcontracting_units
        s.third_party_logistics_pct = req.parameters.third_party_logistics_pct
        s.downtime_reduction_pct = req.parameters.downtime_reduction_pct
        s.express_freight = req.parameters.express_freight
        
        sim_res = run_simulation(req.parameters, scenario_id=s.id, scenario_name=s.name)
        s.cached_results = sim_res.model_dump_json()
    else:
        p_dict = s.to_dict()["parameters"]
        params = ScenarioParameters(**p_dict)
        sim_res = run_simulation(params, scenario_id=s.id, scenario_name=s.name)
        s.cached_results = sim_res.model_dump_json()

    db.commit()
    return sim_res

@router.delete("/scenarios/{scenario_id}")
def delete_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """
    Deletes a user-created scenario.
    """
    s = db.query(ScenarioModel).filter_by(id=scenario_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found")
    if s.is_preset:
        raise HTTPException(status_code=400, detail="Cannot delete default preset scenario")
        
    db.delete(s)
    db.commit()
    return {"message": f"Scenario {scenario_id} deleted successfully."}

@router.post("/simulate", response_model=SimulationResponse)
def simulate_on_the_fly(params: ScenarioParameters):
    """
    On-the-fly calculation for real-time slider manipulation in frontend.
    """
    return run_simulation(params, scenario_name="Real-time Simulation")

@router.post("/scenarios/compare", response_model=ScenarioComparisonResponse)
def compare_scenarios(req: ScenarioCompareRequest, db: Session = Depends(get_db)):
    """
    Simultaneously evaluates and compares multiple scenarios side-by-side.
    """
    if len(req.scenario_ids) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 scenarios to compare.")

    items: List[ScenarioComparisonItem] = []
    
    for sid in req.scenario_ids:
        s = db.query(ScenarioModel).filter_by(id=sid).first()
        if not s:
            continue
            
        if s.cached_results:
            sim = SimulationResponse.model_validate_json(s.cached_results)
        else:
            p_dict = s.to_dict()["parameters"]
            sim = run_simulation(ScenarioParameters(**p_dict), scenario_id=s.id, scenario_name=s.name)

        items.append(ScenarioComparisonItem(
            scenario_id=s.id,
            scenario_name=s.name,
            sales_growth_target_pct=sim.parameters.sales_growth_target_pct,
            demanded_units=sim.finance.demanded_units,
            fulfilled_units=sim.finance.fulfilled_units,
            unfulfilled_units=sim.finance.unfulfilled_units,
            fulfillment_rate_pct=sim.finance.fulfillment_rate_pct,
            revenue_cr=sim.finance.realized_fulfilled_revenue_cr,
            operating_profit_cr=sim.finance.operating_profit_ebit_cr,
            incremental_profit_cr=sim.finance.incremental_operating_profit_cr,
            total_operating_cost_cr=sim.finance.costs.total_modeled_operating_cost_cr,
            working_capital_cr=sim.finance.working_capital_requirement_cr,
            feasibility_status=sim.finance.feasibility_status,
            limiting_resource=sim.finance.limiting_resource,
            bottleneck_department=sim.workforce.bottleneck_department,
            bottleneck_plant=sim.production.bottleneck_plant,
            bottleneck_inventory=sim.inventory.primary_bottleneck_component,
            bottleneck_logistics=sim.logistics.bottleneck_zone,
            workforce_utilization_pct=sim.workforce.overall_utilization_pct,
            production_utilization_pct=sim.production.overall_mfg_utilization_pct,
            logistics_utilization_pct=sim.logistics.overall_logistics_utilization_pct
        ))

    if not items:
        raise HTTPException(status_code=404, detail="None of the requested scenarios were found.")

    best_profit = max(items, key=lambda x: x.operating_profit_cr)
    feasible_items = [it for it in items if it.feasibility_status == "FEASIBLE"]
    most_feasible = max(feasible_items, key=lambda x: x.operating_profit_cr) if feasible_items else items[0]

    analysis = (
        f"Comparative Analysis across {len(items)} strategies:\n"
        f"• Highest Operating Profit: '{best_profit.scenario_name}' generating ₹{best_profit.operating_profit_cr:.1f} Cr (Incremental EBIT: +₹{best_profit.incremental_profit_cr:.1f} Cr).\n"
        f"• Recommended Feasible Path: '{most_feasible.scenario_name}' with {most_feasible.fulfillment_rate_pct:.1f}% fulfillment rate and zero unfulfilled backorders."
    )

    return ScenarioComparisonResponse(
        scenarios=items,
        best_profit_scenario_id=best_profit.scenario_id,
        most_feasible_scenario_id=most_feasible.scenario_id,
        summary_analysis=analysis
    )

@router.post("/optimize", response_model=OptimizationResult)
def optimize_allocation(req: OptimizationRequest):
    """
    Executes SciPy constrained optimization.
    """
    sales_df = load_sales_df()
    workforce_df = load_workforce_df()
    inventory_df = load_inventory_df()
    production_df = load_production_df()
    logistics_df = load_logistics_df()
    
    return run_optimization(
        sales_df=sales_df,
        workforce_df=workforce_df,
        inventory_df=inventory_df,
        production_df=production_df,
        logistics_df=logistics_df,
        req=req
    )

@router.post("/risk/analyze", response_model=MonteCarloRiskResult)
def analyze_risk(
    iterations: int = Query(1000, ge=100, le=5000),
    random_seed: int = Query(42),
    growth_target_pct: float = Query(20.0, ge=0.0, le=50.0)
):
    """
    Runs Monte Carlo simulation for risk and uncertainty analysis.
    """
    params = ScenarioParameters(sales_growth_target_pct=growth_target_pct)
    sim_res = run_simulation(params)
    
    return run_monte_carlo_simulation(
        base_target_demand=sim_res.demand.total_net_order_units,
        base_capacity_limit=sim_res.production.total_internal_capacity,
        base_asp_inr=1380000.0,
        base_variable_cost_cr=sim_res.finance.costs.total_variable_costs_cr,
        base_fixed_cost_cr=sim_res.finance.costs.total_fixed_recurring_costs_cr,
        iterations=iterations,
        random_seed=random_seed
    )

@router.get("/recommendations/{scenario_id}")
def get_recommendations(scenario_id: str, db: Session = Depends(get_db)):
    """
    Returns AI recommendations for a specific scenario.
    """
    s = db.query(ScenarioModel).filter_by(id=scenario_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found")
    if s.cached_results:
        sim = SimulationResponse.model_validate_json(s.cached_results)
        return sim.recommendations
    p_dict = s.to_dict()["parameters"]
    sim = run_simulation(ScenarioParameters(**p_dict), scenario_id=s.id, scenario_name=s.name)
    return sim.recommendations

@router.get("/data/overview")
def get_data_overview():
    """
    Returns high-level preview of all loaded operational datasets.
    """
    return {
        "sales": {"rows": len(load_sales_df()), "columns": list(load_sales_df().columns)},
        "workforce": {"rows": len(load_workforce_df()), "columns": list(load_workforce_df().columns)},
        "inventory": {"rows": len(load_inventory_df()), "columns": list(load_inventory_df().columns)},
        "production_capacity": {"rows": len(load_production_df()), "columns": list(load_production_df().columns)},
        "suppliers": {"rows": len(load_suppliers_df()), "columns": list(load_suppliers_df().columns)},
        "logistics": {"rows": len(load_logistics_df()), "columns": list(load_logistics_df().columns)},
        "cost_assumptions": {"rows": len(load_cost_assumptions_df()), "columns": list(load_cost_assumptions_df().columns)},
        "disclaimer": "All datasets are synthetic illustrations for Tata Motors operational simulation."
    }

@router.post("/data/upload", response_model=CSVUploadResponse)
async def upload_csv_data(file: UploadFile = File(...)):
    """
    Upload and validate replacement business CSV datasets.
    """
    contents = await file.read()
    is_valid, dtype, errors, row_count = validate_and_save_csv(file.filename, contents)
    
    if not is_valid:
        return CSVUploadResponse(
            filename=file.filename,
            dataset_type=dtype,
            rows_processed=row_count,
            validation_status="FAILED",
            errors=errors,
            message=f"Validation failed with {len(errors)} error(s)."
        )
        
    return CSVUploadResponse(
        filename=file.filename,
        dataset_type=dtype,
        rows_processed=row_count,
        validation_status="SUCCESS",
        errors=[],
        message=f"Successfully loaded and validated {row_count} rows for dataset '{dtype}'."
    )

@router.get("/reports/export/csv/{scenario_id}")
def export_scenario_csv(scenario_id: str, db: Session = Depends(get_db)):
    """
    Generates downloadable CSV with comprehensive scenario simulation breakdown.
    """
    s = db.query(ScenarioModel).filter_by(id=scenario_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    if s.cached_results:
        sim = SimulationResponse.model_validate_json(s.cached_results)
    else:
        p_dict = s.to_dict()["parameters"]
        sim = run_simulation(ScenarioParameters(**p_dict), scenario_id=s.id, scenario_name=s.name)

    data = [
        {"Category": "Overview", "Metric": "Scenario Name", "Value": sim.scenario_name, "Unit": ""},
        {"Category": "Overview", "Metric": "Growth Target", "Value": sim.parameters.sales_growth_target_pct, "Unit": "%"},
        {"Category": "Overview", "Metric": "Feasibility Status", "Value": sim.finance.feasibility_status, "Unit": ""},
        {"Category": "Overview", "Metric": "Limiting Resource", "Value": sim.finance.limiting_resource, "Unit": ""},
        {"Category": "Demand", "Metric": "Net Demanded Vehicles", "Value": sim.demand.total_net_order_units, "Unit": "Units"},
        {"Category": "Demand", "Metric": "Fulfilled Vehicles", "Value": sim.finance.fulfilled_units, "Unit": "Units"},
        {"Category": "Demand", "Metric": "Unfulfilled Backorders", "Value": sim.finance.unfulfilled_units, "Unit": "Units"},
        {"Category": "Demand", "Metric": "Fulfillment Rate", "Value": sim.finance.fulfillment_rate_pct, "Unit": "%"},
        {"Category": "Financial", "Metric": "Realized Revenue", "Value": sim.finance.realized_fulfilled_revenue_cr, "Unit": "₹ Cr"},
        {"Category": "Financial", "Metric": "Lost Revenue Bottleneck", "Value": sim.finance.lost_revenue_from_bottlenecks_cr, "Unit": "₹ Cr"},
        {"Category": "Financial", "Metric": "Total Modeled Costs", "Value": sim.finance.costs.total_modeled_operating_cost_cr, "Unit": "₹ Cr"},
        {"Category": "Financial", "Metric": "Operating Profit (EBIT)", "Value": sim.finance.operating_profit_ebit_cr, "Unit": "₹ Cr"},
        {"Category": "Financial", "Metric": "Incremental EBIT", "Value": sim.finance.incremental_operating_profit_cr, "Unit": "₹ Cr"},
        {"Category": "Workforce", "Metric": "Workforce Utilization", "Value": sim.workforce.overall_utilization_pct, "Unit": "%"},
        {"Category": "Workforce", "Metric": "Bottleneck Department", "Value": sim.workforce.bottleneck_department, "Unit": ""},
        {"Category": "Manufacturing", "Metric": "Plant Utilization", "Value": sim.production.overall_mfg_utilization_pct, "Unit": "%"},
        {"Category": "Manufacturing", "Metric": "Bottleneck Plant", "Value": sim.production.bottleneck_plant, "Unit": ""},
        {"Category": "Inventory", "Metric": "Shortage Components", "Value": sim.inventory.shortage_component_count, "Unit": "SKUs"},
        {"Category": "Logistics", "Metric": "Logistics Utilization", "Value": sim.logistics.overall_logistics_utilization_pct, "Unit": "%"}
    ]
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=TataSim_{scenario_id}_Report.csv"
    return response

@router.get("/reports/export/comparison-csv")
def export_comparison_csv(ids: str = Query(...), db: Session = Depends(get_db)):
    """
    Exports comparison matrix of selected scenarios as CSV.
    """
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    req = ScenarioCompareRequest(scenario_ids=id_list)
    comp_res = compare_scenarios(req, db)
    
    rows = []
    for s in comp_res.scenarios:
        rows.append({
            "Scenario Name": s.scenario_name,
            "Target Growth %": s.sales_growth_target_pct,
            "Demanded Units": s.demanded_units,
            "Fulfilled Units": s.fulfilled_units,
            "Fulfillment %": s.fulfillment_rate_pct,
            "Revenue (₹ Cr)": s.revenue_cr,
            "Operating Profit (₹ Cr)": s.operating_profit_cr,
            "Incremental Profit (₹ Cr)": s.incremental_profit_cr,
            "Total Cost (₹ Cr)": s.total_operating_cost_cr,
            "Feasibility": s.feasibility_status,
            "Limiting Resource": s.limiting_resource,
            "Workforce Util %": s.workforce_utilization_pct,
            "Plant Util %": s.production_utilization_pct,
            "Logistics Util %": s.logistics_utilization_pct
        })
    df = pd.DataFrame(rows)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=TataSim_Scenario_Comparison.csv"
    return response
