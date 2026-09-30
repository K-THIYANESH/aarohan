from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db

from app.models.strategic_models import (
    ResistanceInputSchema, ResistanceOutputSchema,
    CheckinCreateSchema, SatelliteAnalysisSchema, MonitoringStatusSchema,
    ClimateProjectionInputSchema, ClimateProjectionOutputSchema,
    SpatialLivelihoodInputSchema, LivelihoodAssessmentOutputSchema,
    BudgetOptimizationInputSchema, BudgetOptimizationOutputSchema,
    LegalClearanceInputSchema, LegalClearanceOutputSchema
)
from app.services.resistance_service import resistance_engine
from app.services.monitoring_service import monitoring_service
from app.services.climate_service import climate_service
from app.services.livelihood_service import livelihood_service
from app.services.budget_service import budget_service
from app.services.legal_service import legal_service

router = APIRouter(prefix="/strategic", tags=["Strategic Planning & Decision Support"])

# Module 1: Relocation Resistance Prediction
@router.post("/resistance", response_model=ResistanceOutputSchema)
def predict_relocation_resistance(payload: ResistanceInputSchema, db: Session = Depends(get_db)):
    """Predicts community refusal/resistance risk and SHAP attributions."""
    try:
        return resistance_engine.predict_resistance(payload, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resistance Prediction Failed: {str(e)}")

# Module 2: Post-Relocation Monitoring
@router.post("/monitoring/satellite")
async def analyze_satellite_pass(payload: SatelliteAnalysisSchema, db: Session = Depends(get_db)):
    """Async satellite pass analysis for bi-weekly Red Zone re-occupation detection."""
    return await monitoring_service.process_satellite_metrics(payload, db=db)

@router.post("/monitoring/checkin", response_model=MonitoringStatusSchema, status_code=status.HTTP_201_CREATED)
def record_field_checkin(payload: CheckinCreateSchema, db: Session = Depends(get_db)):
    """Records 30/90/180-day geotagged PWA check-in for vacated Red Zones."""
    return monitoring_service.record_field_checkin(payload, db=db)

# Module 3: Climate Trajectory Projection
@router.post("/climate/projection", response_model=ClimateProjectionOutputSchema)
def project_climate_trajectories(payload: ClimateProjectionInputSchema, db: Session = Depends(get_db)):
    """Projects 5-year (2031), 10-year (2036), and 20-year (2046) Red Zone shifts under IPCC AR6 scenarios."""
    return climate_service.project_trajectories(payload, db=db)

# Module 4: Livelihood & FRA Pre-Screening
@router.post("/livelihood/prescreen", response_model=LivelihoodAssessmentOutputSchema)
def prescreen_livelihood_continuity(payload: SpatialLivelihoodInputSchema):
    """Evaluates spatial distance & FRA block overlap to assign CONDITIONAL_APPROVAL_LIVELIHOOD_RISK if needed."""
    return livelihood_service.evaluate_livelihood_continuity(payload)

# Module 6: Budget Allocation Optimizer
@router.post("/budget/optimize", response_model=BudgetOptimizationOutputSchema)
def optimize_state_budget_allocation(payload: BudgetOptimizationInputSchema):
    """Mixed-Integer Linear Programming (MILP) budget solver maximizing protected lives per Rupee."""
    return budget_service.optimize_allocation(payload)

# Module 7: Legal Pre-Clearance
@router.post("/legal/preclearance", response_model=LegalClearanceOutputSchema)
def preclear_site_legalities(payload: LegalClearanceInputSchema, db: Session = Depends(get_db)):
    """Pre-clears destination sites across Revenue records, Forest reservations, and Gram Sabha consent."""
    return legal_service.preclear_site_legalities(payload, db=db)
