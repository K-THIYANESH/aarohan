import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./aarohan.db"
    SECRET_KEY: str = "aarohan_secret_key_super_secure_32bytes_min_length_spec"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "demo.aarohan@gmail.com"
    SMTP_PASSWORD: str = "demo_password"
    SMTP_FROM_EMAIL: str = "demo.aarohan@gmail.com"
    SMTP_FROM_NAME: str = "AAROHAN Alert System"
    TWILIO_ACCOUNT_SID: str = "AC_demo_sid"
    TWILIO_AUTH_TOKEN: str = "demo_auth_token"
    TWILIO_FROM_NUMBER: str = "+15005550006"
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"
    DEMO_COLLECTOR_EMAIL: str = "kavijagannathan638@gmail.com"
    DEMO_NDRF_EMAIL: str = "thiyanesh2603@gmail.com"
    DEMO_NGO_EMAIL: str = "thiyaneshk.cse2025@citchennai.net"
    DEMO_COLLECTOR_PHONE: str = "+919876543210"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
