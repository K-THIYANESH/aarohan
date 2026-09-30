from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogSchema
from app.dependencies import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditLogSchema])
def get_audit_logs(role: Optional[str] = Query(None), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(AuditLog)
    if role:
        # Match enum format (FIELD_OFFICER, REVENUE_OFFICER) or display text ("Field Officer", "Revenue Officer")
        role_upper = role.upper().replace(" ", "_")
        role_display = "Field Officer" if "FIELD" in role_upper else ("Revenue Officer" if "REVENUE" in role_upper else role)
        query = query.filter(
            (AuditLog.role == role) |
            (AuditLog.role == role_upper) |
            (AuditLog.role == role_display)
        )
    logs = query.order_by(desc(AuditLog.timestamp)).all()
    return logs
