from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import FieldReport, Village, User, VisitStatus, UserRole
from app.schemas import FieldReportSchema, FieldReportCreateSchema
from app.dependencies import get_current_user, require_field_officer
from app.services.audit_service import log_audit
from app.utils.exceptions import NotFoundError, ValidationError
from app.utils.validators import validate_gps_coordinates

router = APIRouter(prefix="/field", tags=["Field Reports"])

@router.get("/villages")
def get_field_officer_villages(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    villages = db.query(Village).all()
    return villages

@router.get("/villages/{village_id}")
def get_village_evidence(village_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)
    return village

@router.post("/reports", response_model=FieldReportSchema)
def submit_field_report(payload: FieldReportCreateSchema, current_user: User = Depends(require_field_officer), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == payload.village_id).first()
    if not village:
        raise NotFoundError("Village", payload.village_id)

    # Check for duplicate report for same village
    existing = db.query(FieldReport).filter(FieldReport.village_id == payload.village_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Field report already submitted for village {village.name} by {existing.submitted_by}."
        )

    # GPS Validation
    if not validate_gps_coordinates(payload.gps_coordinates):
        raise ValidationError(
            fields=[{"field": "gps_coordinates", "message": "GPS coordinates must be within valid India boundary (Lat: 6.0-37.0 N, Long: 68.0-97.0 E)"}],
            message="Invalid GPS coordinates"
        )

    # Observations validation (>= 50 characters)
    if len(payload.observations.strip()) < 50:
        raise ValidationError(
            fields=[{"field": "observations", "message": "Observations must be at least 50 characters"}],
            message="Observation details too short"
        )

    now = datetime.now(timezone.utc)
    new_report = FieldReport(
        village_id=payload.village_id,
        submitted_by=current_user.name,
        submitted_at=now,
        visit_date=payload.visit_date,
        gps_coordinates=payload.gps_coordinates,
        actual_families_count=payload.actual_families_count,
        houses_in_risk_zone=payload.houses_in_risk_zone,
        landslide_signs_observed=payload.landslide_signs_observed,
        cracks_in_ground_observed=payload.cracks_in_ground_observed,
        water_logging_observed=payload.water_logging_observed,
        slope_erosion_visible=payload.slope_erosion_visible,
        road_condition=payload.road_condition,
        community_willing_to_relocate=payload.community_willing_to_relocate,
        nearest_safe_structure_distance_km=payload.nearest_safe_structure_distance_km,
        field_officer_recommendation=payload.field_officer_recommendation,
        observations=payload.observations,
        photo_count=payload.photo_count,
        is_offline_synced=payload.is_offline_synced if payload.is_offline_synced is not None else True
    )
    db.add(new_report)

    village.visit_status = VisitStatus.REPORT_SUBMITTED
    if village.current_stage_index < 3:
        village.current_stage_index = 3
        village.stage_entered_at = now

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=village.name,
        action=f"Submitted physical ground report for {village.name}. Counted {payload.actual_families_count} families.",
        performed_by=current_user.name,
        details=f"Recommendation: {payload.field_officer_recommendation}. GPS: {payload.gps_coordinates}"
    )

    db.commit()
    db.refresh(new_report)
    return new_report

@router.get("/reports", response_model=List[FieldReportSchema])
def get_submitted_field_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(FieldReport).order_by(desc(FieldReport.submitted_at)).all()
    return reports
