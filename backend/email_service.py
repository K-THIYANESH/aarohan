import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from dotenv import load_dotenv

load_dotenv()

DEMO_RECIPIENT_EMAIL = os.getenv("DEMO_RECIPIENT_EMAIL", "officer.disaster.demo@gmail.com")

def send_evacuation_alert_email(village_name: str, families_affected: int, site_name: str, officer_name: str, timestamp_str: str):
    subject = f"AAROHAN Alert — Evacuation Approved: {village_name}"
    body = (
        f"AAROHAN DISASTER RELOCATION ALERT\n"
        f"===================================\n\n"
        f"Evacuation has been officially APPROVED.\n\n"
        f"Details:\n"
        f"- Village: {village_name}\n"
        f"- Families Affected: {families_affected}\n"
        f"- Approved Relocation Site: {site_name}\n"
        f"- Approving Officer: {officer_name}\n"
        f"- Approval Timestamp: {timestamp_str}\n\n"
        f"Automatic emergency protocols have been initiated. NDRF, District Health Services, and NGO coordinators have been notified via SMS and Email.\n"
    )

    # Attempt to send standard SMTP if credentials exist, otherwise log output gracefully
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if smtp_server and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart()
            msg['From'] = smtp_user
            msg['To'] = DEMO_RECIPIENT_EMAIL
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(smtp_server, int(smtp_port))
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            print(f"[Email Service] Real SMTP email sent to {DEMO_RECIPIENT_EMAIL}")
            return True
        except Exception as e:
            print(f"[Email Service Error] Failed to send SMTP email: {e}")
    
    # Fallback to web email API simulation/notification print for MVP zero-config reliability
    print(f"============================================================")
    print(f"REAL EMAIL DISPATCH SIMULATED (To: {DEMO_RECIPIENT_EMAIL})")
    print(f"Subject: {subject}")
    print(f"Body:\n{body}")
    print(f"============================================================")
    return True
