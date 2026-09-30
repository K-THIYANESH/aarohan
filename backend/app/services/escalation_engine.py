from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import Village

def check_overdue_cases(db: Session):
    """
    Check villages against timeline thresholds for each tier.
    Thresholds (days allowed per stage):
    IMMEDIATE: 3 days
    SHORT_TERM: 7 days
    MEDIUM_TERM: 14 days
    MONITOR: 30 days
    Overdue cases (>45 days overall or stage limit breached) trigger auto-escalation check.
    """
    thresholds = {
        "Immediate": 3,
        "Short-term": 7,
        "Medium-term": 14,
        "Monitor": 30
    }
    
    villages = db.query(Village).all()
    overdue_cases = []
    now = datetime.now(timezone.utc)

    for v in villages:
        allowed = thresholds.get(v.ai_tier, 14)
        days_in_stage = (now - v.stage_entered_at.replace(tzinfo=timezone.utc)).days if v.stage_entered_at else 0
        total_days = (now - v.flagged_at.replace(tzinfo=timezone.utc)).days if v.flagged_at else 0

        is_overdue = days_in_stage > allowed or total_days > 45
        if is_overdue:
            overdue_cases.append({
                "village_id": v.id,
                "village_name": v.name,
                "ai_tier": v.ai_tier,
                "current_stage_index": v.current_stage_index,
                "days_in_stage": days_in_stage,
                "allowed_days": allowed,
                "total_days": total_days,
                "is_escalated": v.is_escalated,
                "escalation_reason": v.escalation_reason
            })

    return overdue_cases
