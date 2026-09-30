from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RapidIncident, RapidAction, RapidIncidentStatus, Village, User, DangerLevel, VisitStatus
from app.schemas import RapidIncidentSchema, RapidActivateSchema
from app.dependencies import get_current_user
from app.services.audit_service import log_audit
from app.services.notification_dispatcher import dispatch_rapid_activation_notifications
from app.services.pdf_service import generate_rapid_summary
from app.utils.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/rapid", tags=["RAPID Emergency Ecosystem"])

@router.get("/active", response_model=Optional[RapidIncidentSchema])
def get_active_rapid_incident(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active = db.query(RapidIncident).filter(RapidIncident.status == RapidIncidentStatus.ACTIVE).order_by(RapidIncident.activated_at.desc()).first()
    return active

@router.post("/activate", response_model=RapidIncidentSchema)
def activate_rapid(payload: RapidActivateSchema, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Either affected_village_ids or unregistered_villages must be non-empty
    if not payload.affected_village_ids and not payload.unregistered_villages:
        raise ValidationError(
            fields=[{"field": "affected_village_ids", "message": "At least one affected village or unregistered village required"}],
            message="No villages specified for RAPID activation"
        )

    # Check for existing active incident
    existing = db.query(RapidIncident).filter(RapidIncident.status == RapidIncidentStatus.ACTIVE).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An active RAPID incident '{existing.incident_name}' is already in progress."
        )

    now = datetime.now(timezone.utc)
    incident = RapidIncident(
        incident_name=payload.incident_name,
        incident_type=payload.incident_type,
        district=payload.district,
        activated_by=current_user.name,
        activated_reason=payload.activated_reason,
        estimated_affected_persons=payload.estimated_affected_persons,
        incident_radius_km=payload.incident_radius_km,
        affected_village_ids=payload.affected_village_ids,
        unregistered_villages=payload.unregistered_villages,
        status=RapidIncidentStatus.ACTIVE,
        activated_at=now
    )
    db.add(incident)
    db.flush()

    # Create simultaneous actions for Circle 1, 2, 3
    actions = [
        RapidAction(incident_id=incident.id, circle="Circle 1", recipient=f"District Collector {payload.district}", channel="WhatsApp & Email", message=f"🚨 RAPID ACTIVATION: {payload.incident_name}", timestamp=now),
        RapidAction(incident_id=incident.id, circle="Circle 2", recipient="NDRF & District Emergency Responders", channel="SMS & Email", message=f"🚨 RAPID ACTIVATION: Standby immediate deployment for {payload.incident_name}", timestamp=now),
        RapidAction(incident_id=incident.id, circle="Circle 3", recipient="Civil Society & Shelter Relief Networks", channel="WhatsApp", message=f"🚨 RAPID ACTIVATION: Prepare emergency shelter capacity for {payload.incident_name}", timestamp=now)
    ]
    db.add_all(actions)

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=f"RAPID: {payload.incident_name}",
        action=f"ACTIVATED RAPID EMERGENCY RESPONSE for {payload.incident_name}",
        performed_by=current_user.name,
        details=f"Reason: {payload.activated_reason}. Estimated Affected: {payload.estimated_affected_persons}"
    )

    dispatch_rapid_activation_notifications(background_tasks, payload.incident_name, payload.district, payload.activated_reason)

    db.commit()
    db.refresh(incident)
    return incident

@router.patch("/{incident_id}/contain", response_model=RapidIncidentSchema)
def contain_rapid(incident_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    incident = db.query(RapidIncident).filter(RapidIncident.id == incident_id).first()
    if not incident:
        raise NotFoundError("Rapid Incident", incident_id)

    # Require at least one field report in the system
    report_count = db.query(Village).join(Village.field_reports).count()
    if report_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot mark RAPID contained without at least one field ground assessment report submitted."
        )

    now = datetime.now(timezone.utc)
    incident.status = RapidIncidentStatus.CONTAINED
    incident.contained_at = now

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=f"RAPID: {incident.incident_name}",
        action=f"Marked RAPID Incident CONTAINED",
        performed_by=current_user.name
    )

    db.commit()
    db.refresh(incident)
    return incident

@router.post("/{incident_id}/close", response_model=RapidIncidentSchema)
def close_rapid(incident_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    incident = db.query(RapidIncident).filter(RapidIncident.id == incident_id).first()
    if not incident:
        raise NotFoundError("Rapid Incident", incident_id)

    now = datetime.now(timezone.utc)
    incident.status = RapidIncidentStatus.CLOSED
    incident.closed_at = now

    # Create new village records for unregistered villages flagged during incident
    if incident.unregistered_villages:
        for name in incident.unregistered_villages:
            v = Village(
                name=name,
                district=incident.district,
                state="Kerala",
                danger_level=DangerLevel.EVACUATE_NOW,
                risk_label="Very High Risk",
                ai_tier="Immediate",
                families_affected=50,
                hazard_score=0.92,
                evidence=["RAPID Emergency Incident Ground Flag", "Severe Slope Vulnerability"],
                data_sources_table=[{"source": "RAPID Ground Dispatch", "resolution": "Point Observation", "status": "Active"}],
                shap_features=[{"feature": "RAPID Emergency Trigger", "value": 0.95}],
                population_triangulation={"census_2011": 200, "pmjay": 180, "pds": 190, "estimated_families": 50},
                disaster_history=[{"year": 2026, "event": incident.incident_name}],
                intervention_ladder={"primary_recommendation": {"action": "Immediate Emergency Relocation", "estimated_cost": "₹45.0L"}},
                notifications_sent=[],
                assigned_officer=current_user.name,
                visit_status=VisitStatus.VISIT_PENDING
            )
            db.add(v)

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=f"RAPID: {incident.incident_name}",
        action=f"Closed RAPID Emergency Incident and updated permanent records",
        performed_by=current_user.name
    )

    db.commit()
    db.refresh(incident)
    return incident

@router.get("/{incident_id}/pdf")
def get_rapid_pdf(incident_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    incident = db.query(RapidIncident).filter(RapidIncident.id == incident_id).first()
    if not incident:
        raise NotFoundError("Rapid Incident", incident_id)

    pdf_path = generate_rapid_summary(incident_id, db)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"RAPID_Incident_Summary_{incident_id}.pdf"
    )
