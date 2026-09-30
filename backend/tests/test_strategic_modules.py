from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_resistance_prediction():
    response = client.post("/strategic/resistance", json={
        "village_id": 1,
        "residing_duration_years": 25,
        "primary_livelihood_type": "TRIBAL_FOREST",
        "distance_to_livelihood_km": 12.5,
        "welfare_scheme_compliance_rate": 0.45,
        "is_pesa_tribal_area": True,
        "cultural_proximity_index": 0.3
    })
    assert response.status_code == 200
    data = response.json()
    assert "resistance_score" in data
    assert data["requires_gram_sabha_liaison"] is True

def test_climate_projection():
    response = client.post("/strategic/climate/projection", json={
        "habitation_id": 101,
        "baseline_hazard_score": 0.75,
        "precip_trend_mm_yr": 3.5,
        "sea_level_rise_mm_yr": 4.0,
        "slope_degradation_factor": 0.02
    })
    assert response.status_code == 200
    data = response.json()
    assert "risk_category_2031" in data
    assert "hazard_score_2046" in data

def test_livelihood_prescreen():
    response = client.post("/strategic/livelihood/prescreen", json={
        "site_id": 5,
        "site_lat": 11.75,
        "site_lon": 76.25,
        "historical_agri_zone_ids": [1, 2],
        "historical_forest_block_ids": [10],
        "historical_fishing_zone_ids": []
    })
    assert response.status_code == 200
    data = response.json()
    assert data["approval_status"] in ["APPROVED", "CONDITIONAL_APPROVAL_LIVELIHOOD_RISK"]

def test_budget_optimizer():
    payload = {
        "total_budget": 50000000,
        "candidates": [
            {"id": 1, "name": "Village A", "population": 1200, "risk_score": 0.92, "cost": 30000000},
            {"id": 2, "name": "Village B", "population": 800, "risk_score": 0.85, "cost": 18000000},
            {"id": 3, "name": "Village C", "population": 500, "risk_score": 0.78, "cost": 15000000}
        ]
    }
    response = client.post("/strategic/budget/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["budget_utilized"] <= 50000000
    assert len(data["allocations"]) == 3

def test_legal_preclearance():
    response = client.post("/strategic/legal/preclearance", json={
        "site_id": 12,
        "survey_number": "SY-405/2A",
        "district": "Wayanad",
        "village_name": "Vythiri"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "LEGALLY_CLEARED"

def test_sentinel_crowdsourcing():
    response = client.post("/sentinel/reports", json={
        "reporter_id": "SENTINEL-99",
        "observation_type": "CRACK",
        "latitude": 11.605,
        "longitude": 76.083,
        "description": "Deep tension crack appearing across main access road post heavy rainfall."
    })
    assert response.status_code == 201
    data = response.json()
    assert data["observation_type"] == "CRACK"
