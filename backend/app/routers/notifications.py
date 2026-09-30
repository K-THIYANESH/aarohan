from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Village, FieldReport, RelocationSite, AuditLog, User, VisitStatus
from app.schemas import VillageSchema, SendCircle1Schema, SendCircle2Schema, SendCircle3Schema, LogMeetingSchema, RecordDecisionSchema
from app.dependencies import get_current_user, require_revenue_officer
from app.services.audit_service import log_audit
from app.services.notification_dispatcher import dispatch_circle1_notifications, dispatch_circle2_notifications, dispatch_circle3_notifications
from app.services.pdf_service import generate_decision_brief
from app.utils.exceptions import NotFoundError, ValidationError

router = APIRouter(tags=["Notifications & Pipeline Actions"])

@router.post("/revenue/villages/{village_id}/send-circle1", response_model=VillageSchema)
def send_circle1_government(village_id: int, payload: SendCircle1Schema, background_tasks: BackgroundTasks, current_user: User = Depends(require_revenue_officer), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)

    # Circle 1 requires ground report to be submitted
    if village.visit_status != VisitStatus.REPORT_SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send Circle 1 alert until field officer ground verification report is submitted."
        )

    now = datetime.now(timezone.utc)
    village.circle1_sent_at = now
    if village.current_stage_index < 6:
        village.current_stage_index = 6
        village.stage_entered_at = now

    sent_list = village.notifications_sent or []
    time_str = now.strftime("%I:%M %p")
    sent_list.extend([
        {"time": time_str, "who": f"District Collector {village.district}", "role": "Government", "channel": payload.collector_channel, "status": "Delivered", "preview": payload.collector_message[:60]},
        {"time": time_str, "who": f"SDMA Official {village.state}", "role": "Government", "channel": payload.sdma_channel, "status": "Delivered", "preview": payload.sdma_message[:60]},
        {"time": time_str, "who": f"BDO {village.name} Block", "role": "Government", "channel": payload.bdo_channel, "status": "Delivered", "preview": payload.bdo_message[:60]}
    ])
    village.notifications_sent = sent_list

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=village.name,
        action=f"Sent Circle 1 (Government) Notifications for {village.name}",
        performed_by=current_user.name,
        details=f"Collector ({payload.collector_channel}), SDMA ({payload.sdma_channel}), BDO ({payload.bdo_channel})"
    )

    # Dispatch real email/SMS in background
    dispatch_circle1_notifications(
        background_tasks,
        village.name,
        village.ai_tier,
        village.families_affected,
        "Ground report confirmed high risk",
        "Evacuate immediate high risk zones"
    )

    db.commit()
    db.refresh(village)
    return village

@router.post("/revenue/villages/{village_id}/send-circle2", response_model=VillageSchema)
def send_circle2_responders(village_id: int, payload: SendCircle2Schema, background_tasks: BackgroundTasks, current_user: User = Depends(require_revenue_officer), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)

    now = datetime.now(timezone.utc)
    village.circle2_sent_at = now
    if village.current_stage_index < 7:
        village.current_stage_index = 7
        village.stage_entered_at = now

    sent_list = village.notifications_sent or []
    time_str = now.strftime("%I:%M %p")
    sent_list.extend([
        {"time": time_str, "who": f"NDRF {village.state} Battalion", "role": "Responders", "channel": payload.ndrf_channel, "status": "Delivered", "preview": payload.ndrf_message[:60]},
        {"time": time_str, "who": f"District Hospital {village.district}", "role": "Responders", "channel": payload.hospital_channel, "status": "Delivered", "preview": payload.hospital_message[:60]}
    ])
    village.notifications_sent = sent_list

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=village.name,
        action=f"Sent Circle 2 (Responders) Notifications for {village.name}",
        performed_by=current_user.name,
        details=f"NDRF ({payload.ndrf_channel}), Hospital ({payload.hospital_channel})"
    )

    field_report = db.query(FieldReport).filter(FieldReport.village_id == village_id).first()
    coords = field_report.gps_coordinates if field_report else "11.605, 76.083"

    dispatch_circle2_notifications(background_tasks, village.name, coords, village.families_affected * 4, "Accessible")

    db.commit()
    db.refresh(village)
    return village

@router.post("/revenue/villages/{village_id}/send-circle3", response_model=VillageSchema)
def send_circle3_civil(village_id: int, payload: SendCircle3Schema, background_tasks: BackgroundTasks, current_user: User = Depends(require_revenue_officer), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)

    now = datetime.now(timezone.utc)
    village.circle3_sent_at = now
    if village.current_stage_index < 8:
        village.current_stage_index = 8
        village.stage_entered_at = now

    sent_list = village.notifications_sent or []
    time_str = now.strftime("%I:%M %p")
    for ngo in payload.selected_ngos:
        sent_list.append({"time": time_str, "who": ngo, "role": "Civil Society", "channel": payload.ngo_channel, "status": "Delivered", "preview": payload.ngo_message[:60]})
    sent_list.append({"time": time_str, "who": f"Receiving Panchayat Secretary ({village.district})", "role": "Civil Society", "channel": payload.panchayat_channel, "status": "Delivered", "preview": payload.panchayat_message[:60]})

    village.notifications_sent = sent_list

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=village.name,
        action=f"Sent Circle 3 (Civil Society) Notifications for {village.name}",
        performed_by=current_user.name,
        details=f"Notified NGOs: {', '.join(payload.selected_ngos)}"
    )

    dispatch_circle3_notifications(background_tasks, village.name, payload.ngo_message)

    db.commit()
    db.refresh(village)
    return village

@router.post("/notifications/generate-pdf/{village_id}")
def generate_pdf_brief_endpoint(village_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)

    pdf_path = generate_decision_brief(village_id, db)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"Decision_Support_Brief_{village.name}.pdf"
    )

@router.post("/revenue/villages/{village_id}/log-meeting", response_model=VillageSchema)
def log_district_meeting(village_id: int, payload: LogMeetingSchema, current_user: User = Depends(require_revenue_officer), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)

    now = datetime.now(timezone.utc)
    village.district_meeting_logged_at = now
    village.meeting_details = {
        "date": str(payload.meeting_date),
        "attendees": payload.attendees,
        "outcome": payload.outcome,
        "logged_by": current_user.name
    }
    if village.current_stage_index < 9:
        village.current_stage_index = 9
        village.stage_entered_at = now

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=village.name,
        action=f"Logged District Emergency Meeting for {village.name}",
        performed_by=current_user.name,
        details=f"Outcome: {payload.outcome}"
    )

    db.commit()
    db.refresh(village)
    return village

@router.post("/revenue/villages/{village_id}/record-decision", response_model=VillageSchema)
def record_relocation_decision(village_id: int, payload: RecordDecisionSchema, current_user: User = Depends(require_revenue_officer), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)

    now = datetime.now(timezone.utc)
    village.decision_recorded_at = now
    village.decision_details = {
        "decision": payload.decision,
        "recorded_by": current_user.name,
        "timestamp": str(now)
    }
    if village.current_stage_index < 10:
        village.current_stage_index = 10
        village.stage_entered_at = now

    log_audit(
        db,
        role=current_user.role.value,
        village_or_site=village.name,
        action=f"Recorded Official Decision for {village.name}: {payload.decision}",
        performed_by=current_user.name,
        details=f"Decision: {payload.decision}"
    )

    db.commit()
    db.refresh(village)
    return village
