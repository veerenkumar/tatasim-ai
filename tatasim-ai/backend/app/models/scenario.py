"""
SQLAlchemy Models for TataSim AI Scenarios and Simulation Run Persistence.
"""
from datetime import datetime
import json
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from app.database import Base

class ScenarioModel(Base):
    __tablename__ = "scenarios"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    is_preset = Column(Boolean, default=False)
    
    # Assumption Parameters
    sales_growth_target_pct = Column(Float, default=20.0)
    planning_horizon = Column(String(32), default="monthly")
    target_segments = Column(Text, default='["PV", "CV", "EV"]')  # JSON array
    additional_hires = Column(Integer, default=0)
    overtime_pct = Column(Float, default=0.0)
    plants_with_3rd_shift = Column(Text, default='[]')  # JSON array
    safety_stock_buffer_pct = Column(Float, default=0.0)
    expedite_inventory = Column(Boolean, default=False)
    subcontracting_units = Column(Integer, default=0)
    third_party_logistics_pct = Column(Float, default=0.0)
    downtime_reduction_pct = Column(Float, default=0.0)
    express_freight = Column(Boolean, default=False)
    
    # Persisted Simulation Output Cache (JSON)
    cached_results = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_preset": self.is_preset,
            "parameters": {
                "sales_growth_target_pct": self.sales_growth_target_pct,
                "planning_horizon": self.planning_horizon,
                "target_segments": json.loads(self.target_segments) if self.target_segments else ["PV", "CV", "EV"],
                "additional_hires": self.additional_hires,
                "overtime_pct": self.overtime_pct,
                "plants_with_3rd_shift": json.loads(self.plants_with_3rd_shift) if self.plants_with_3rd_shift else [],
                "safety_stock_buffer_pct": self.safety_stock_buffer_pct,
                "expedite_inventory": self.expedite_inventory,
                "subcontracting_units": self.subcontracting_units,
                "third_party_logistics_pct": self.third_party_logistics_pct,
                "downtime_reduction_pct": self.downtime_reduction_pct,
                "express_freight": self.express_freight,
            },
            "cached_results": json.loads(self.cached_results) if self.cached_results else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
