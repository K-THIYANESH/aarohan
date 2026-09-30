import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Date, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from database import Base

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

class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    danger_level = Column(SQLEnum(DangerLevel), nullable=False)
    risk_label = Column(String, nullable=False) # e.g. "Very High Risk"
    ai_tier = Column(String, nullable=False) # e.g. "Immediate", "Short-term", "Medium-term", "Monitor"
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

    # Pipeline & Notification Tracking Flags
    current_stage_index = Column(Integer, default=3) # 1 to 12
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
    role = Column(String, nullable=False) # "Field Officer" or "Revenue Officer"
    village_or_site = Column(String, nullable=False)
    action = Column(String, nullable=False)
    performed_by = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
