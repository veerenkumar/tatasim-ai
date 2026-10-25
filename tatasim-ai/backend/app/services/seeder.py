"""
Database Seeder for TataSim AI Preset Scenarios.
Initializes the SQLite database schema and seeds 8 preset scenarios with precalculated simulation results.
"""
import json
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.scenario import ScenarioModel
from app.schemas.scenario import ScenarioParameters
from app.services.simulator import run_simulation

PRESET_SCENARIOS = [
    {
        "id": "scenario-baseline",
        "name": "1. Baseline (Steady State)",
        "description": "Steady-state operations with 0% sales growth, standard 2 shifts, and contractual workforce.",
        "is_preset": True,
        "parameters": ScenarioParameters(
            sales_growth_target_pct=0.0,
            planning_horizon="monthly",
            target_segments=["PV", "CV", "EV"],
            additional_hires=0,
            overtime_pct=0.0,
            plants_with_3rd_shift=[],
            safety_stock_buffer_pct=0.0,
            expedite_inventory=False,
            subcontracting_units=0,
            third_party_logistics_pct=0.0,
            downtime_reduction_pct=0.0,
            express_freight=False
        )
    },
    {
        "id": "scenario-sales-growth-only",
        "name": "2. Sales Growth Only (+20%)",
        "description": "Increases customer sales growth target by 20% without adding workforce, inventory, or plant capacity. Demonstrates severe bottlenecks and lost revenue.",
        "is_preset": True,
        "parameters": ScenarioParameters(
            sales_growth_target_pct=20.0,
            planning_horizon="monthly",
            target_segments=["PV", "CV", "EV"],
            additional_hires=0,
            overtime_pct=0.0,
            plants_with_3rd_shift=[],
            safety_stock_buffer_pct=0.0,
            expedite_inventory=False,
            subcontracting_units=0,
            third_party_logistics_pct=0.0,
            downtime_reduction_pct=0.0,
            express_freight=False
        )
    },
    {
        "id": "scenario-workforce-expansion",
        "name": "3. Workforce Expansion (+20% Sales)",
        "description": "Targets 20% sales growth supported by 450 new technician hires and 25% overtime authorization.",
        "is_preset": True,
        "parameters": ScenarioParameters(
            sales_growth_target_pct=20.0,
            planning_horizon="monthly",
            target_segments=["PV", "CV", "EV"],
            additional_hires=450,
            overtime_pct=25.0,
            plants_with_3rd_shift=[],
            safety_stock_buffer_pct=0.0,
            expedite_inventory=False,
            subcontracting_units=0,
            third_party_logistics_pct=0.0,
            downtime_reduction_pct=0.0,
            express_freight=False
        )
    },
    {
        "id": "scenario-inventory-expansion",
        "name": "4. Inventory Expansion (+20% Sales)",
        "description": "Targets 20% sales growth with +25% safety stock buffers and expedited supplier procurement orders.",
        "is_preset": True,
        "parameters": ScenarioParameters(
            sales_growth_target_pct=20.0,
            planning_horizon="monthly",
            target_segments=["PV", "CV", "EV"],
            additional_hires=0,
            overtime_pct=0.0,
            plants_with_3rd_shift=[],
            safety_stock_buffer_pct=25.0,
            expedite_inventory=True,
            subcontracting_units=0,
            third_party_logistics_pct=0.0,
            downtime_reduction_pct=0.0,
            express_freight=False
        )
    },
    {
        "id": "scenario-production-expansion",
        "name": "5. Production Expansion (+20% Sales)",
        "description": "Activates a 3rd shift at Pune and Sanand manufacturing facilities and optimizes maintenance downtime by 15%.",
        "is_preset": True,
        "parameters": ScenarioParameters(
            sales_growth_target_pct=20.0,
            planning_horizon="monthly",
            target_segments=["PV", "CV", "EV"],
            additional_hires=0,
            overtime_pct=0.0,
            plants_with_3rd_shift=["PLANT-PUN", "PLANT-SAN"],
            safety_stock_buffer_pct=0.0,
            expedite_inventory=False,
            subcontracting_units=0,
            third_party_logistics_pct=0.0,
            downtime_reduction_pct=15.0,
            express_freight=False
        )
    },
    {
        "id": "scenario-logistics-expansion",
        "name": "6. Logistics Expansion (+20% Sales)",
        "description": "Deploys 35% third-party emergency trailer capacity and express corridor dispatch across key freight hubs.",
        "is_preset": True,
        "parameters": ScenarioParameters(
            sales_growth_target_pct=20.0,
            planning_horizon="monthly",
            target_segments=["PV", "CV", "EV"],
            additional_hires=0,
            overtime_pct=0.0,
            plants_with_3rd_shift=[],
            safety_stock_buffer_pct=0.0,
            expedite_inventory=False,
            subcontracting_units=0,
            third_party_logistics_pct=35.0,
            downtime_reduction_pct=0.0,
            express_freight=True
        )
    },
    {
        "id": "scenario-balanced-growth",
        "name": "7. Balanced Growth Strategy (+20% Sales)",
        "description": "Calibrated multi-module strategy: +15% overtime, 280 technical hires, 3rd shift at Pune, +15% inventory buffer, and +25% 3PL logistics fleet. Achieves 100% fulfillment profitably.",
        "is_preset": True,
        "parameters": ScenarioParameters(
            sales_growth_target_pct=20.0,
            planning_horizon="monthly",
            target_segments=["PV", "CV", "EV"],
            additional_hires=280,
            overtime_pct=15.0,
            plants_with_3rd_shift=["PLANT-PUN"],
            safety_stock_buffer_pct=15.0,
            expedite_inventory=False,
            subcontracting_units=0,
            third_party_logistics_pct=25.0,
            downtime_reduction_pct=10.0,
            express_freight=False
        )
    },
    {
        "id": "scenario-aggressive-35",
        "name": "8. Aggressive Growth Strategy (+35% Sales)",
        "description": "High-expansion playbook: +35% target growth, 3rd shifts at Pune & Sanand, 620 hires, 30% overtime, +30% safety stock, +45% 3PL fleet, and 3,000 subcontracted units.",
        "is_preset": True,
        "parameters": ScenarioParameters(
            sales_growth_target_pct=35.0,
            planning_horizon="monthly",
            target_segments=["PV", "CV", "EV"],
            additional_hires=620,
            overtime_pct=30.0,
            plants_with_3rd_shift=["PLANT-PUN", "PLANT-SAN"],
            safety_stock_buffer_pct=30.0,
            expedite_inventory=True,
            subcontracting_units=3000,
            third_party_logistics_pct=45.0,
            downtime_reduction_pct=20.0,
            express_freight=True
        )
    }
]

def init_db_and_seed(db: Session = None):
    """
    Creates tables and seeds default preset scenarios.
    """
    Base.metadata.create_all(bind=engine)
    session = db if db else SessionLocal()
    
    try:
        for p in PRESET_SCENARIOS:
            existing = session.query(ScenarioModel).filter_by(id=p["id"]).first()
            sim_res = run_simulation(p["parameters"], scenario_id=p["id"], scenario_name=p["name"])
            res_json = sim_res.model_dump_json()

            if not existing:
                scenario_obj = ScenarioModel(
                    id=p["id"],
                    name=p["name"],
                    description=p["description"],
                    is_preset=p["is_preset"],
                    sales_growth_target_pct=p["parameters"].sales_growth_target_pct,
                    planning_horizon=p["parameters"].planning_horizon,
                    target_segments=json.dumps(p["parameters"].target_segments),
                    additional_hires=p["parameters"].additional_hires,
                    overtime_pct=p["parameters"].overtime_pct,
                    plants_with_3rd_shift=json.dumps(p["parameters"].plants_with_3rd_shift),
                    safety_stock_buffer_pct=p["parameters"].safety_stock_buffer_pct,
                    expedite_inventory=p["parameters"].expedite_inventory,
                    subcontracting_units=p["parameters"].subcontracting_units,
                    third_party_logistics_pct=p["parameters"].third_party_logistics_pct,
                    downtime_reduction_pct=p["parameters"].downtime_reduction_pct,
                    express_freight=p["parameters"].express_freight,
                    cached_results=res_json
                )
                session.add(scenario_obj)
            else:
                existing.cached_results = res_json
                
        session.commit()
    finally:
        if not db:
            session.close()

if __name__ == "__main__":
    init_db_and_seed()
    print("Database schema created and presets successfully seeded.")
