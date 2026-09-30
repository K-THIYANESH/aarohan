from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.bay_cyclone_models import BayCycloneSimulationModel
from app.schemas.bay_cyclone_schemas import (
    CycloneSimulationInputSchema,
    CycloneSimulationOutputSchema,
    AdvisoryDispatchInputSchema,
    ParametricPayoutInputSchema
)
from app.services.bay_cyclone_service import bay_cyclone_service
from app.services.audit_service import log_audit

router = APIRouter(prefix="/bay-cyclone", tags=["Bay of Bengal & Coastal APAC Predictive Risk Engine"])

@router.post("/simulate", response_model=CycloneSimulationOutputSchema, status_code=status.HTTP_201_CREATED)
def run_cyclone_simulation(payload: CycloneSimulationInputSchema, db: Session = Depends(get_db)):
    """
    Simulates cyclone storm surge, predicts local rainfall damage pathways,
    maps critical infrastructure exposure, triggers parametric insurance liquidity,
    and generates automated early-warning advisory dispatches utilizing GEE feeds & Gemini 3.7 Flash reasoning (with fallback).
    """
    output = bay_cyclone_service.simulate_cyclone_risk(payload, db=db)
    log_audit(
        db,
        role="REVENUE_OFFICER",
        village_or_site=payload.basin_region,
        action=f"Executed AI Cyclone Risk Simulation: {payload.event_name} ({output.category})",
        performed_by="Automated Predictive Risk System"
    )
    return output

@router.get("/simulations", response_model=List[CycloneSimulationOutputSchema])
def list_cyclone_simulations(db: Session = Depends(get_db)):
    """Lists past Bay of Bengal and Coastal APAC cyclone predictive risk simulations."""
    sims = db.query(BayCycloneSimulationModel).order_by(BayCycloneSimulationModel.created_at.desc()).all()
    return sims

@router.get("/simulations/{simulation_id}", response_model=CycloneSimulationOutputSchema)
def get_cyclone_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """Fetches a specific cyclone risk simulation report by ID."""
    sim = db.query(BayCycloneSimulationModel).filter(BayCycloneSimulationModel.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation record not found.")
    return sim

@router.post("/dispatch-advisory", status_code=status.HTTP_200_OK)
def dispatch_advisory_bulletin(payload: AdvisoryDispatchInputSchema, db: Session = Depends(get_db)):
    """
    Automates early-warning advisory dispatches for local municipal and disaster management authorities.
    """
    sim = db.query(BayCycloneSimulationModel).filter(BayCycloneSimulationModel.id == payload.simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation record not found.")

    log_audit(
        db,
        role="REVENUE_OFFICER",
        village_or_site=sim.basin_region,
        action=f"Dispatched Automated Early-Warning Advisory Bulletins for {sim.event_name}",
        performed_by="Municipal & Disaster Management Controller"
    )
    return {
        "status": "DISPATCH_SUCCESSFUL",
        "simulation_id": sim.id,
        "event_name": sim.event_name,
        "circles_notified": payload.authority_circles,
        "advisories_dispatched_count": len(sim.early_warning_advisories),
        "advisories": sim.early_warning_advisories
    }

@router.post("/parametric-payout", status_code=status.HTTP_200_OK)
def release_parametric_insurance_payout(payload: ParametricPayoutInputSchema, db: Session = Depends(get_db)):
    """
    Executes pre-landfall parametric insurance liquidity payout release to municipal disaster funds.
    """
    sim = db.query(BayCycloneSimulationModel).filter(BayCycloneSimulationModel.id == payload.simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation record not found.")

    parametric_info = sim.parametric_insurance
    payout_amount = parametric_info.get("payout_amount_inr", 250000000)

    log_audit(
        db,
        role="REVENUE_OFFICER",
        village_or_site=sim.basin_region,
        action=f"Authorized Parametric Insurance Payout ({parametric_info.get('payout_amount_display')}) for {sim.event_name}",
        performed_by="State Disaster Finance Directorate"
    )
    return {
        "status": "LIQUIDITY_RELEASED",
        "simulation_id": sim.id,
        "payout_recipient": payload.payout_recipient,
        "amount_released_inr": payout_amount,
        "amount_display": parametric_info.get("payout_amount_display", f"₹{payout_amount/10000000:.2f} Crore"),
        "authorization_reference": f"PARA-BOB-{sim.id}-2026-RELEASE"
    }
