from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from models import (
    DangerLevel, VisitStatus, RoadCondition, CommunityWillingness,
    FieldRecommendation, LandVerificationStatus, OwnershipStatus, AcquisitionStatus
)

class VillageSchema(BaseModel):
    id: int
    name: str
    district: str
    state: str
    danger_level: DangerLevel
    risk_label: str
    ai_tier: str
    families_affected: int
    hazard_score: float
    evidence: List[str]
    data_sources_table: List[Dict[str, Any]]
    shap_features: List[Dict[str, Any]]
    population_triangulation: Dict[str, Any]
    disaster_history: List[Dict[str, Any]]
    intervention_ladder: Dict[str, Any]
    notifications_sent: List[Dict[str, Any]]
    assigned_officer: str
    visit_status: VisitStatus
    assigned_visit_date: Optional[date] = None
    flagged_at: datetime
    current_stage_index: int
    circle1_sent_at: Optional[datetime] = None
    circle2_sent_at: Optional[datetime] = None
    circle3_sent_at: Optional[datetime] = None
    district_meeting_logged_at: Optional[datetime] = None
    meeting_details: Optional[Dict[str, Any]] = None
    decision_recorded_at: Optional[datetime] = None
    decision_details: Optional[Dict[str, Any]] = None
    stage_entered_at: datetime
    is_escalated: bool
    escalation_reason: Optional[str] = None

    class Config:
        from_attributes = True

class FieldReportCreateSchema(BaseModel):
    village_id: int
    submitted_by: str
    visit_date: date
    gps_coordinates: str
    actual_families_count: int
    houses_in_risk_zone: int
    landslide_signs_observed: bool
    cracks_in_ground_observed: bool
    water_logging_observed: bool
    slope_erosion_visible: bool
    road_condition: RoadCondition
    community_willing_to_relocate: CommunityWillingness
    nearest_safe_structure_distance_km: float
    field_officer_recommendation: FieldRecommendation
    observations: str
    photo_count: int
    is_offline_synced: Optional[bool] = True

class FieldReportSchema(FieldReportCreateSchema):
    id: int
    submitted_at: datetime

    class Config:
        from_attributes = True

class LandSurveyRecordSchema(BaseModel):
    id: int
    site_id: int
    survey_number: str
    recorded_owner: str
    ownership_status: OwnershipStatus
    acquisition_status: AcquisitionStatus
    notes: Optional[str] = None
    last_verified_by: Optional[str] = None
    last_verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UpdateSurveyRecordSchema(BaseModel):
    ownership_status: OwnershipStatus
    acquisition_status: AcquisitionStatus
    notes: Optional[str] = ""
    verified_by: str = "Revenue Officer M. K. Pillai"

class RelocationSiteSchema(BaseModel):
    id: int
    name: str
    district: str
    state: str
    linked_village_name: str
    capacity_families: int
    rank_label: str
    ahp_score_summary: str
    ahp_breakdown: List[Dict[str, Any]]
    site_hazard_score: float
    verification_status: LandVerificationStatus
    pending_days: int
    survey_records: List[LandSurveyRecordSchema] = []

    class Config:
        from_attributes = True

class AuditLogSchema(BaseModel):
    id: int
    role: str
    village_or_site: str
    action: str
    performed_by: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class SendCircle1Schema(BaseModel):
    officer_name: str = "Revenue Officer M. K. Pillai"
    collector_message: str
    collector_channel: str = "WhatsApp"
    sdma_message: str
    sdma_channel: str = "Email"
    bdo_message: str
    bdo_channel: str = "SMS"

class SendCircle2Schema(BaseModel):
    officer_name: str = "Revenue Officer M. K. Pillai"
    ndrf_message: str
    ndrf_channel: str = "SMS"
    hospital_message: str
    hospital_channel: str = "Email"

class SendCircle3Schema(BaseModel):
    officer_name: str = "Revenue Officer M. K. Pillai"
    selected_ngos: List[str]
    ngo_message: str
    ngo_channel: str = "WhatsApp"
    panchayat_message: str
    panchayat_channel: str = "Email"

class LogMeetingSchema(BaseModel):
    officer_name: str = "Revenue Officer M. K. Pillai"
    meeting_date: date
    attendees: List[str]
    outcome: str

class RecordDecisionSchema(BaseModel):
    officer_name: str = "Revenue Officer M. K. Pillai"
    decision: str

class EscalateCaseSchema(BaseModel):
    officer_name: str = "Revenue Officer M. K. Pillai"
    next_authority: str
    message: str

class DismissEscalationSchema(BaseModel):
    officer_name: str = "Revenue Officer M. K. Pillai"
    reason: str
