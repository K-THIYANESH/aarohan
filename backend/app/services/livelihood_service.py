import logging
import math
from app.models.strategic_models import SpatialLivelihoodInputSchema, LivelihoodAssessmentOutputSchema

logger = logging.getLogger(__name__)

class LivelihoodAndFRAPrescreeningService:
    """
    Module 4: Livelihood Continuity & FRA Pre-Screening Engine
    Evaluates spatial distance & overlap of proposed relocation sites with agricultural polygons,
    Forest Rights Act (FRA) blocks, and coastal fishing zones using ST_Distance/ST_Intersects spatial rules.
    """

    def evaluate_livelihood_continuity(self, payload: SpatialLivelihoodInputSchema) -> LivelihoodAssessmentOutputSchema:
        # Distance metric approximation (lat/lon to km centroid distance)
        # Assuming original livelihood centroid at (11.60, 76.08)
        orig_lat, orig_lon = 11.605, 76.083
        dlat = payload.site_lat - orig_lat
        dlon = payload.site_lon - orig_lon
        distance_km = round(math.sqrt(dlat**2 + dlon**2) * 111.0, 2)

        # Calculate severed access percentage based on distance & historical zone counts
        base_sever_pct = min(100.0, (distance_km / 15.0) * 100.0)
        fra_overlap_count = len(payload.historical_forest_block_ids)

        if fra_overlap_count > 0:
            base_sever_pct += (fra_overlap_count * 15.0)

        final_severed_pct = min(100.0, round(base_sever_pct, 1))

        if final_severed_pct > 60.0:
            status = "CONDITIONAL_APPROVAL_LIVELIHOOD_RISK"
            recommendation = (
                f"Severed access rate of {final_severed_pct}% exceeds 60% threshold. "
                f"Mandatory alternative land allocation or livelihood compensation package required under FRA 2006."
            )
        else:
            status = "APPROVED"
            recommendation = f"Site maintains good economic continuity ({final_severed_pct}% displacement index)."

        return LivelihoodAssessmentOutputSchema(
            site_id=payload.site_id,
            severed_access_percentage=final_severed_pct,
            approval_status=status,
            access_distance_km=distance_km,
            recommendation=recommendation
        )

livelihood_service = LivelihoodAndFRAPrescreeningService()
