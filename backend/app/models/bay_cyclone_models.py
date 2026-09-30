from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, JSON
from app.database import Base

class BayCycloneSimulationModel(Base):
    __tablename__ = "bay_cyclone_simulations"

    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String, nullable=False)
    basin_region = Column(String, nullable=False, default="Bay of Bengal & Coastal APAC")
    category = Column(String, nullable=False)
    wind_speed_kmh = Column(Float, nullable=False)
    central_pressure_hpa = Column(Float, nullable=False)
    predicted_24h_precip_mm = Column(Float, nullable=False)
    storm_surge_height_m = Column(Float, nullable=False)
    coastal_reach_km = Column(Float, nullable=False)
    inundation_area_sqkm = Column(Float, nullable=False)
    
    # GEE satellite imagery metadata & status
    gee_feed_status = Column(String, nullable=False, default="GEE_LIVE_ACTIVE")
    gee_metadata = Column(JSON, nullable=False)

    # Gemini 3.7 Flash Multimodal Reasoning status & outputs
    gemini_reasoning_status = Column(String, nullable=False, default="GEMINI_3.7_FLASH_ACTIVE")
    gemini_multimodal_analysis = Column(JSON, nullable=False)

    # Rainfall pathways & storm surge inundation vectors
    damage_pathways = Column(JSON, nullable=False)

    # Infrastructure Exposure: Power Grids, Arterial Roads, Medical Shelters
    infrastructure_exposure = Column(JSON, nullable=False)

    # Parametric Insurance Liquidity Triggers
    parametric_insurance = Column(JSON, nullable=False)

    # Automated Early-Warning Advisory Dispatches
    early_warning_advisories = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
