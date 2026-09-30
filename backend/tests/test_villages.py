def test_get_villages(client, auth_headers_field_officer):
    res = client.get("/villages", headers=auth_headers_field_officer)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 5
    assert data[0]["name"] == "Mundakkai"

def test_get_village_detail(client, auth_headers_field_officer):
    res = client.get("/villages/1", headers=auth_headers_field_officer)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Mundakkai"
    assert len(data["shap_features"]) > 0

def test_patch_village_stage(client, auth_headers_revenue_officer):
    res = client.patch("/villages/1/stage?stage_index=6", headers=auth_headers_revenue_officer)
    assert res.status_code == 200
    assert res.json()["current_stage_index"] == 6

def test_unauthorized_access(client):
    res = client.get("/villages")
    assert res.status_code == 403 or res.status_code == 401

def test_role_enforcement(client, auth_headers_field_officer):
    # Field officer cannot perform revenue action
    res = client.post("/revenue/villages/1/send-circle1", json={
        "collector_message": "test", "collector_channel": "WhatsApp",
        "sdma_message": "test", "sdma_channel": "Email",
        "bdo_message": "test", "bdo_channel": "SMS"
    }, headers=auth_headers_field_officer)
    assert res.status_code == 403
