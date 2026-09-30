from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class CycloneSimulationInputSchema(BaseModel):
    event_name: Optional[str] = Field(default="Bay of Bengal Cyclone Super-Surge BOB-04")
    basin_region: Optional[str] = Field(default="Bay of Bengal & Coastal APAC")
    wind_speed_kmh: float = Field(default=185.0, ge=40.0, le=350.0, description="Max sustained wind speed in km/h")
    central_pressure_hpa: float = Field(default=940.0, ge=870.0, le=1020.0, description="Central atmospheric pressure in hPa")
    predicted_24h_precip_mm: float = Field(default=340.0, ge=10.0, le=1000.0, description="Predicted 24-hr cumulative rainfall in mm")
    storm_surge_height_m: float = Field(default=4.5, ge=0.5, le=12.0, description="Storm surge height in meters")
    coastal_reach_km: float = Field(default=12.5, ge=1.0, le=100.0, description="Inland inundation reach in km")
    use_gee_live_feed: Optional[bool] = Field(default=True)
    use_gemini_37_flash: Optional[bool] = Field(default=True)

class AdvisoryDispatchInputSchema(BaseModel):
    simulation_id: int
    authority_circles: List[str] = Field(default=["Circle 1: Government", "Circle 2: First Responders", "Circle 3: Municipalities & Shelters"])
    dispatch_notes: Optional[str] = Field(default="Pre-landfall anticipatory evacuation & infrastructure protection advisory.")

class ParametricPayoutInputSchema(BaseModel):
    simulation_id: int
    trigger_override: Optional[bool] = Field(default=False)
    payout_recipient: str = Field(default="State Disaster Liquidity Reserve / Municipal Relief Fund")

class CycloneSimulationOutputSchema(BaseModel):
    id: Optional[int] = None
    event_name: str
    basin_region: str
    category: str
    wind_speed_kmh: float
    central_pressure_hpa: float
    predicted_24h_precip_mm: float
    storm_surge_height_m: float
    coastal_reach_km: float
    inundation_area_sqkm: float
    gee_feed_status: str
    gee_metadata: Dict[str, Any]
    gemini_reasoning_status: str
    gemini_multimodal_analysis: Dict[str, Any]
    damage_pathways: List[Dict[str, Any]]
    infrastructure_exposure: Dict[str, Any]
    parametric_insurance: Dict[str, Any]
    early_warning_advisories: List[Dict[str, Any]]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
