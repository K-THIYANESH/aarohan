import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Date, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    FIELD_OFFICER = "FIELD_OFFICER"
    REVENUE_OFFICER = "REVENUE_OFFICER"

class DangerLevel(str, enum.Enum):
    EVACUATE_NOW = "EVACUATE_NOW"
    NEEDS_ATTENTION = "NEEDS_ATTENTION"
    KEEP_WATCHING = "KEEP_WATCHING"

class VisitStatus(str, enum.Enum):
    VISIT_PENDING = "VISIT_PENDING"
    VISIT_SCHEDULED = "VISIT_SCHEDULED"
    REPORT_SUBMITTED = "REPORT_SUBMITTED"

class RoadCondition(str, enum.Enum):
    ACCESSIBLE = "ACCESSIBLE"
    PARTIALLY_BLOCKED = "PARTIALLY_BLOCKED"
    FULLY_BLOCKED = "FULLY_BLOCKED"

class CommunityWillingness(str, enum.Enum):
    YES = "YES"
    PARTIAL = "PARTIAL"
    NO = "NO"
    NOT_ASKED = "NOT_ASKED"

class FieldRecommendation(str, enum.Enum):
    IMMEDIATE_EVACUATION = "IMMEDIATE_EVACUATION"
    PLANNED_RELOCATION = "PLANNED_RELOCATION"
    SEASONAL_EVACUATION = "SEASONAL_EVACUATION"
    KEEP_MONITORING = "KEEP_MONITORING"
    NO_ACTION = "NO_ACTION"

class LandVerificationStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"

class OwnershipStatus(str, enum.Enum):
    CLEAR = "CLEAR"
    DISPUTED = "DISPUTED"
    GOVERNMENT_LAND = "GOVERNMENT_LAND"
    FOREST_LAND = "FOREST_LAND"
    UNKNOWN = "UNKNOWN"

class AcquisitionStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    ACQUIRED = "ACQUIRED"
    BLOCKED = "BLOCKED"

class RapidIncidentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CONTAINED = "CONTAINED"
    CLOSED = "CLOSED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    blacklisted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    danger_level = Column(SQLEnum(DangerLevel), nullable=False)
    risk_label = Column(String, nullable=False)
    ai_tier = Column(String, nullable=False)
    families_affected = Column(Integer, nullable=False)
    hazard_score = Column(Float, default=0.88)
    evidence = Column(JSON, nullable=False)
    data_sources_table = Column(JSON, nullable=False)
    shap_features = Column(JSON, nullable=False)
    population_triangulation = Column(JSON, nullable=False)
    disaster_history = Column(JSON, nullable=False)
    intervention_ladder = Column(JSON, nullable=False)
    notifications_sent = Column(JSON, nullable=False)
    assigned_officer = Column(String, default="Field Officer Anoop Kumar")
    visit_status = Column(SQLEnum(VisitStatus), default=VisitStatus.VISIT_PENDING)
    assigned_visit_date = Column(Date, nullable=True)
    flagged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    current_stage_index = Column(Integer, default=3)
    circle1_sent_at = Column(DateTime, nullable=True)
    circle2_sent_at = Column(DateTime, nullable=True)
    circle3_sent_at = Column(DateTime, nullable=True)
    district_meeting_logged_at = Column(DateTime, nullable=True)
    meeting_details = Column(JSON, nullable=True)
    decision_recorded_at = Column(DateTime, nullable=True)
    decision_details = Column(JSON, nullable=True)
    stage_entered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_escalated = Column(Boolean, default=False)
    escalation_reason = Column(Text, nullable=True)

    field_reports = relationship("FieldReport", back_populates="village")

class RelocationSite(Base):
    __tablename__ = "relocation_sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    linked_village_name = Column(String, nullable=False)
    capacity_families = Column(Integer, nullable=False)
    rank_label = Column(String, nullable=False)
    ahp_score_summary = Column(String, nullable=False)
    ahp_breakdown = Column(JSON, nullable=False)
    site_hazard_score = Column(Float, nullable=False)
    verification_status = Column(SQLEnum(LandVerificationStatus), default=LandVerificationStatus.NOT_STARTED)
    pending_days = Column(Integer, default=0)

    survey_records = relationship("LandSurveyRecord", back_populates="site")

class LandSurveyRecord(Base):
    __tablename__ = "land_survey_records"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("relocation_sites.id"), nullable=False)
    survey_number = Column(String, nullable=False)
    recorded_owner = Column(String, nullable=False)
    ownership_status = Column(SQLEnum(OwnershipStatus), default=OwnershipStatus.UNKNOWN)
    acquisition_status = Column(SQLEnum(AcquisitionStatus), default=AcquisitionStatus.NOT_STARTED)
    notes = Column(Text, nullable=True)
    last_verified_by = Column(String, nullable=True)
    last_verified_at = Column(DateTime, nullable=True)

    site = relationship("RelocationSite", back_populates="survey_records")

class FieldReport(Base):
    __tablename__ = "field_reports"

    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    submitted_by = Column(String, nullable=False)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    visit_date = Column(Date, nullable=False)
    gps_coordinates = Column(String, nullable=False)
    actual_families_count = Column(Integer, nullable=False)
    houses_in_risk_zone = Column(Integer, nullable=False)
    landslide_signs_observed = Column(Boolean, default=False)
    cracks_in_ground_observed = Column(Boolean, default=False)
    water_logging_observed = Column(Boolean, default=False)
    slope_erosion_visible = Column(Boolean, default=False)
    road_condition = Column(SQLEnum(RoadCondition), nullable=False)
    community_willing_to_relocate = Column(SQLEnum(CommunityWillingness), nullable=False)
    nearest_safe_structure_distance_km = Column(Float, nullable=False)
    field_officer_recommendation = Column(SQLEnum(FieldRecommendation), nullable=False)
    observations = Column(Text, nullable=False)
    photo_count = Column(Integer, default=0)
    is_offline_synced = Column(Boolean, default=True)

    village = relationship("Village", back_populates="field_reports")

class EscalationThreshold(Base):
    __tablename__ = "escalation_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    stage_number = Column(Integer, nullable=False)
    stage_name = Column(String, nullable=False)
    immediate_days = Column(Integer, nullable=False)
    short_term_days = Column(Integer, nullable=False)
    medium_term_days = Column(Integer, nullable=False)
    monitor_days = Column(Integer, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)
    village_or_site = Column(String, nullable=False)
    action = Column(String, nullable=False)
    performed_by = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class RapidIncident(Base):
    __tablename__ = "rapid_incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_name = Column(String, nullable=False)
    incident_type = Column(String, nullable=False)
    district = Column(String, nullable=False)
    activated_by = Column(String, nullable=False)
    activated_reason = Column(Text, nullable=False)
    estimated_affected_persons = Column(Integer, nullable=False)
    incident_radius_km = Column(Float, nullable=False)
    affected_village_ids = Column(JSON, nullable=False) # List[int]
    unregistered_villages = Column(JSON, nullable=False, default=list) # List[str]
    status = Column(SQLEnum(RapidIncidentStatus), default=RapidIncidentStatus.ACTIVE)
    activated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    contained_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    actions = relationship("RapidAction", back_populates="incident")

class RapidAction(Base):
    __tablename__ = "rapid_actions"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("rapid_incidents.id"), nullable=False)
    circle = Column(String, nullable=False) # "Circle 1", "Circle 2", "Circle 3", "System"
    recipient = Column(String, nullable=False)
    channel = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="SENT")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    incident = relationship("RapidIncident", back_populates="actions")

class NotificationLog(Base):
    __tablename__ = "notifications_log"

    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String, nullable=False) # EMAIL, SMS, WHATSAPP
    recipient = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    body = Column(Text, nullable=False)
    delivery_status = Column(String, nullable=False) # DELIVERED, FAILED
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

from app.models.bay_cyclone_models import BayCycloneSimulationModel
