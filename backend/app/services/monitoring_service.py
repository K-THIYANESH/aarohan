import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.strategic_models import (
    CheckinCreateSchema,
    SatelliteAnalysisSchema,
    PostRelocationCheckinModel
)

logger = logging.getLogger(__name__)

class PostRelocationMonitoringService:
    """
    Module 2: Post-Relocation Monitoring & Return Detection
    Detects unauthorized re-occupation of vacated Red Zones via satellite and field check-ins.
    """

    @staticmethod
    async def process_satellite_metrics(analysis: SatelliteAnalysisSchema, db: Session) -> dict:
        """
        Async satellite pass evaluation analyzing bi-weekly NDVI drop & reflectance shifts.
        """
        reoccupation_risk = False
        reason = "Normal vegetation re-growth"

        if analysis.structural_reflectance_change > 0.35:
            reoccupation_risk = True
            reason = "High structural reflectance change detected (unauthorized construction/roofing)"
        elif analysis.ndvi_drop > 0.25 and analysis.structural_reflectance_change > 0.15:
            reoccupation_risk = True
            reason = "Land clearing and human presence activity pattern detected"

        status = "REQUIRES_REVIEW" if reoccupation_risk else "CLEARED"

        logger.info(f"Satellite analysis for Red Zone {analysis.red_zone_id}: Status {status}. Reason: {reason}")
        return {
            "red_zone_id": analysis.red_zone_id,
            "status": status,
            "reoccupation_risk": reoccupation_risk,
            "reason": reason,
            "processed_at": str(datetime.now(timezone.utc))
        }

    @staticmethod
    def record_field_checkin(payload: CheckinCreateSchema, db: Session) -> PostRelocationCheckinModel:
        """
        Records 30/90/180-day geotagged check-in from Field Officer PWA.
        """
        status = "CLEARED"
        if payload.human_presence_detected or payload.structural_reflectance_change > 0.30:
            status = "REQUIRES_REVIEW"

        record = PostRelocationCheckinModel(
            red_zone_id=payload.red_zone_id,
            checkin_day=payload.checkin_day,
            field_officer_name=payload.field_officer_name,
            gps_latitude=payload.gps_latitude,
            gps_longitude=payload.gps_longitude,
            human_presence_detected=payload.human_presence_detected,
            structural_reflectance_change=payload.structural_reflectance_change,
            ndvi_drop=payload.ndvi_drop,
            status=status,
            notes=payload.notes
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        if status == "REQUIRES_REVIEW":
            logger.warning(f"ALERT: Red Zone {payload.red_zone_id} flagged for human presence on Day {payload.checkin_day}!")

        return record

monitoring_service = PostRelocationMonitoringService()
