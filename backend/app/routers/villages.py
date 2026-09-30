from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Village, User, UserRole
from app.schemas import VillageSchema
from app.dependencies import get_current_user
from app.services.audit_service import log_audit
from app.utils.exceptions import NotFoundError

router = APIRouter(prefix="/villages", tags=["Villages"])

@router.get("", response_model=List[VillageSchema])
def get_all_villages(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    villages = db.query(Village).all()
    # Sort: EVACUATE_NOW / Immediate tier top
    sorted_v = sorted(villages, key=lambda v: (0 if v.ai_tier == "Immediate" else 1, -v.hazard_score))
    return sorted_v

@router.get("/{village_id}", response_model=VillageSchema)
def get_village_by_id(village_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)
    return village

@router.patch("/{village_id}/stage", response_model=VillageSchema)
def update_village_stage(village_id: int, stage_index: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise NotFoundError("Village", village_id)

    village.current_stage_index = stage_index
    log_audit(db, role=current_user.role.value, village_or_site=village.name, action=f"Updated pipeline stage to index {stage_index}", performed_by=current_user.name)
    db.commit()
    db.refresh(village)
    return village
