from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, ConfigDict

from app.database import Base

# ==========================================
# SQLAlchemy 2.0 Models
# ==========================================

class ResistanceAssessmentModel(Base):
    __tablename__ = "resistance_assessments"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, nullable=False, index=True)
    residing_duration_years = Column(Float, nullable=False)
    primary_livelihood_type = Column(String, nullable=False)
    distance_to_livelihood_km = Column(Float, nullable=False)
    welfare_scheme_compliance_rate = Column(Float, nullable=False)
    is_pesa_tribal_area = Column(Boolean, default=False)
    cultural_proximity_index = Column(Float, nullable=False)
    resistance_score = Column(Float, nullable=False)
    primary_driver = Column(String, nullable=False)
    requires_gram_sabha_liaison = Column(Boolean, default=False)
    shap_attributions = Column(JSON, nullable=True)
    assessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class PostRelocationCheckinModel(Base):
    __tablename__ = "post_relocation_checkins"

    id = Column(Integer, primary_key=True, index=True)
    red_zone_id = Column(Integer, nullable=False, index=True)
    checkin_day = Column(Integer, nullable=False) # 30, 90, 180
    field_officer_name = Column(String, nullable=False)
    gps_latitude = Column(Float, nullable=False)
    gps_longitude = Column(Float, nullable=False)
    human_presence_detected = Column(Boolean, default=False)
    structural_reflectance_change = Column(Float, default=0.0)
    ndvi_drop = Column(Float, default=0.0)
    status = Column(String, default="CLEARED") # CLEARED, REQUIRES_REVIEW
    notes = Column(Text, nullable=True)
    checked_in_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ClimateProjectionModel(Base):
    __tablename__ = "climate_projections"

    id = Column(Integer, primary_key=True, index=True)
    habitation_id = Column(Integer, nullable=False, index=True)
    baseline_hazard_score = Column(Float, nullable=False)
    risk_category_2031 = Column(String, nullable=False)
    hazard_score_2031 = Column(Float, nullable=False)
    risk_category_2036 = Column(String, nullable=False)
    hazard_score_2036 = Column(Float, nullable=False)
    risk_category_2046 = Column(String, nullable=False)
    hazard_score_2046 = Column(Float, nullable=False)
    projected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SentinelReportModel(Base):
    __tablename__ = "sentinel_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(String, nullable=False)
    observation_type = Column(String, nullable=False) # CRACK, SEEPAGE, EROSION, ROCKFALL
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    cluster_boost_applied = Column(Boolean, default=False)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class LegalClearanceModel(Base):
    __tablename__ = "legal_clearances"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, nullable=False, index=True)
    revenue_record_cleared = Column(Boolean, default=False)
    forest_reservation_flag = Column(Boolean, default=False) # True means encumbered
    gram_sabha_consent_obtained = Column(Boolean, default=False)
    court_dispute_pending = Column(Boolean, default=False)
    overall_status = Column(String, nullable=False) # LEGALLY_CLEARED vs BLOCKED
    checklist_details = Column(JSON, nullable=False)
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ==========================================
# Pydantic v2 Schemas
# ==========================================

class ResistanceInputSchema(BaseModel):
    village_id: int
    residing_duration_years: float = Field(..., ge=0, description="Duration in years community has resided")
    primary_livelihood_type: str = Field(..., description="AGRICULTURE, FISHING, TRIBAL_FOREST, DAILY_WAGE, OTHER")
    distance_to_livelihood_km: float = Field(..., ge=0)
    welfare_scheme_compliance_rate: float = Field(..., ge=0.0, le=1.0)
    is_pesa_tribal_area: bool = False
    cultural_proximity_index: float = Field(..., ge=0.0, le=1.0)

class ResistanceOutputSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    village_id: int
    resistance_score: float
    primary_driver: str
    requires_gram_sabha_liaison: bool
    shap_attributions: Dict[str, float]


class CheckinCreateSchema(BaseModel):
    red_zone_id: int
    checkin_day: int = Field(..., description="30, 90, or 180 day mark")
    field_officer_name: str
    gps_latitude: float = Field(..., ge=-90.0, le=90.0)
    gps_longitude: float = Field(..., ge=-180.0, le=180.0)
    human_presence_detected: bool
    structural_reflectance_change: float = Field(0.0, ge=0.0, le=1.0)
    ndvi_drop: float = Field(0.0, ge=-1.0, le=1.0)
    notes: Optional[str] = None

class SatelliteAnalysisSchema(BaseModel):
    red_zone_id: int
    ndvi_drop: float
    structural_reflectance_change: float
    satellite_pass_date: str

class MonitoringStatusSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    red_zone_id: int
    checkin_day: int
    field_officer_name: str
    status: str
    human_presence_detected: bool
    checked_in_at: datetime


class ClimateProjectionInputSchema(BaseModel):
    habitation_id: int
    baseline_hazard_score: float = Field(..., ge=0.0, le=1.0)
    precip_trend_mm_yr: float = 2.5
    sea_level_rise_mm_yr: float = 3.1
    slope_degradation_factor: float = 0.015

class ClimateProjectionOutputSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    habitation_id: int
    baseline_hazard_score: float
    risk_category_2031: str
    hazard_score_2031: float
    risk_category_2036: str
    hazard_score_2036: float
    risk_category_2046: str
    hazard_score_2046: float


class SpatialLivelihoodInputSchema(BaseModel):
    site_id: int
    site_lat: float
    site_lon: float
    historical_agri_zone_ids: List[int] = []
    historical_forest_block_ids: List[int] = []
    historical_fishing_zone_ids: List[int] = []

class LivelihoodAssessmentOutputSchema(BaseModel):
    site_id: int
    severed_access_percentage: float
    approval_status: str # APPROVED, CONDITIONAL_APPROVAL_LIVELIHOOD_RISK
    access_distance_km: float
    recommendation: str


class SentinelReportCreateSchema(BaseModel):
    reporter_id: str
    observation_type: str = Field(..., description="CRACK, SEEPAGE, EROSION, ROCKFALL")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    description: str = Field(..., min_length=10)

class SentinelReportOutputSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reporter_id: str
    observation_type: str
    latitude: float
    longitude: float
    cluster_boost_applied: bool
    reported_at: datetime


class CandidateProject(BaseModel):
    id: int
    name: str
    population: int = Field(..., gt=0)
    risk_score: float = Field(..., ge=0.0, le=1.0)
    cost: float = Field(..., gt=0)

class BudgetOptimizationInputSchema(BaseModel):
    total_budget: float = Field(..., gt=0, description="State Budget B in Rupee units")
    candidates: List[CandidateProject]

class BudgetAllocationItem(BaseModel):
    id: int
    name: str
    allocated_funding: float
    status: str # FULLY_FUNDED, LAND_ACQUISITION_ONLY, DEFERRED

class BudgetOptimizationOutputSchema(BaseModel):
    total_budget: float
    budget_utilized: float
    lives_protected: int
    allocations: List[BudgetAllocationItem]


class LegalClearanceInputSchema(BaseModel):
    site_id: int
    survey_number: str
    district: str
    village_name: str

class LegalClearanceOutputSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    site_id: int
    overall_status: str # LEGALLY_CLEARED vs BLOCKED
    revenue_record_cleared: bool
    forest_reservation_flag: bool
    gram_sabha_consent_obtained: bool
    court_dispute_pending: bool
    checklist_details: Dict[str, Any]
