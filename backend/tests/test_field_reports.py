from datetime import date

def test_submit_field_report(client, auth_headers_field_officer):
    payload = {
        "village_id": 3,
        "visit_date": str(date.today()),
        "gps_coordinates": "11.605, 76.083",
        "actual_families_count": 98,
        "houses_in_risk_zone": 80,
        "landslide_signs_observed": True,
        "cracks_in_ground_observed": False,
        "water_logging_observed": False,
        "slope_erosion_visible": True,
        "road_condition": "ACCESSIBLE",
        "community_willing_to_relocate": "YES",
        "nearest_safe_structure_distance_km": 5.2,
        "field_officer_recommendation": "PLANNED_RELOCATION",
        "observations": "Detailed physical inspection completed. Ground slope shows signs of erosion. Community is prepared to relocate.",
        "photo_count": 5
    }
    res = client.post("/field/reports", json=payload, headers=auth_headers_field_officer)
    assert res.status_code == 200
    assert res.json()["village_id"] == 3

def test_validation_short_observations(client, auth_headers_field_officer):
    payload = {
        "village_id": 4,
        "visit_date": str(date.today()),
        "gps_coordinates": "11.605, 76.083",
        "actual_families_count": 61,
        "houses_in_risk_zone": 50,
        "landslide_signs_observed": False,
        "cracks_in_ground_observed": False,
        "water_logging_observed": False,
        "slope_erosion_visible": False,
        "road_condition": "ACCESSIBLE",
        "community_willing_to_relocate": "YES",
        "nearest_safe_structure_distance_km": 5.0,
        "field_officer_recommendation": "KEEP_MONITORING",
        "observations": "Short note",
        "photo_count": 1
    }
    res = client.post("/field/reports", json=payload, headers=auth_headers_field_officer)
    assert res.status_code == 422
    assert res.json()["error"] == "validation_error"

def test_validation_gps_out_of_range(client, auth_headers_field_officer):
    payload = {
        "village_id": 4,
        "visit_date": str(date.today()),
        "gps_coordinates": "0.0, 0.0",
        "actual_families_count": 61,
        "houses_in_risk_zone": 50,
        "landslide_signs_observed": False,
        "cracks_in_ground_observed": False,
        "water_logging_observed": False,
        "slope_erosion_visible": False,
        "road_condition": "ACCESSIBLE",
        "community_willing_to_relocate": "YES",
        "nearest_safe_structure_distance_km": 5.0,
        "field_officer_recommendation": "KEEP_MONITORING",
        "observations": "Detailed physical inspection completed. Ground slope shows signs of erosion. Community is prepared to relocate.",
        "photo_count": 1
    }
    res = client.post("/field/reports", json=payload, headers=auth_headers_field_officer)
    assert res.status_code == 422

def test_duplicate_report_conflict(client, auth_headers_field_officer):
    payload = {
        "village_id": 1, # Already seeded in conftest
        "visit_date": str(date.today()),
        "gps_coordinates": "11.4916, 76.0522",
        "actual_families_count": 312,
        "houses_in_risk_zone": 280,
        "landslide_signs_observed": True,
        "cracks_in_ground_observed": True,
        "water_logging_observed": True,
        "slope_erosion_visible": True,
        "road_condition": "ACCESSIBLE",
        "community_willing_to_relocate": "YES",
        "nearest_safe_structure_distance_km": 10.0,
        "field_officer_recommendation": "IMMEDIATE_EVACUATION",
        "observations": "Detailed physical inspection completed. Ground slope shows signs of erosion. Community is prepared to relocate.",
        "photo_count": 10
    }
    res = client.post("/field/reports", json=payload, headers=auth_headers_field_officer)
    assert res.status_code == 409
