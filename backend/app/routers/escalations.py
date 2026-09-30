from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Village, User
from app.schemas import VillageSchema, EscalateCaseSchema, DismissEscalationSchema
from app.dependencies import get_current_user, require_revenue_officer
from app.services.escalation_engine import check_overdue_cases
from app.services.audit_service import log_audit
from app.utils.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/escalations", tags=["Escalations"])

@router.get("/check")
def get_escalation_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    overdue_cases = check_overdue_cases(db)
    return {"overdue_count": len(overdue_cases), "cases": overdue_cases}

@router.post("/villages/{village_id}/escalate", response_model=VillageSchema)
def escalate_case(village_id: int, payload: EscalateCaseSchema, current_user: User = Depends(require_revenue_officer), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)

    village.is_escalated = True

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=village.name,
        action=f"Sent Escalation Alert for {village.name} to {payload.next_authority}",
        performed_by=current_user.name,
        details=payload.message
    )

    db.commit()
    db.refresh(village)
    return village

@router.post("/villages/{village_id}/dismiss", response_model=VillageSchema)
def dismiss_escalation(village_id: int, payload: DismissEscalationSchema, current_user: User = Depends(require_revenue_officer), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)

    if not payload.reason or len(payload.reason.strip()) == 0:
        raise ValidationError(
            fields=[{"field": "reason", "message": "Dismissal reason is required"}],
            message="Missing reason for escalation dismissal"
        )

    village.escalation_reason = payload.reason

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=village.name,
        action=f"Dismissed Escalation Threshold for {village.name}",
        performed_by=current_user.name,
        details=f"Reason: {payload.reason}"
    )

    db.commit()
    db.refresh(village)
    return village
