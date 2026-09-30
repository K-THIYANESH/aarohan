from datetime import datetime, timedelta, date, timezone
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import (
    User, UserRole, Village, RelocationSite, LandSurveyRecord, FieldReport, AuditLog, EscalationThreshold,
    DangerLevel, VisitStatus, RoadCondition, CommunityWillingness,
    FieldRecommendation, LandVerificationStatus, OwnershipStatus, AcquisitionStatus
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_database(db: Session = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    # Drop and recreate for fresh clean seed
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    now = datetime.now(timezone.utc)
    today = date.today()

    # 1. Seed Users
    u1 = User(
        name="Anoop Kumar",
        email="anoop.kumar@aarohan.gov.in",
        hashed_password=pwd_context.hash("FieldOfficer@123"),
        role=UserRole.FIELD_OFFICER,
        district="Wayanad",
        state="Kerala",
        is_active=True,
        created_at=now
    )
    u2 = User(
        name="Priya Nair",
        email="priya.nair@aarohan.gov.in",
        hashed_password=pwd_context.hash("FieldOfficer@123"),
        role=UserRole.FIELD_OFFICER,
        district="Wayanad",
        state="Kerala",
        is_active=True,
        created_at=now
    )
    u3 = User(
        name="R. Sharma",
        email="revenue.wayanad@aarohan.gov.in",
        hashed_password=pwd_context.hash("RevenueOfficer@123"),
        role=UserRole.REVENUE_OFFICER,
        district="Wayanad",
        state="Kerala",
        is_active=True,
        created_at=now
    )
    u4 = User(
        name="Disaster Management Control Officer",
        email="disaster.control@aarohan.gov.in",
        hashed_password=pwd_context.hash("DisasterOfficer@123"),
        role=UserRole.REVENUE_OFFICER,
        district="Bay of Bengal & Coastal APAC Cell",
        state="National Disaster Authority",
        is_active=True,
        created_at=now
    )
    db.add_all([u1, u2, u3, u4])
    db.commit()

    # 2. Seed Escalation Thresholds
    thresholds = [
        EscalationThreshold(id=1, stage_number=1, stage_name="AI Flagged", immediate_days=2, short_term_days=7, medium_term_days=14, monitor_days=30),
        EscalationThreshold(id=2, stage_number=2, stage_name="Field Visit Assigned", immediate_days=2, short_term_days=7, medium_term_days=14, monitor_days=30),
        EscalationThreshold(id=3, stage_number=3, stage_name="Field Report Submitted", immediate_days=1, short_term_days=3, medium_term_days=7, monitor_days=14),
        EscalationThreshold(id=4, stage_number=4, stage_name="Land Verification Started", immediate_days=1, short_term_days=3, medium_term_days=7, monitor_days=14),
        EscalationThreshold(id=5, stage_number=5, stage_name="Land Verification Complete", immediate_days=1, short_term_days=3, medium_term_days=7, monitor_days=14),
        EscalationThreshold(id=6, stage_number=6, stage_name="Notifications Sent — Circle 1 (Government)", immediate_days=3, short_term_days=14, medium_term_days=30, monitor_days=60),
        EscalationThreshold(id=7, stage_number=7, stage_name="Notifications Sent — Circle 2 (Responders)", immediate_days=3, short_term_days=14, medium_term_days=30, monitor_days=60),
        EscalationThreshold(id=8, stage_number=8, stage_name="Notifications Sent — Circle 3 (Civil Society)", immediate_days=3, short_term_days=14, medium_term_days=30, monitor_days=60),
        EscalationThreshold(id=9, stage_number=9, stage_name="District Meeting Convened", immediate_days=1, short_term_days=7, medium_term_days=14, monitor_days=30),
        EscalationThreshold(id=10, stage_number=10, stage_name="Decision Recorded", immediate_days=7, short_term_days=30, medium_term_days=60, monitor_days=90),
        EscalationThreshold(id=11, stage_number=11, stage_name="Relocation In Progress", immediate_days=90, short_term_days=180, medium_term_days=365, monitor_days=999),
        EscalationThreshold(id=12, stage_number=12, stage_name="Relocation Physically Verified", immediate_days=999, short_term_days=999, medium_term_days=999, monitor_days=999),
    ]
    db.add_all(thresholds)
    db.commit()

    # 3. Seed Villages
    v1 = Village(
        id=1,
        name="Mundakkai",
        district="Wayanad",
        state="Kerala",
        danger_level=DangerLevel.EVACUATE_NOW,
        risk_label="Very High Risk",
        ai_tier="Immediate",
        families_affected=312,
        hazard_score=0.91,
        evidence=[
            "7-day rainfall: 340mm (Source: IMD)",
            "Slope angle: 38.4 degrees (Source: Bhuvan DEM satellite)",
            "Landslide history: 3 recorded landslides in last 10 years (Source: GSI Bhukosh)",
            "Hospital distance: 67km away with narrow evacuation window (Source: PMJAY & Health GIS)",
            "Vulnerable population: 312 families including 89 elderly/disabled members (Source: Census 2011 + PMJAY)"
        ],
        data_sources_table=[
            {"feature": "7-day Cumulative Rainfall", "value": "340mm", "source": "IMD Automatic Weather Station", "to_verify": "Are drainage channels overflowing or washed out near habitation?"},
            {"feature": "Slope Angle & Instability", "value": "38.4 degrees", "source": "Bhuvan DEM Satellite Cartosat-3", "to_verify": "Are there visible signs of slope instability, mud slip, or fresh ground cracks?"},
            {"feature": "Landslide Frequency Index", "value": "3 events / 10 yrs", "source": "GSI Bhukosh National Portal", "to_verify": "Check condition of previous landslide scarps and debris flow paths."},
            {"feature": "Distance to Nearest Civil Hospital", "value": "67 km", "source": "PMJAY Infrastructure GIS", "to_verify": "Inspect primary access road for boulder falls or bridge damage."}
        ],
        shap_features=[
            {"name": "7-Day Cumulative Rainfall (mm)", "weight": 42},
            {"name": "Slope Angle (>35 deg)", "weight": 28},
            {"name": "Soil Saturation Index", "weight": 18},
            {"name": "Historical Landslide Proximity", "weight": 12}
        ],
        population_triangulation={"pmjay": 298, "pds": 310, "discom": 304, "ai_used": 312},
        disaster_history=[
            {"year": "2019", "event": "Flash Flood & Debris Flow", "damage": "14 houses destroyed, 2 casualties"},
            {"year": "2020", "event": "Slope Slip East Sector", "damage": "Road access cut for 6 days"},
            {"year": "2024", "event": "Severe Slope Cracks", "damage": "Preventive temporary relief camp organized"}
        ],
        intervention_ladder={
            "primary": "Full Permanent Relocation — This is non-negotiable at this hazard level",
            "interim_options": [
                {"name": "Interim Catchment Drainage Clearing & Slope Retaining Walls", "risk_reduction": "Reduces risk score from 0.91 to 0.74", "cost": "₹14 Lakhs", "description": "Construct temporary wire-crate gabions along major gullies to slow run-off."},
                {"name": "Pre-Monsoon Seasonal Evacuation Camp Setup", "risk_reduction": "Reduces immediate casualty risk during peak rainfall days", "cost": "₹8 Lakhs", "description": "Shift high-risk families to Meppadi School camp during red alerts."}
            ],
            "cost_of_inaction": "Estimated cost of doing nothing over 10 years: ₹4.2 Crore. Cost of full relocation: ₹89 Lakh."
        },
        notifications_sent=[],
        assigned_officer="Anoop Kumar",
        visit_status=VisitStatus.REPORT_SUBMITTED,
        assigned_visit_date=today - timedelta(days=2),
        flagged_at=now - timedelta(days=8),
        current_stage_index=5,
        stage_entered_at=now - timedelta(days=2)
    )

    v2 = Village(
        id=2,
        name="Wayanad North (Vythiri)",
        district="Wayanad",
        state="Kerala",
        danger_level=DangerLevel.NEEDS_ATTENTION,
        risk_label="High Risk",
        ai_tier="Short-term",
        families_affected=178,
        hazard_score=0.78,
        evidence=[
            "72-hour rainfall: 210mm (Source: IMD)",
            "Soil saturation index: Critical 84% (Source: Bhuvan DEM)"
        ],
        data_sources_table=[{"feature": "72-hr Accumulation", "value": "210mm", "source": "IMD", "to_verify": "Verify waterlogging levels near reservoir line."}],
        shap_features=[{"name": "Soil Saturation Index", "weight": 38}, {"name": "Reservoir Proximity", "weight": 32}],
        population_triangulation={"pmjay": 165, "pds": 172, "discom": 180, "ai_used": 178},
        disaster_history=[{"year": "2021", "event": "Reservoir Water Inundation", "damage": "45 families shifted to camp"}],
        intervention_ladder={
            "primary": "Planned Permanent Relocation to Vythiri Safe Site",
            "interim_options": [],
            "cost_of_inaction": "Estimated 10-year cost of doing nothing: ₹1.8 Crore. Cost of relocation: ₹52 Lakh."
        },
        notifications_sent=[],
        assigned_officer="Anoop Kumar",
        visit_status=VisitStatus.REPORT_SUBMITTED,
        assigned_visit_date=today - timedelta(days=50),
        flagged_at=now - timedelta(days=50),
        current_stage_index=4,
        stage_entered_at=now - timedelta(days=48)
    )

    v3 = Village(
        id=3,
        name="Uttarkashi",
        district="Uttarkashi",
        state="Uttarakhand",
        danger_level=DangerLevel.NEEDS_ATTENTION,
        risk_label="High Risk",
        ai_tier="Medium-term",
        families_affected=95,
        hazard_score=0.68,
        evidence=["Seismic Zone: Zone 5 highest risk (Source: GSI Bhukosh)"],
        data_sources_table=[{"feature": "Seismic Zone", "value": "Zone 5", "source": "GSI Bhukosh", "to_verify": "Check structural cracks."}],
        shap_features=[{"name": "Seismic Vulnerability", "weight": 55}],
        population_triangulation={"pmjay": 90, "pds": 94, "discom": 92, "ai_used": 95},
        disaster_history=[],
        intervention_ladder={"primary": "Permanent Relocation to Uttarkashi Plateau", "interim_options": [], "cost_of_inaction": "Cost of inaction: ₹1.2 Cr"},
        notifications_sent=[],
        assigned_officer="Priya Nair",
        visit_status=VisitStatus.VISIT_PENDING,
        assigned_visit_date=today + timedelta(days=3),
        flagged_at=now - timedelta(days=3),
        current_stage_index=2,
        stage_entered_at=now - timedelta(days=3)
    )

    v4 = Village(
        id=4,
        name="Chamoli",
        district="Chamoli",
        state="Uttarakhand",
        danger_level=DangerLevel.KEEP_WATCHING,
        risk_label="Medium Risk",
        ai_tier="Monitor",
        families_affected=61,
        hazard_score=0.52,
        evidence=["Glacial lake volume: +12% increase"],
        data_sources_table=[],
        shap_features=[],
        population_triangulation={"pmjay": 58, "pds": 60, "discom": 62, "ai_used": 61},
        disaster_history=[],
        intervention_ladder={"primary": "Seasonal Monitoring", "interim_options": [], "cost_of_inaction": "Cost: ₹60 Lakh"},
        notifications_sent=[],
        assigned_officer="Priya Nair",
        visit_status=VisitStatus.VISIT_PENDING,
        assigned_visit_date=today + timedelta(days=5),
        flagged_at=now - timedelta(days=2),
        current_stage_index=1,
        stage_entered_at=now - timedelta(days=2)
    )

    v5 = Village(
        id=5,
        name="Pithoragarh South",
        district="Pithoragarh",
        state="Uttarakhand",
        danger_level=DangerLevel.KEEP_WATCHING,
        risk_label="Medium Risk",
        ai_tier="Monitor",
        families_affected=42,
        hazard_score=0.48,
        evidence=["River erosion near embankment"],
        data_sources_table=[],
        shap_features=[],
        population_triangulation={"pmjay": 40, "pds": 42, "discom": 43, "ai_used": 42},
        disaster_history=[],
        intervention_ladder={"primary": "Routine Monitoring", "interim_options": [], "cost_of_inaction": "Cost: ₹40 Lakh"},
        notifications_sent=[],
        assigned_officer="Anoop Kumar",
        visit_status=VisitStatus.VISIT_PENDING,
        assigned_visit_date=today + timedelta(days=7),
        flagged_at=now - timedelta(days=1),
        current_stage_index=1,
        stage_entered_at=now - timedelta(days=1)
    )

    db.add_all([v1, v2, v3, v4, v5])
    db.commit()

    # 4. Seed Field Reports
    fr1 = FieldReport(
        id=1,
        village_id=1,
        submitted_by="Anoop Kumar",
        submitted_at=now - timedelta(days=2),
        visit_date=today - timedelta(days=2),
        gps_coordinates="11.4916, 76.0522",
        actual_families_count=318,
        houses_in_risk_zone=285,
        landslide_signs_observed=True,
        cracks_in_ground_observed=True,
        water_logging_observed=True,
        slope_erosion_visible=True,
        road_condition=RoadCondition.PARTIALLY_BLOCKED,
        community_willing_to_relocate=CommunityWillingness.PARTIAL,
        nearest_safe_structure_distance_km=12.4,
        field_officer_recommendation=FieldRecommendation.IMMEDIATE_EVACUATION,
        observations="Visited the village on foot as the main road was partially washed out. Observed fresh cracks near the eastern slope approximately 40 meters from the nearest house. Three families have already self-evacuated. Community leaders are willing to move but requesting assurance on the relocation site facilities. Immediate action strongly recommended.",
        photo_count=14,
        is_offline_synced=True
    )

    fr2 = FieldReport(
        id=2,
        village_id=2,
        submitted_by="Anoop Kumar",
        submitted_at=now - timedelta(days=48),
        visit_date=today - timedelta(days=48),
        gps_coordinates="11.5500, 76.0100",
        actual_families_count=180,
        houses_in_risk_zone=160,
        landslide_signs_observed=False,
        cracks_in_ground_observed=False,
        water_logging_observed=True,
        slope_erosion_visible=False,
        road_condition=RoadCondition.PARTIALLY_BLOCKED,
        community_willing_to_relocate=CommunityWillingness.YES,
        nearest_safe_structure_distance_km=8.0,
        field_officer_recommendation=FieldRecommendation.PLANNED_RELOCATION,
        observations="High waterlogging observed near the reservoir overflow zone. Physical count confirmed 180 families living in the low-lying basin requiring planned relocation.",
        photo_count=8,
        is_offline_synced=True
    )
    db.add_all([fr1, fr2])
    db.commit()

    # 5. Seed Relocation Sites
    s1 = RelocationSite(
        id=1,
        name="Meppadi Relief Center & Govt Land",
        district="Wayanad",
        state="Kerala",
        linked_village_name="Mundakkai",
        capacity_families=500,
        rank_label="Best Option",
        ahp_score_summary="This site has been ranked Best Option based on land availability, high water table, accessible 2-lane road, and hospital proximity within 8.5km.",
        ahp_breakdown=[
            {"criterion": "Land Availability", "weight": "30%", "score": "High", "meaning": "Sufficient open government land identified"},
            {"criterion": "Water Supply Feasibility", "weight": "25%", "score": "High", "meaning": "Tubewell yield > 12000 LPH"},
            {"criterion": "Road Accessibility", "weight": "25%", "score": "Medium", "meaning": "Paved 2-lane road access available"},
            {"criterion": "Hospital Distance", "weight": "20%", "score": "High", "meaning": "District hospital within 8.5 km"}
        ],
        site_hazard_score=0.14,
        verification_status=LandVerificationStatus.COMPLETED,
        pending_days=2
    )

    s2 = RelocationSite(
        id=2,
        name="Kalpetta Town Enclosure Plot",
        district="Wayanad",
        state="Kerala",
        linked_village_name="Wayanad North (Vythiri)",
        capacity_families=350,
        rank_label="Good Option",
        ahp_score_summary="Ranked Good Option due to clear municipal land titles but higher proximity to urban water drain.",
        ahp_breakdown=[
            {"criterion": "Land Availability", "weight": "30%", "score": "High", "meaning": "Municipal revenue plot available"}
        ],
        site_hazard_score=0.22,
        verification_status=LandVerificationStatus.IN_PROGRESS,
        pending_days=48
    )
    db.add_all([s1, s2])
    db.commit()

    # 6. Land Survey Records
    sr1 = LandSurveyRecord(
        id=1, site_id=1, survey_number="Sy 412/1A", recorded_owner="Kerala State Revenue Department", ownership_status=OwnershipStatus.GOVERNMENT_LAND, acquisition_status=AcquisitionStatus.ACQUIRED, notes="Clear government revenue land.", last_verified_by="R. Sharma", last_verified_at=now - timedelta(days=2)
    )
    sr2 = LandSurveyRecord(
        id=2, site_id=1, survey_number="Sy 412/1B", recorded_owner="Meppadi Plantation Trust", ownership_status=OwnershipStatus.CLEAR, acquisition_status=AcquisitionStatus.IN_PROGRESS, notes="Title cleared.", last_verified_by="R. Sharma", last_verified_at=now - timedelta(days=2)
    )
    db.add_all([sr1, sr2])
    db.commit()

    # 7. Audit Log
    db.add(AuditLog(
        role="REVENUE_OFFICER",
        village_or_site="Mundakkai",
        action="Completed land verification survey for Meppadi Relief Center.",
        performed_by="R. Sharma",
        details="Verified titles and cleared site for notification dispatch.",
        timestamp=now - timedelta(days=2)
    ))
    db.commit()

    if should_close:
        db.close()
    print("AAROHAN Database seeded successfully with production users and complete records!")

if __name__ == "__main__":
    seed_database()
