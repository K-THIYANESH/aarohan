import os
import uuid
import time
import logging
from collections import defaultdict
from fastapi import FastAPI, Request, Response, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, get_db
from app.routers import auth, villages, field_reports, sites, notifications, escalations, audit, rapid, sentinel, strategic_planning, bay_cyclone
from app.utils.exceptions import AarohanException
from scripts.seed import seed_database

# Configure Logging
log_dir = "/var/log/aarohan"
if os.path.exists(log_dir):
    log_file = os.path.join(log_dir, "app.log")
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
        format="[%(asctime)s] [%(levelname)s] [%(name)s] [req_id:%(request_id)s] %(message)s",
        handlers=[logging.FileHandler(log_file), logging.StreamHandler()]
    )
else:
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
        format="[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s"
    )

logger = logging.getLogger("aarohan")

# Validate JWT Secret Key length
if len(settings.SECRET_KEY) < 32:
    raise ValueError("JWT SECRET_KEY must be at least 32 characters long for security compliance.")

# Built-in In-Memory Rate Limiter (100 req/min per IP — no external package required)
_rate_store: dict = defaultdict(list)
_RATE_LIMIT = 100  # requests
_RATE_WINDOW = 60  # seconds

app = FastAPI(
    title="AAROHAN Disaster Relocation Decision Support System",
    description="Near-Production Grade Government Emergency Relocation & Decision API",
    version="4.5.0"
)

@app.middleware("http")
async def rate_limit_and_security(request: Request, call_next):
    # In-memory rate limiting (100 req/min per IP)
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - _RATE_WINDOW
    _rate_store[client_ip] = [t for t in _rate_store[client_ip] if t > window_start]
    if len(_rate_store[client_ip]) >= _RATE_LIMIT:
        return JSONResponse(status_code=429, content={"error": "RATE_LIMIT_EXCEEDED", "message": "Too many requests. Limit: 100/minute."})
    _rate_store[client_ip].append(now)

    req_id = str(uuid.uuid4())
    request.state.request_id = req_id
    start_time = time.time()

    response: Response = await call_next(request)

    duration = (time.time() - start_time) * 1000
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({duration:.2f}ms) [req_id:{req_id}]")

    # Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["X-Request-ID"] = req_id

    return response

# Global Exception Handler
@app.exception_handler(AarohanException)
async def aarohan_exception_handler(request: Request, exc: AarohanException):
    content = {
        "error": exc.error_code,
        "message": exc.message,
        "timestamp": time.time()
    }
    if exc.fields:
        content["fields"] = exc.fields
    return JSONResponse(status_code=exc.status_code, content=content)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled exception [req_id:{req_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected server error occurred. Please contact support.",
            "reference_id": req_id
        }
    )

# CORS Middleware
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://127.0.0.1"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event & Database Health Endpoint
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    seed_database(db)

from sqlalchemy import text

@app.get("/health", tags=["System Health"])
def health_check(db = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected", "timestamp": time.time()}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "database": str(e)})

# Include Domain Routers
app.include_router(auth.router)
app.include_router(villages.router)
app.include_router(field_reports.router)
app.include_router(sites.router)
app.include_router(notifications.router)
app.include_router(escalations.router)
app.include_router(audit.router)
app.include_router(rapid.router)
app.include_router(sentinel.router)
app.include_router(strategic_planning.router)
app.include_router(bay_cyclone.router)
