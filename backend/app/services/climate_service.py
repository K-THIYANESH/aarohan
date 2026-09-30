import logging
import numpy as np
from sqlalchemy.orm import Session
from app.models.strategic_models import (
    ClimateProjectionInputSchema,
    ClimateProjectionOutputSchema,
    ClimateProjectionModel
)

logger = logging.getLogger(__name__)

class MultiDecadalClimateProjectionService:
    """
    Module 3: Multi-Decadal Climate Trajectory Projection
    Projects Red Zone shifts under 5-year (2031), 10-year (2036), and 20-year (2046) IPCC AR6 scenarios.
    """

    def project_trajectories(self, payload: ClimateProjectionInputSchema, db: Session = None) -> ClimateProjectionOutputSchema:
        base_score = payload.baseline_hazard_score

        # Regression scaling parameters
        rate_5yr = (payload.precip_trend_mm_yr * 0.012) + (payload.slope_degradation_factor * 1.5)
        rate_10yr = (payload.precip_trend_mm_yr * 0.028) + (payload.slope_degradation_factor * 3.2) + (payload.sea_level_rise_mm_yr * 0.008)
        rate_20yr = (payload.precip_trend_mm_yr * 0.065) + (payload.slope_degradation_factor * 7.5) + (payload.sea_level_rise_mm_yr * 0.022)

        score_2031 = float(np.clip(base_score + rate_5yr, 0.0, 1.0))
        score_2036 = float(np.clip(base_score + rate_10yr, 0.0, 1.0))
        score_2046 = float(np.clip(base_score + rate_20yr, 0.0, 1.0))

        def classify_risk(score: float) -> str:
            if score >= 0.85:
                return "EXTREME_HAZARD"
            elif score >= 0.70:
                return "HIGH_HAZARD"
            elif score >= 0.50:
                return "MODERATE_HAZARD"
            else:
                return "LOW_HAZARD"

        output = ClimateProjectionOutputSchema(
            habitation_id=payload.habitation_id,
            baseline_hazard_score=round(base_score, 3),
            risk_category_2031=classify_risk(score_2031),
            hazard_score_2031=round(score_2031, 3),
            risk_category_2036=classify_risk(score_2036),
            hazard_score_2036=round(score_2036, 3),
            risk_category_2046=classify_risk(score_2046),
            hazard_score_2046=round(score_2046, 3)
        )

        if db is not None:
            db_record = ClimateProjectionModel(
                habitation_id=payload.habitation_id,
                baseline_hazard_score=base_score,
                risk_category_2031=output.risk_category_2031,
                hazard_score_2031=output.hazard_score_2031,
                risk_category_2036=output.risk_category_2036,
                hazard_score_2036=output.hazard_score_2036,
                risk_category_2046=output.risk_category_2046,
                hazard_score_2046=output.hazard_score_2046
            )
            db.add(db_record)
            db.commit()
            db.refresh(db_record)

        return output

climate_service = MultiDecadalClimateProjectionService()
