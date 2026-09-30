from datetime import datetime

def format_inr_lakhs(amount_inr: float) -> str:
    return f"₹{(amount_inr / 100000.0):.1f}L"

def format_hazard_risk_label(score: float) -> str:
    if score >= 0.85:
        return "Very High Risk"
    elif score >= 0.70:
        return "High Risk"
    elif score >= 0.55:
        return "Medium Risk"
    return "Low Risk — Monitoring"

def format_tier_label(tier: str) -> str:
    mapping = {
        "IMMEDIATE": "Evacuate Now",
        "SHORT_TERM": "Needs Attention",
        "MEDIUM_TERM": "Plan Relocation",
        "MONITOR": "Keep Watching"
    }
    return mapping.get(tier.upper(), tier)
