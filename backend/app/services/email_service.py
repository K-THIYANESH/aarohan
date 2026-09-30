import os
import smtplib
import logging
from email.message import EmailMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, message: str, html_content: str = None) -> bool:
    """
    Sends an email using Gmail SMTP via SSL on port 465.

    :param to_email: Recipient email address
    :param subject: Email subject line
    :param message: Plain text body of the email
    :param html_content: Optional HTML body content
    :return: True if the email was sent successfully, False otherwise
    """
    email_user = os.getenv("EMAIL_USER") or os.getenv("SMTP_USER")
    email_password = os.getenv("EMAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")

    if not email_user or not email_password:
        logger.error("Missing EMAIL_USER or EMAIL_PASSWORD environment variables.")
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = email_user
    msg["To"] = to_email
    msg.set_content(message)
    if html_content:
        msg.add_alternative(html_content, subtype="html")

    try:
        logger.info(f"Connecting to SSL SMTP server to send email to {to_email}...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(email_user, email_password)
            server.send_message(msg)
        logger.info(f"Email successfully dispatched to {to_email}.")
        return True
    except smtplib.SMTPException as exc:
        logger.error(f"SMTP error occurred while sending email to {to_email}: {exc}")
        return False
    except Exception as exc:
        logger.error(f"Unexpected error while sending email to {to_email}: {exc}")
        return False

def get_circle1_email_html(village_name: str, tier: str, families: int, field_summary: str, recommendation: str) -> str:
    return f"<h2>AAROHAN Circle 1 Alert — {village_name}</h2><p>Tier: {tier}</p><p>Families: {families}</p><p>{field_summary}</p><p>{recommendation}</p>"

def get_circle2_email_html(village_name: str, coords: str, population: int, road_access: str) -> str:
    return f"<h2>AAROHAN Circle 2 Alert — {village_name}</h2><p>Coords: {coords}</p><p>Population: {population}</p><p>Access: {road_access}</p>"

def get_circle3_email_html(village_name: str, details: str) -> str:
    return f"<h2>AAROHAN Circle 3 Advisory — {village_name}</h2><p>{details}</p>"

def get_rapid_email_html(incident_name: str, location: str, details: str) -> str:
    return f"<h2>🚨 AAROHAN RAPID EMERGENCY — {incident_name}</h2><p>Location: {location}</p><p>{details}</p>"
