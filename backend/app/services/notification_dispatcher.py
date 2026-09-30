from fastapi import BackgroundTasks
from app.services.email_service import send_email, get_circle1_email_html, get_circle2_email_html, get_circle3_email_html, get_rapid_email_html
from app.services.sms_service import send_sms, send_whatsapp
from app.config import settings

def dispatch_circle1_notifications(background_tasks: BackgroundTasks, village_name: str, tier: str, families: int, field_summary: str, recommendation: str):
    html = get_circle1_email_html(village_name, tier, families, field_summary, recommendation)
    text = f"AAROHAN ALERT: Circle 1 Government notified for {village_name}. Tier: {tier}, Families: {families}."
    
    # Email to Collector & SDMA
    background_tasks.add_task(send_email, settings.DEMO_COLLECTOR_EMAIL, f"AAROHAN Circle 1 Alert: {village_name}", text, html)
    # SMS / WhatsApp to Collector
    background_tasks.add_task(send_whatsapp, settings.DEMO_COLLECTOR_PHONE, text)

def dispatch_circle2_notifications(background_tasks: BackgroundTasks, village_name: str, coords: str, population: int, road_access: str):
    html = get_circle2_email_html(village_name, coords, population, road_access)
    text = f"AAROHAN RESPONDERS: Standby for {village_name}. Coords: {coords}. Await Collector order."
    
    background_tasks.add_task(send_email, settings.DEMO_NDRF_EMAIL, f"AAROHAN Circle 2 Alert: {village_name}", text, html)
    background_tasks.add_task(send_sms, settings.DEMO_COLLECTOR_PHONE, text)

def dispatch_circle3_notifications(background_tasks: BackgroundTasks, village_name: str, details: str):
    html = get_circle3_email_html(village_name, details)
    text = f"AAROHAN CIVIL SOCIETY: Shelter & relief capacity check for {village_name}."
    
    background_tasks.add_task(send_email, settings.DEMO_NGO_EMAIL, f"AAROHAN Circle 3 Advisory: {village_name}", text, html)
    background_tasks.add_task(send_whatsapp, settings.DEMO_COLLECTOR_PHONE, text)

def dispatch_rapid_activation_notifications(background_tasks: BackgroundTasks, incident_name: str, location: str, details: str):
    html = get_rapid_email_html(incident_name, location, details)
    text = f"🚨 AAROHAN RAPID ACTIVATED: {incident_name} ({location}). All circles alerted. Immediate action required!"

    background_tasks.add_task(send_email, settings.DEMO_COLLECTOR_EMAIL, f"🚨 RAPID EMERGENCY ACTIVATION: {incident_name}", text, html)
    background_tasks.add_task(send_email, settings.DEMO_NDRF_EMAIL, f"🚨 RAPID EMERGENCY ACTIVATION: {incident_name}", text, html)
    background_tasks.add_task(send_email, settings.DEMO_NGO_EMAIL, f"🚨 RAPID EMERGENCY ACTIVATION: {incident_name}", text, html)
    background_tasks.add_task(send_sms, settings.DEMO_COLLECTOR_PHONE, text)
    background_tasks.add_task(send_whatsapp, settings.DEMO_COLLECTOR_PHONE, text)
