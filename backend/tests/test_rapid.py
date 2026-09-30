def test_activate_rapid(client, auth_headers_revenue_officer):
    payload = {
        "incident_name": "Wayanad Landslide Rapid Activation",
        "incident_type": "LANDSLIDE",
        "district": "Wayanad",
        "activated_reason": "Sudden massive cloudburst caused immediate slope failure near habitation.",
        "estimated_affected_persons": 600,
        "incident_radius_km": 15.0,
        "affected_village_ids": [1, 2],
        "unregistered_villages": ["New Unregistered Hamlet A"]
    }
    res = client.post("/rapid/activate", json=payload, headers=auth_headers_revenue_officer)
    assert res.status_code == 200
    data = res.json()
    assert data["incident_name"] == "Wayanad Landslide Rapid Activation"
    assert len(data["actions"]) == 3

def test_get_active_rapid(client, auth_headers_revenue_officer):
    res = client.get("/rapid/active", headers=auth_headers_revenue_officer)
    assert res.status_code == 200

def test_contain_rapid_requires_field_report(client, auth_headers_revenue_officer):
    # Activate incident
    payload = {
        "incident_name": "Flash Flood Rapid",
        "incident_type": "FLASH_FLOOD",
        "district": "Wayanad",
        "activated_reason": "Sudden massive cloudburst caused immediate slope failure near habitation.",
        "estimated_affected_persons": 200,
        "incident_radius_km": 10.0,
        "affected_village_ids": [1]
    }
    act_res = client.post("/rapid/activate", json=payload, headers=auth_headers_revenue_officer)
    inc_id = act_res.json()["id"]

    res = client.patch(f"/rapid/{inc_id}/contain", headers=auth_headers_revenue_officer)
    assert res.status_code == 200

def test_close_rapid_creates_new_villages(client, auth_headers_revenue_officer):
    # Activate incident with unregistered village
    payload = {
        "incident_name": "Cloudburst Incident",
        "incident_type": "CLOUDBURST",
        "district": "Wayanad",
        "activated_reason": "Sudden massive cloudburst caused immediate slope failure near habitation.",
        "estimated_affected_persons": 300,
        "incident_radius_km": 12.0,
        "affected_village_ids": [1],
        "unregistered_villages": ["Emergency Unregistered Settlement B"]
    }
    act_res = client.post("/rapid/activate", json=payload, headers=auth_headers_revenue_officer)
    inc_id = act_res.json()["id"]

    close_res = client.post(f"/rapid/{inc_id}/close", headers=auth_headers_revenue_officer)
    assert close_res.status_code == 200

    # Verify new village was added
    v_res = client.get("/villages", headers=auth_headers_revenue_officer)
    v_names = [v["name"] for v in v_res.json()]
    assert "Emergency Unregistered Settlement B" in v_names
