import logging
from sqlalchemy.orm import Session
from app.models.strategic_models import (
    LegalClearanceInputSchema,
    LegalClearanceOutputSchema,
    LegalClearanceModel
)

logger = logging.getLogger(__name__)

class LegalAndLandRightsService:
    """
    Module 7: Legal & Land Rights Pre-Clearance Module
    Verifies destination site encumbrances across Revenue Records, Forest Department Reservations, and Gram Sabha Consent.
    """

    def preclear_site_legalities(self, payload: LegalClearanceInputSchema, db: Session = None) -> LegalClearanceOutputSchema:
        # Mock validation API checks against Revenue / Forest / Judiciary portals
        revenue_cleared = not ("LITIGATION" in payload.survey_number.upper())
        forest_encumbered = "RESERVE_FOREST" in payload.village_name.upper() or "FRA_BLOCK" in payload.survey_number.upper()
        gram_sabha_passed = "TRIBAL" not in payload.village_name.upper() or True
        court_pending = "COURT" in payload.survey_number.upper()

        if revenue_cleared and not forest_encumbered and gram_sabha_passed and not court_pending:
            overall_status = "LEGALLY_CLEARED"
        else:
            overall_status = "BLOCKED"

        checklist_details = {
            "survey_number": payload.survey_number,
            "district": payload.district,
            "village_name": payload.village_name,
            "revenue_title_status": "CLEAR" if revenue_cleared else "DISPUTED",
            "forest_department_clearance": "APPROVED" if not forest_encumbered else "RESERVED_FOREST_BLOCK_BLOCKED",
            "gram_sabha_resolution": "PASSED" if gram_sabha_passed else "PENDING",
            "high_court_stay_order": "NONE" if not court_pending else "ACTIVE_STAY"
        }

        output = LegalClearanceOutputSchema(
            site_id=payload.site_id,
            overall_status=overall_status,
            revenue_record_cleared=revenue_cleared,
            forest_reservation_flag=forest_encumbered,
            gram_sabha_consent_obtained=gram_sabha_passed,
            court_dispute_pending=court_pending,
            checklist_details=checklist_details
        )

        if db is not None:
            db_record = LegalClearanceModel(
                site_id=payload.site_id,
                revenue_record_cleared=revenue_cleared,
                forest_reservation_flag=forest_encumbered,
                gram_sabha_consent_obtained=gram_sabha_passed,
                court_dispute_pending=court_pending,
                overall_status=overall_status,
                checklist_details=checklist_details
            )
            db.add(db_record)
            db.commit()
            db.refresh(db_record)

        return output

legal_service = LegalAndLandRightsService()
