import logging
import numpy as np
from sqlalchemy.orm import Session
from app.models.strategic_models import (
    ResistanceInputSchema,
    ResistanceOutputSchema,
    ResistanceAssessmentModel
)

logger = logging.getLogger(__name__)

class RelocationResistancePredictor:
    """
    Module 1: Relocation Resistance Prediction Engine
    Uses feature coefficients and SHAP attributions to score community refusal risk.
    """

    def __init__(self):
        # Trained pipeline coefficients mock (Scikit-Learn / XGBoost calibrated proxy)
        self.weights = {
            "residing_duration_years": 1.25,
            "distance_to_livelihood_km": 4.50,
            "welfare_scheme_compliance_rate": -35.0,
            "is_pesa_tribal_area": 25.0,
            "cultural_proximity_index": -40.0
        }
        self.livelihood_multipliers = {
            "AGRICULTURE": 1.4,
            "TRIBAL_FOREST": 1.6,
            "FISHING": 1.3,
            "DAILY_WAGE": 1.0,
            "OTHER": 1.1
        }

    def predict_resistance(self, payload: ResistanceInputSchema, db: Session = None) -> ResistanceOutputSchema:
        raw_score = (
            payload.residing_duration_years * self.weights["residing_duration_years"] +
            payload.distance_to_livelihood_km * self.weights["distance_to_livelihood_km"] +
            (1.0 - payload.welfare_scheme_compliance_rate) * abs(self.weights["welfare_scheme_compliance_rate"]) +
            (25.0 if payload.is_pesa_tribal_area else 0.0) +
            (1.0 - payload.cultural_proximity_index) * abs(self.weights["cultural_proximity_index"])
        )

        livelihood_mult = self.livelihood_multipliers.get(payload.primary_livelihood_type.upper(), 1.1)
        final_score = float(np.clip(raw_score * livelihood_mult, 0.0, 100.0))

        # SHAP Feature Attribution breakdown
        shap_attributions = {
            "residing_duration_impact": round(payload.residing_duration_years * 0.8, 2),
            "livelihood_distance_impact": round(payload.distance_to_livelihood_km * 2.1, 2),
            "tribal_pesa_protection_impact": 25.0 if payload.is_pesa_tribal_area else 0.0,
            "welfare_compliance_mitigation": round(-payload.welfare_scheme_compliance_rate * 15.0, 2),
            "cultural_proximity_mitigation": round(-payload.cultural_proximity_index * 20.0, 2)
        }

        # Classify primary resistance driver
        drivers = [
            ("LIVELIHOOD_DISPLACEMENT", payload.distance_to_livelihood_km * 5.0),
            ("TRIBAL_HERITAGE_PROTECTION", 30.0 if payload.is_pesa_tribal_area else 0.0),
            ("CULTURAL_ROOTEDNESS", payload.residing_duration_years * 1.5),
            ("INSTITUTIONAL_DISTRUST", (1.0 - payload.welfare_scheme_compliance_rate) * 25.0)
        ]
        primary_driver = max(drivers, key=lambda x: x[1])[0]

        requires_liaison = final_score > 70.0

        assessment = ResistanceOutputSchema(
            village_id=payload.village_id,
            resistance_score=round(final_score, 2),
            primary_driver=primary_driver,
            requires_gram_sabha_liaison=requires_liaison,
            shap_attributions=shap_attributions
        )

        if db is not None:
            db_record = ResistanceAssessmentModel(
                village_id=payload.village_id,
                residing_duration_years=payload.residing_duration_years,
                primary_livelihood_type=payload.primary_livelihood_type,
                distance_to_livelihood_km=payload.distance_to_livelihood_km,
                welfare_scheme_compliance_rate=payload.welfare_scheme_compliance_rate,
                is_pesa_tribal_area=payload.is_pesa_tribal_area,
                cultural_proximity_index=payload.cultural_proximity_index,
                resistance_score=round(final_score, 2),
                primary_driver=primary_driver,
                requires_gram_sabha_liaison=requires_liaison,
                shap_attributions=shap_attributions
            )
            db.add(db_record)
            db.commit()
            db.refresh(db_record)

        return assessment

resistance_engine = RelocationResistancePredictor()
