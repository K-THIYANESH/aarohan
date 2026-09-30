def test_send_circle1_success(client, auth_headers_revenue_officer):
    payload = {
        "collector_message": "Alert Collector",
        "collector_channel": "WhatsApp",
        "sdma_message": "Alert SDMA",
        "sdma_channel": "Email",
        "bdo_message": "Alert BDO",
        "bdo_channel": "SMS"
    }
    res = client.post("/revenue/villages/1/send-circle1", json=payload, headers=auth_headers_revenue_officer)
    assert res.status_code == 200
    assert len(res.json()["notifications_sent"]) >= 3

def test_send_circle1_locked_if_no_report(client, auth_headers_revenue_officer):
    payload = {
        "collector_message": "Alert Collector",
        "collector_channel": "WhatsApp",
        "sdma_message": "Alert SDMA",
        "sdma_channel": "Email",
        "bdo_message": "Alert BDO",
        "bdo_channel": "SMS"
    }
    # Village 3 has VISIT_PENDING (no report)
    res = client.post("/revenue/villages/3/send-circle1", json=payload, headers=auth_headers_revenue_officer)
    assert res.status_code == 400
    assert "field officer ground verification" in res.json()["detail"]

def test_pdf_generation_content_type(client, auth_headers_revenue_officer):
    res = client.post("/notifications/generate-pdf/1", headers=auth_headers_revenue_officer)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
