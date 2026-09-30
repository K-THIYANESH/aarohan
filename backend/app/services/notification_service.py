import logging
from typing import Union, Dict, Any, Optional
from app.services.email_service import send_email
from app.services.sms_service import send_sms

logger = logging.getLogger(__name__)

def notify(channel: str, recipient: str, message: str, subject: Optional[str] = None) -> Union[bool, Dict[str, Any]]:
    """
    Unified entry point for sending multi-channel notifications in AAROHAN.

    :param channel: Communication channel, either 'email' or 'sms' (case-insensitive)
    :param recipient: Recipient address (email string or phone number string)
    :param message: Main message content body
    :param subject: Email subject line (used when channel is 'email')
    :return: Boolean status for email, or Dict response object for SMS
    :raises ValueError: If an unsupported notification channel is specified
    """
    normalized_channel = channel.strip().lower()

    if normalized_channel == "email":
        email_subject = subject or "AAROHAN Emergency Alert Notification"
        return send_email(to_email=recipient, subject=email_subject, message=message)
    elif normalized_channel == "sms":
        return send_sms(phone_number=recipient, message=message)
    else:
        error_msg = f"Unsupported notification channel '{channel}'. Valid channels are 'email' or 'sms'."
        logger.error(error_msg)
        raise ValueError(error_msg)
