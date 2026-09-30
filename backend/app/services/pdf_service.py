import os
from io import BytesIO
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.models import Village, FieldReport, RelocationSite, AuditLog, RapidIncident

PDF_STORAGE_DIR = "/tmp/aarohan_pdfs"

def ensure_pdf_dir():
    if not os.path.exists(PDF_STORAGE_DIR):
        try:
            os.makedirs(PDF_STORAGE_DIR, exist_ok=True)
        except Exception:
            pass

def generate_decision_brief(village_id: int, db: Session) -> str:
    ensure_pdf_dir()
    village = db.query(Village).filter(Village.id == village_id).first()
    field_report = db.query(FieldReport).filter(FieldReport.village_id == village_id).first()
    top_site = db.query(RelocationSite).filter(RelocationSite.linked_village_name == village.name).first() if village else None
    audit_logs = db.query(AuditLog).filter(AuditLog.village_or_site == village.name).order_by(AuditLog.timestamp.desc()).limit(8).all() if village else []

    file_path = os.path.join(PDF_STORAGE_DIR, f"Decision_Support_Brief_Village_{village_id}.pdf")

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'GovTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        alignment=1,
        textColor=colors.HexColor('#000080')
    )
    subtitle_style = ParagraphStyle(
        'GovSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=12,
        alignment=1,
        textColor=colors.HexColor('#555555')
    )
    confidential_style = ParagraphStyle(
        'Confidential',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#CC0000')
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#000080'),
        spaceBefore=10,
        spaceAfter=5
    )
    body_style = ParagraphStyle(
        'GovBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.black
    )

    elements = []

    # Header
    elements.append(Paragraph("🏛 Government of India", title_style))
    elements.append(Paragraph("AAROHAN Decision Support System | Ministry of Home Affairs | Disaster Management Division", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#000080'), spaceAfter=8, spaceBefore=8))
    elements.append(Paragraph("CONFIDENTIAL — FOR OFFICIAL USE ONLY", confidential_style))
    elements.append(Spacer(1, 10))

    if not village:
        elements.append(Paragraph("Village Record Not Found", title_style))
        doc.build(elements)
        return file_path

    # Meta banner
    date_str = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
    ref_no = f"AAROHAN-{village.id}-{datetime.now(timezone.utc).strftime('%Y%m%d')}"
    elements.append(Paragraph(f"<b>Village:</b> {village.name} | <b>District:</b> {village.district} | <b>State:</b> {village.state}", styles['Heading3']))
    elements.append(Paragraph(f"<b>Case Ref:</b> {ref_no} | <b>Generated:</b> {date_str}", subtitle_style))
    elements.append(Spacer(1, 10))

    # Section 1: Risk Assessment
    elements.append(Paragraph("1. Risk Assessment & Hazard Classification", h2_style))
    risk_data = [
        ["AI Flagged Tier", "Hazard Score", "Flagged Families (AI)", "Field Counted Families"],
        [village.ai_tier, f"{village.hazard_score:.2f} ({village.risk_label})", str(village.families_affected), str(field_report.actual_families_count if field_report else "Pending")]
    ]
    t1 = Table(risk_data, colWidths=[1.3*inch, 2.0*inch, 1.8*inch, 1.8*inch])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F0F4F8')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#000080')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CCCCCC')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(t1)
    elements.append(Spacer(1, 10))

    # Section 2: Why Flagged
    elements.append(Paragraph("2. Primary Hazard Drivers & Evidence", h2_style))
    for item in village.evidence:
        elements.append(Paragraph(f"• {item} <i>[Source: GSI Bhukosh / Bhuvan DEM / IMD]</i>", body_style))
    elements.append(Spacer(1, 10))

    # Section 3: Field Assessment
    elements.append(Paragraph("3. Physical Field Assessment Summary", h2_style))
    if field_report:
        field_data = [
            ["Parameter", "Observation / Status"],
            ["Field Officer", field_report.submitted_by],
            ["Visit Date", str(field_report.visit_date)],
            ["GPS Coordinates", field_report.gps_coordinates],
            ["Signs of Landslide / Cracks", "Yes" if (field_report.landslide_signs_observed or field_report.cracks_in_ground_observed) else "No"],
            ["Road Access", str(field_report.road_condition)],
            ["Community Willingness", str(field_report.community_willing_to_relocate)],
            ["Officer Recommendation", str(field_report.field_officer_recommendation)]
        ]
        t2 = Table(field_data, colWidths=[2.5*inch, 4.4*inch])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F0F4F8')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CCCCCC')),
        ]))
        elements.append(t2)
        elements.append(Spacer(1, 5))
        elements.append(Paragraph(f"<b>Detailed Observations:</b> {field_report.observations}", body_style))
    else:
        elements.append(Paragraph("Ground assessment report pending field officer submission.", body_style))
    elements.append(Spacer(1, 10))

    # Section 4: Intervention Ladder
    elements.append(Paragraph("4. Intervention Ladder & Recommended Options", h2_style))
    ladder = village.intervention_ladder or {}
    primary = ladder.get("primary_recommendation", {})
    elements.append(Paragraph(f"<b>Primary Action:</b> {primary.get('action', 'Planned Relocation')} | <b>Cost:</b> {primary.get('estimated_cost', 'N/A')}", body_style))
    elements.append(Paragraph(f"<b>Cost of Inaction:</b> {ladder.get('cost_of_inaction', 'High risk of severe casualty and structural loss')}", body_style))
    elements.append(Spacer(1, 10))

    # Section 5: Relocation Sites
    elements.append(Paragraph("5. Candidate Relocation Sites", h2_style))
    if top_site:
        site_data = [
            ["Site Name", "Capacity", "Hazard Score", "Land Status"],
            [top_site.name, f"{top_site.capacity_families} families", f"{top_site.site_hazard_score:.2f}", str(top_site.verification_status)]
        ]
        t3 = Table(site_data, colWidths=[2.2*inch, 1.5*inch, 1.5*inch, 1.7*inch])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F0F4F8')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CCCCCC')),
        ]))
        elements.append(t3)
    else:
        elements.append(Paragraph("No designated site mapped yet.", body_style))
    elements.append(Spacer(1, 10))

    # Section 6 & 7: Audit history
    elements.append(Paragraph("6. Pipeline Audit Register", h2_style))
    audit_rows = [["Timestamp", "Role", "Action"]]
    for a in audit_logs:
        audit_rows.append([a.timestamp.strftime("%d-%b %H:%M"), a.role, a.action[:60]])
    if len(audit_rows) > 1:
        t4 = Table(audit_rows, colWidths=[1.5*inch, 1.5*inch, 3.9*inch])
        t4.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F0F4F8')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CCCCCC')),
        ]))
        elements.append(t4)

    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.gray))
    elements.append(Paragraph("Generated by AAROHAN | SIH26191 | Data sources: GSI Bhukosh, IMD, Bhuvan DEM, Census 2011, PMJAY, PDS", subtitle_style))

    doc.build(elements)
    return file_path

def generate_rapid_summary(incident_id: int, db: Session) -> str:
    ensure_pdf_dir()
    incident = db.query(RapidIncident).filter(RapidIncident.id == incident_id).first()
    file_path = os.path.join(PDF_STORAGE_DIR, f"RAPID_Summary_Incident_{incident_id}.pdf")

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'RapidTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        alignment=1,
        textColor=colors.HexColor('#CC0000')
    )
    body_style = ParagraphStyle('RapidBody', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=12)

    elements = []
    elements.append(Paragraph("🚨 RAPID EMERGENCY INCIDENT REPORT", title_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#CC0000'), spaceAfter=10))

    if incident:
        elements.append(Paragraph(f"<b>Incident:</b> {incident.incident_name} ({incident.incident_type})", styles['Heading3']))
        elements.append(Paragraph(f"<b>District:</b> {incident.district} | <b>Activated By:</b> {incident.activated_by}", body_style))
        elements.append(Paragraph(f"<b>Activated At:</b> {incident.activated_at.strftime('%Y-%m-%d %H:%M UTC')}", body_style))
        elements.append(Paragraph(f"<b>Status:</b> {incident.status} | <b>Estimated Affected:</b> {incident.estimated_affected_persons}", body_style))
        elements.append(Spacer(1, 10))

        elements.append(Paragraph("<b>Notification Actions Dispatched:</b>", styles['Heading4']))
        act_data = [["Circle", "Recipient", "Channel", "Status"]]
        for a in incident.actions:
            act_data.append([a.circle, a.recipient, a.channel, a.status])
        t = Table(act_data, colWidths=[1.5*inch, 2.5*inch, 1.5*inch, 1.4*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FFCCCC')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CCCCCC')),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph("Incident record not found.", body_style))

    doc.build(elements)
    return file_path
