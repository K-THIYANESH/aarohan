def test_check_escalations(client, auth_headers_revenue_officer):
    res = client.get("/escalations/check", headers=auth_headers_revenue_officer)
    assert res.status_code == 200
    data = res.json()
    assert "overdue_count" in data
    assert "cases" in data
    # Wayanad North (Vythiri) has stage entered 48 days ago > 45 days overall limit
    overdue_names = [c["village_name"] for c in data["cases"]]
    assert "Wayanad North (Vythiri)" in overdue_names

def test_dismiss_escalation_validation(client, auth_headers_revenue_officer):
    # Empty reason should return 422
    res = client.post("/escalations/villages/2/dismiss", json={"reason": ""}, headers=auth_headers_revenue_officer)
    assert res.status_code == 422
