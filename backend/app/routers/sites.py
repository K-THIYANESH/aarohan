from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RelocationSite, LandSurveyRecord, Village, LandVerificationStatus, OwnershipStatus, User
from app.schemas import RelocationSiteSchema, LandSurveyRecordSchema, UpdateSurveyRecordSchema
from app.dependencies import get_current_user, require_revenue_officer
from app.services.audit_service import log_audit
from app.utils.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/revenue", tags=["Revenue & Land Sites"])

@router.get("/sites", response_model=List[RelocationSiteSchema])
def get_revenue_sites(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sites = db.query(RelocationSite).all()
    return sites

@router.get("/sites/{site_id}", response_model=RelocationSiteSchema)
def get_site_land_records(site_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    site = db.query(RelocationSite).filter(RelocationSite.id == site_id).first()
    if not site:
        raise NotFoundError("Relocation Site", site_id)
    return site

@router.put("/survey-records/{record_id}", response_model=LandSurveyRecordSchema)
def update_survey_record(record_id: int, payload: UpdateSurveyRecordSchema, current_user: User = Depends(require_revenue_officer), db: Session = Depends(get_db)):
    record = db.query(LandSurveyRecord).filter(LandSurveyRecord.id == record_id).first()
    if not record:
        raise NotFoundError("Survey Record", record_id)

    # Validation: dispute_details required if DISPUTED
    if payload.ownership_status == OwnershipStatus.DISPUTED and not payload.dispute_details:
        raise ValidationError(
            fields=[{"field": "dispute_details", "message": "Dispute details are required when ownership status is set to DISPUTED"}],
            message="Missing dispute explanation"
        )

    now = datetime.now(timezone.utc)
    record.ownership_status = payload.ownership_status
    record.acquisition_status = payload.acquisition_status
    record.notes = f"{payload.notes or ''} {payload.dispute_details or ''}".strip()
    record.last_verified_by = current_user.name
    record.last_verified_at = now

    site = record.site
    records = site.survey_records
    has_disputes = any(r.ownership_status == OwnershipStatus.DISPUTED for r in records)
    has_unknown = any(r.ownership_status == OwnershipStatus.UNKNOWN for r in records)

    if has_disputes:
        site.verification_status = LandVerificationStatus.BLOCKED
    elif has_unknown:
        site.verification_status = LandVerificationStatus.IN_PROGRESS
    else:
        site.verification_status = LandVerificationStatus.COMPLETED

    village = db.query(Village).filter(Village.name == site.linked_village_name).first()
    if village and village.current_stage_index < 4:
        village.current_stage_index = 4
        village.stage_entered_at = now

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=f"{site.name} ({record.survey_number})",
        action=f"Updated survey record {record.survey_number}: Ownership -> {payload.ownership_status}, Acquisition -> {payload.acquisition_status}",
        performed_by=current_user.name,
        details=record.notes
    )

    db.commit()
    db.refresh(record)
    return record

@router.post("/sites/{site_id}/complete-verification", response_model=RelocationSiteSchema)
def complete_site_verification(site_id: int, current_user: User = Depends(require_revenue_officer), db: Session = Depends(get_db)):
    site = db.query(RelocationSite).filter(RelocationSite.id == site_id).first()
    if not site:
        raise NotFoundError("Relocation Site", site_id)

    now = datetime.now(timezone.utc)
    has_disputes = any(r.ownership_status == OwnershipStatus.DISPUTED for r in site.survey_records)

    if has_disputes:
        site.verification_status = LandVerificationStatus.BLOCKED
        action_text = f"Marked land verification COMPLETE WITH DISPUTES NOTED for site {site.name}"
    else:
        site.verification_status = LandVerificationStatus.COMPLETED
        action_text = f"Marked land verification COMPLETED for site {site.name}"

    village = db.query(Village).filter(Village.name == site.linked_village_name).first()
    if village and village.current_stage_index < 5:
        village.current_stage_index = 5
        village.stage_entered_at = now

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=site.name,
        action=action_text,
        performed_by=current_user.name,
        details="Official land record verification finalized for district meeting."
    )

    db.commit()
    db.refresh(site)
    return site
