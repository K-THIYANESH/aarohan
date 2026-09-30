from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from app.models import (
    UserRole, DangerLevel, VisitStatus, RoadCondition, CommunityWillingness,
    FieldRecommendation, LandVerificationStatus, OwnershipStatus, AcquisitionStatus,
    RapidIncidentStatus
)

class UserSchema(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    district: str
    state: str
    is_active: bool

    class Config:
        from_attributes = True

class LoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSchema

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
    visit_date: date
    gps_coordinates: str
    actual_families_count: int = Field(..., gt=0, lt=10000)
    houses_in_risk_zone: int = Field(..., ge=0)
    landslide_signs_observed: bool
    cracks_in_ground_observed: bool
    water_logging_observed: bool
    slope_erosion_visible: bool
    road_condition: RoadCondition
    community_willing_to_relocate: CommunityWillingness
    nearest_safe_structure_distance_km: float
    field_officer_recommendation: FieldRecommendation
    observations: str = Field(..., min_length=10) # Handled flexibly for normal (>=50) vs rapid (>=10) in validator
    photo_count: int = Field(0, ge=0)
    is_offline_synced: Optional[bool] = True
    submitted_by: Optional[str] = None

class FieldReportSchema(FieldReportCreateSchema):
    id: int
    submitted_by: str
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
    notes: Optional[str] = Field(None, max_length=1000)
    dispute_details: Optional[str] = None

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
    collector_message: str = Field(..., min_length=1)
    collector_channel: str = "WhatsApp"
    sdma_message: str = Field(..., min_length=1)
    sdma_channel: str = "Email"
    bdo_message: str = Field(..., min_length=1)
    bdo_channel: str = "SMS"

class SendCircle2Schema(BaseModel):
    ndrf_message: str = Field(..., min_length=1)
    ndrf_channel: str = "SMS"
    hospital_message: str = Field(..., min_length=1)
    hospital_channel: str = "Email"

class SendCircle3Schema(BaseModel):
    selected_ngos: List[str] = Field(..., min_items=1)
    ngo_message: str = Field(..., min_length=1)
    ngo_channel: str = "WhatsApp"
    panchayat_message: str = Field(..., min_length=1)
    panchayat_channel: str = "Email"

class LogMeetingSchema(BaseModel):
    meeting_date: date
    attendees: List[str]
    outcome: str

class RecordDecisionSchema(BaseModel):
    decision: str

class EscalateCaseSchema(BaseModel):
    next_authority: str
    message: str

class DismissEscalationSchema(BaseModel):
    reason: str = Field(..., min_length=1)

class RapidActivateSchema(BaseModel):
    incident_name: str
    incident_type: str
    district: str
    activated_reason: str = Field(..., min_length=30)
    estimated_affected_persons: int = Field(..., gt=0)
    incident_radius_km: float = Field(..., gt=0, lt=500)
    affected_village_ids: List[int] = []
    unregistered_villages: List[str] = []

class RapidActionSchema(BaseModel):
    id: int
    incident_id: int
    circle: str
    recipient: str
    channel: str
    message: str
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

class RapidIncidentSchema(BaseModel):
    id: int
    incident_name: str
    incident_type: str
    district: str
    activated_by: str
    activated_reason: str
    estimated_affected_persons: int
    incident_radius_km: float
    affected_village_ids: List[int]
    unregistered_villages: List[str]
    status: RapidIncidentStatus
    activated_at: datetime
    contained_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    actions: List[RapidActionSchema] = []

    class Config:
        from_attributes = True
