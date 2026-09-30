from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import AuditLog

def log_audit(db: Session, role: str, village_or_site: str, action: str, performed_by: str, details: str = None):
    audit = AuditLog(
        role=role,
        village_or_site=village_or_site,
        action=action,
        performed_by=performed_by,
        details=details,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit
