from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import engine, Base, get_db
import models
import schemas
from seed import seed_database

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AAROHAN Revenue & Field Officer API", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    if db.query(models.Village).count() == 0:
        seed_database()

# ----------------- FIELD OFFICER ENDPOINTS -----------------

@app.get("/field/villages", response_model=List[schemas.VillageSchema])
def get_field_officer_villages(officer_name: Optional[str] = "Field Officer Anoop Kumar", db: Session = Depends(get_db)):
    villages = db.query(models.Village).all()
    return villages

@app.get("/field/villages/{village_id}", response_model=schemas.VillageSchema)
def get_village_evidence(village_id: int, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    return village

@app.post("/field/reports", response_model=schemas.FieldReportSchema)
def submit_field_report(payload: schemas.FieldReportCreateSchema, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == payload.village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    now = datetime.now(timezone.utc)
    new_report = models.FieldReport(
        village_id=payload.village_id,
        submitted_by=payload.submitted_by,
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

    # Move village stage index from 2 (Field Visit Assigned) to 3 (Field Report Submitted)
    village.visit_status = models.VisitStatus.REPORT_SUBMITTED
    if village.current_stage_index < 3:
        village.current_stage_index = 3
        village.stage_entered_at = now

    audit = models.AuditLog(
        role="Field Officer",
        village_or_site=village.name,
        action=f"Submitted physical ground report for {village.name}. Counted {payload.actual_families_count} families.",
        performed_by=payload.submitted_by,
        details=f"Recommendation: {payload.field_officer_recommendation}. GPS: {payload.gps_coordinates}",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(new_report)

    return new_report

@app.get("/field/reports", response_model=List[schemas.FieldReportSchema])
def get_submitted_field_reports(officer_name: Optional[str] = "Field Officer Anoop Kumar", db: Session = Depends(get_db)):
    reports = db.query(models.FieldReport).order_by(desc(models.FieldReport.submitted_at)).all()
    return reports

# ----------------- REVENUE OFFICER ENDPOINTS -----------------

@app.get("/revenue/sites", response_model=List[schemas.RelocationSiteSchema])
def get_revenue_sites(db: Session = Depends(get_db)):
    sites = db.query(models.RelocationSite).all()
    return sites

@app.get("/revenue/sites/{site_id}", response_model=schemas.RelocationSiteSchema)
def get_site_land_records(site_id: int, db: Session = Depends(get_db)):
    site = db.query(models.RelocationSite).filter(models.RelocationSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Relocation Site not found")
    return site

@app.put("/revenue/survey-records/{record_id}", response_model=schemas.LandSurveyRecordSchema)
def update_survey_record(record_id: int, payload: schemas.UpdateSurveyRecordSchema, db: Session = Depends(get_db)):
    record = db.query(models.LandSurveyRecord).filter(models.LandSurveyRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Survey Record not found")

    now = datetime.now(timezone.utc)
    record.ownership_status = payload.ownership_status
    record.acquisition_status = payload.acquisition_status
    record.notes = payload.notes
    record.last_verified_by = payload.verified_by
    record.last_verified_at = now

    site = record.site
    # Check overall verification status of site
    records = site.survey_records
    has_disputes = any(r.ownership_status == models.OwnershipStatus.DISPUTED for r in records)
    has_unknown = any(r.ownership_status == models.OwnershipStatus.UNKNOWN for r in records)

    if has_disputes:
        site.verification_status = models.LandVerificationStatus.BLOCKED
    elif has_unknown:
        site.verification_status = models.LandVerificationStatus.IN_PROGRESS
    else:
        site.verification_status = models.LandVerificationStatus.COMPLETED

    # Also update linked village stage to 4 (Land Verification Started) if currently < 4
    village = db.query(models.Village).filter(models.Village.name == site.linked_village_name).first()
    if village and village.current_stage_index < 4:
        village.current_stage_index = 4
        village.stage_entered_at = now

    audit = models.AuditLog(
        role="Revenue Officer",
        village_or_site=f"{site.name} ({record.survey_number})",
        action=f"Updated survey record {record.survey_number}: Ownership -> {payload.ownership_status}, Acquisition -> {payload.acquisition_status}",
        performed_by=payload.verified_by,
        details=payload.notes,
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(record)

    return record

@app.post("/revenue/sites/{site_id}/complete-verification", response_model=schemas.RelocationSiteSchema)
def complete_site_verification(site_id: int, officer_name: str = "Revenue Officer M. K. Pillai", db: Session = Depends(get_db)):
    site = db.query(models.RelocationSite).filter(models.RelocationSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    now = datetime.now(timezone.utc)
    has_disputes = any(r.ownership_status == models.OwnershipStatus.DISPUTED for r in site.survey_records)

    if has_disputes:
        site.verification_status = models.LandVerificationStatus.BLOCKED
        action_text = f"Marked land verification COMPLETE WITH DISPUTES NOTED for site {site.name}"
    else:
        site.verification_status = models.LandVerificationStatus.COMPLETED
        action_text = f"Marked land verification COMPLETED for site {site.name}"

    village = db.query(models.Village).filter(models.Village.name == site.linked_village_name).first()
    if village and village.current_stage_index < 5:
        village.current_stage_index = 5
        village.stage_entered_at = now

    audit = models.AuditLog(
        role="Revenue Officer",
        village_or_site=site.name,
        action=action_text,
        performed_by=officer_name,
        details="Official land record verification finalized for district meeting.",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(site)

    return site

# ----------------- ADDITION 1: MANUAL NOTIFICATION CIRCLE ENDPOINTS -----------------

@app.post("/revenue/villages/{village_id}/send-circle1", response_model=schemas.VillageSchema)
def send_circle1_government(village_id: int, payload: schemas.SendCircle1Schema, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    now = datetime.now(timezone.utc)
    village.circle1_sent_at = now
    if village.current_stage_index < 6:
        village.current_stage_index = 6
        village.stage_entered_at = now

    # Update notifications_sent array
    sent_list = village.notifications_sent or []
    time_str = now.strftime("%I:%M %p")
    sent_list.extend([
        {"time": time_str, "who": f"District Collector {village.district}", "role": "Government", "channel": payload.collector_channel, "status": "Delivered", "preview": payload.collector_message[:60]},
        {"time": time_str, "who": f"SDMA Official {village.state}", "role": "Government", "channel": payload.sdma_channel, "status": "Delivered", "preview": payload.sdma_message[:60]},
        {"time": time_str, "who": f"BDO {village.name} Block", "role": "Government", "channel": payload.bdo_channel, "status": "Delivered", "preview": payload.bdo_message[:60]}
    ])
    village.notifications_sent = sent_list

    audit = models.AuditLog(
        role="Revenue Officer",
        village_or_site=village.name,
        action=f"Sent Circle 1 (Government) Notifications for {village.name}",
        performed_by=payload.officer_name,
        details=f"Collector ({payload.collector_channel}), SDMA ({payload.sdma_channel}), BDO ({payload.bdo_channel}). Message: {payload.collector_message[:100]}...",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(village)
    return village

@app.post("/revenue/villages/{village_id}/send-circle2", response_model=schemas.VillageSchema)
def send_circle2_responders(village_id: int, payload: schemas.SendCircle2Schema, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

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

    audit = models.AuditLog(
        role="Revenue Officer",
        village_or_site=village.name,
        action=f"Sent Circle 2 (Responders) Notifications for {village.name}",
        performed_by=payload.officer_name,
        details=f"NDRF ({payload.ndrf_channel}), District Hospital ({payload.hospital_channel}).",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(village)
    return village

@app.post("/revenue/villages/{village_id}/send-circle3", response_model=schemas.VillageSchema)
def send_circle3_civil(village_id: int, payload: schemas.SendCircle3Schema, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

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

    audit = models.AuditLog(
        role="Revenue Officer",
        village_or_site=village.name,
        action=f"Sent Circle 3 (Civil Society) Notifications for {village.name}",
        performed_by=payload.officer_name,
        details=f"Notified NGOs: {', '.join(payload.selected_ngos)}. Panchayat notified via {payload.panchayat_channel}.",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(village)
    return village

from fastapi.responses import Response
from pdf_generator import generate_decision_support_brief_pdf, generate_rapid_incident_summary_pdf

@app.post("/notifications/generate-pdf/{village_id}")
def generate_pdf_brief(village_id: int, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    field_report = db.query(models.FieldReport).filter(models.FieldReport.village_id == village_id).first()
    top_site = db.query(models.RelocationSite).filter(models.RelocationSite.linked_village_name == village.name).first()
    audit_logs = db.query(models.AuditLog).filter(models.AuditLog.village_or_site == village.name).all()

    pdf_bytes = generate_decision_support_brief_pdf(village, field_report, top_site, audit_logs)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Decision_Support_Brief_{village.name}.pdf"}
    )


@app.post("/revenue/villages/{village_id}/log-meeting", response_model=schemas.VillageSchema)
def log_district_meeting(village_id: int, payload: schemas.LogMeetingSchema, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    now = datetime.now(timezone.utc)
    village.district_meeting_logged_at = now
    village.meeting_details = {
        "date": str(payload.meeting_date),
        "attendees": payload.attendees,
        "outcome": payload.outcome,
        "logged_by": payload.officer_name
    }
    if village.current_stage_index < 9:
        village.current_stage_index = 9
        village.stage_entered_at = now

    audit = models.AuditLog(
        role="Revenue Officer",
        village_or_site=village.name,
        action=f"Logged District Emergency Meeting for {village.name}",
        performed_by=payload.officer_name,
        details=f"Meeting Date: {payload.meeting_date}. Attendees: {', '.join(payload.attendees)}. Outcome: {payload.outcome}",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(village)
    return village

@app.post("/revenue/villages/{village_id}/record-decision", response_model=schemas.VillageSchema)
def record_relocation_decision(village_id: int, payload: schemas.RecordDecisionSchema, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    now = datetime.now(timezone.utc)
    village.decision_recorded_at = now
    village.decision_details = {
        "decision": payload.decision,
        "recorded_by": payload.officer_name,
        "timestamp": str(now)
    }
    if village.current_stage_index < 10:
        village.current_stage_index = 10
        village.stage_entered_at = now

    audit = models.AuditLog(
        role="Revenue Officer",
        village_or_site=village.name,
        action=f"Recorded Official Decision for {village.name}: {payload.decision}",
        performed_by=payload.officer_name,
        details=f"Official decision '{payload.decision}' recorded into government audit register.",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(village)
    return village

# ----------------- ADDITION 3: ESCALATION ENDPOINTS -----------------

@app.post("/revenue/villages/{village_id}/escalate", response_model=schemas.VillageSchema)
def escalate_case(village_id: int, payload: schemas.EscalateCaseSchema, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    now = datetime.now(timezone.utc)
    village.is_escalated = True

    audit = models.AuditLog(
        role="Revenue Officer",
        village_or_site=village.name,
        action=f"Sent Escalation Alert for {village.name} to {payload.next_authority}",
        performed_by=payload.officer_name,
        details=f"Escalation Message: {payload.message[:150]}...",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(village)
    return village

@app.post("/revenue/villages/{village_id}/dismiss-escalation", response_model=schemas.VillageSchema)
def dismiss_escalation(village_id: int, payload: schemas.DismissEscalationSchema, db: Session = Depends(get_db)):
    village = db.query(models.Village).filter(models.Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    now = datetime.now(timezone.utc)
    village.escalation_reason = payload.reason

    audit = models.AuditLog(
        role="Revenue Officer",
        village_or_site=village.name,
        action=f"Dismissed Escalation Threshold for {village.name}",
        performed_by=payload.officer_name,
        details=f"Acceptable Delay Reason: {payload.reason}",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(village)
    return village

# ----------------- AUDIT LOG ENDPOINT -----------------

@app.get("/audit", response_model=List[schemas.AuditLogSchema])
def get_audit_log(role: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.AuditLog)
    if role:
        query = query.filter(models.AuditLog.role == role)
    logs = query.order_by(desc(models.AuditLog.timestamp)).all()
    return logs
