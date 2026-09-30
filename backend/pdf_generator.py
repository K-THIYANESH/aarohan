from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
from datetime import datetime

def generate_decision_support_brief_pdf(village, field_report, top_site, audit_logs):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        textColor=colors.HexColor('#000080'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#FF9933'),
        spaceAfter=12
    )
    heading_style = ParagraphStyle(
        'SecHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.HexColor('#000080'),
        spaceBefore=8,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#333333')
    )

    story = []

    # Title Banner
    story.append(Paragraph("AAROHAN DECISION SUPPORT BRIEF", title_style))
    story.append(Paragraph(f"Village: {village.name}, District: {village.district}, State: {village.state} | Generated: {datetime.now().strftime('%d %b %Y %H:%M')}", subtitle_style))
    story.append(Paragraph("CONFIDENTIAL — FOR OFFICIAL DISTRICT DISASTER MANAGEMENT USE ONLY", ParagraphStyle('Conf', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor('#B71C1C'))))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#000080'), spaceAfter=10))

    # Section 1: Overview
    story.append(Paragraph("1. VILLAGE HAZARD & TIER SUMMARY", heading_style))
    sec1_data = [
        ["Hazard Score", f"{village.hazard_score:.2f} / 1.00", "Severity Tier", village.tier.value if hasattr(village.tier, 'value') else str(village.tier)],
        ["AI Estimated Families", str(village.families_estimated_ai), "Field Verified Families", str(field_report.families_physically_counted) if field_report else "Pending Visit"],
        ["7-Day Rainfall", f"{village.rainfall_7day_mm} mm", "Slope Angle", f"{village.slope_degrees} deg"]
    ]
    t1 = Table(sec1_data, colWidths=[120, 150, 120, 150])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F4F4F4')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#333333')),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CCCCCC')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t1)
    story.append(Spacer(1, 10))

    # Section 2: Why Flagged (SHAP)
    story.append(Paragraph("2. SCIENTIFIC EVIDENCE & SHAP FEATURE WEIGHTS", heading_style))
    if village.shap_features:
        shap_rows = [["Feature Name", "Recorded Value", "Importance Weight", "Source Tag"]]
        for sf in village.shap_features[:4]:
            shap_rows.append([
                sf.get('feature', sf.get('name', 'N/A')),
                str(sf.get('value', 'N/A')),
                f"{sf.get('importance', sf.get('weight', 0)):.2f}",
                sf.get('source', 'System AI')
            ])
        t2 = Table(shap_rows, colWidths=[180, 110, 110, 140])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#000080')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CCCCCC')),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t2)
    story.append(Spacer(1, 10))

    # Section 3: Field Inspection
    story.append(Paragraph("3. ON-GROUND FIELD INSPECTION FINDINGS", heading_style))
    if field_report:
        obs_text = f"Officer: {field_report.submitted_by} | Date: {field_report.visit_date}<br/>Recommendation: {field_report.field_officer_recommendation.value if hasattr(field_report.field_officer_recommendation, 'value') else field_report.field_officer_recommendation}<br/>Observations: {field_report.observations}"
        story.append(Paragraph(obs_text, body_style))
    else:
        story.append(Paragraph("Field inspection report pending.", body_style))
    story.append(Spacer(1, 10))

    # Section 4: Intervention & Relocation Site
    story.append(Paragraph("4. INTERVENTION LADDER & TOP RELOCATION SITE", heading_style))
    interv_p = f"Primary Action: {village.intervention_ladder.get('primary', {}).get('action', 'Permanent Relocation')}<br/>Cost of Inaction (10-Yr): INR {village.cost_of_inaction_10yr:,}"
    story.append(Paragraph(interv_p, body_style))
    if top_site:
        site_p = f"Candidate Site: {top_site.name} | AHP Rank: {top_site.rank_label} | Capacity: {top_site.capacity_families} families"
        story.append(Paragraph(site_p, body_style))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#000080'), spaceAfter=6))
    story.append(Paragraph("Generated by AAROHAN Decision Support System | SIH26191 | Multi-Source Satellite & GIS Data", ParagraphStyle('Foot', parent=body_style, fontSize=7, textColor=colors.HexColor('#666666'), alignment=1)))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_rapid_incident_summary_pdf(incident, actions, reports):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        textColor=colors.HexColor('#B71C1C'),
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#333333')
    )

    story = []
    story.append(Paragraph("RAPID EMERGENCY INCIDENT SUMMARY REPORT", title_style))
    story.append(Paragraph(f"Incident: {incident.incident_name} ({incident.incident_type.value if hasattr(incident.incident_type, 'value') else incident.incident_type}) | Triggered: {incident.triggered_at.strftime('%d %b %Y %H:%M')}", body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph(f"Status: {incident.status.value if hasattr(incident.status, 'value') else incident.status} | Triggered By: {incident.triggered_by}", body_style))
    story.append(Paragraph(f"Estimated Affected Persons: {incident.estimated_affected_persons}", body_style))
    if incident.closure_reason:
        story.append(Paragraph(f"Closure Reason: {incident.closure_reason} (Closed By: {incident.closed_by})", body_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("FIELD REPORTS RECEIVED:", ParagraphStyle('Sub', parent=body_style, fontName='Helvetica-Bold')))
    for r in reports:
        story.append(Paragraph(f"• {r.submitted_by} ({r.submitted_at.strftime('%H:%M')}): {r.location_description} - Trapped: {r.estimated_trapped}, Casualties: {r.confirmed_casualties}", body_style))

    story.append(Spacer(1, 15))
    story.append(Paragraph("RAPID Emergency Response Audit | AAROHAN Digital System", ParagraphStyle('Foot', parent=body_style, fontSize=7, alignment=1)))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
