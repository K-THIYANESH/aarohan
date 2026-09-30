import os
import logging
from typing import Dict, Any
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

def send_sms(phone_number: str, message: str) -> Dict[str, Any]:
    """
    Sends an SMS message using the TextBee REST API.

    :param phone_number: Target recipient phone number
    :param message: SMS body content
    :return: Response JSON dictionary from TextBee API or error payload dictionary
    """
    api_key = os.getenv("TEXTBEE_API_KEY")
    device_id = os.getenv("TEXTBEE_DEVICE_ID")
    endpoint = os.getenv("TEXTBEE_SEND_SMS_ENDPOINT")

    if not api_key:
        logger.error("Missing TEXTBEE_API_KEY environment variable.")
        return {"success": False, "error": "Missing TEXTBEE_API_KEY configuration."}

    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }

    # Automatically resolve active device ID if not provided explicitly
    if not device_id or not endpoint:
        try:
            dev_res = requests.get("https://api.textbee.dev/api/v1/gateway/devices", headers=headers, timeout=5)
            dev_data = dev_res.json().get("data", [])
            if dev_data:
                device_id = dev_data[0].get("_id")
        except Exception as dev_err:
            logger.warning(f"Could not auto-fetch TextBee device ID: {dev_err}")

    final_endpoint = endpoint if endpoint else f"https://api.textbee.dev/api/v1/gateway/devices/{device_id}/send-sms" if device_id else "https://api.textbee.dev/api/v1/gateway/devices/send-sms"

    payload = {
        "recipients": [phone_number],
        "message": message
    }

    try:
        logger.info(f"Sending SMS to {phone_number} via TextBee API ({final_endpoint})...")
        response = requests.post(final_endpoint, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        res_data = response.json()
        logger.info(f"SMS successfully dispatched to {phone_number}.")
        return res_data
    except requests.exceptions.RequestException as exc:
        logger.error(f"HTTP request exception occurred while sending SMS to {phone_number}: {exc}")
        return {
            "success": False,
            "error": str(exc),
            "status_code": getattr(exc.response, "status_code", None)
        }
def send_whatsapp(phone_number: str, message: str) -> Dict[str, Any]:
    """
    Sends a WhatsApp notification message (delegates to send_sms or messaging gateway).

    :param phone_number: Recipient phone number
    :param message: WhatsApp message text
    :return: Response status dictionary
    """
    logger.info(f"Dispatching WhatsApp notification to {phone_number}...")
    return send_sms(phone_number, f"[WhatsApp Alert] {message}")
