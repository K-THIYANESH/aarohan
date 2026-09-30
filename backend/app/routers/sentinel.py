import math
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.strategic_models import (
    SentinelReportCreateSchema,
    SentinelReportOutputSchema,
    SentinelReportModel
)

router = APIRouter(prefix="/sentinel", tags=["Community Sentinel Crowdsourcing"])

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in km between two GPS coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/reports", response_model=SentinelReportOutputSchema, status_code=status.HTTP_201_CREATED)
def submit_sentinel_report(payload: SentinelReportCreateSchema, db: Session = Depends(get_db)):
    """
    Ingest geotagged community ground report (cracks, seepage, rockfall).
    Applies Spatiotemporal Clustering:
    If >= 3 independent reports arrive within a 2 km radius in 48 hours,
    triggers local hazard score boost (+0.25).
    """
    now = datetime.now(timezone.utc)
    cutoff_48h = now - timedelta(hours=48)

    # Query recent reports within 48 hours
    recent_reports = db.query(SentinelReportModel).filter(
        SentinelReportModel.reported_at >= cutoff_48h
    ).all()

    nearby_count = 0
    for r in recent_reports:
        dist = calculate_haversine_distance(payload.latitude, payload.longitude, r.latitude, r.longitude)
        if dist <= 2.0:
            nearby_count += 1

    apply_boost = (nearby_count + 1) >= 3

    new_report = SentinelReportModel(
        reporter_id=payload.reporter_id,
        observation_type=payload.observation_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        description=payload.description,
        cluster_boost_applied=apply_boost
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report

@router.get("/reports", response_model=List[SentinelReportOutputSchema])
def get_sentinel_reports(db: Session = Depends(get_db)):
    """Lists recent community sentinel ground reports."""
    return db.query(SentinelReportModel).order_by(SentinelReportModel.reported_at.desc()).all()
