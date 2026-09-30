"""
Aarohan Flask Backend v2 - pbkdf2 auth, exact DB schema match.
"""
import os, logging, enum
from datetime import datetime, timedelta, timezone, date
from functools import wraps

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip())
load_env()

SECRET_KEY = os.environ.get("SECRET_KEY", "aarohan_secret_key_super_secure_32bytes_min_length_spec")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
TOKEN_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, Date
from sqlalchemy.orm import declarative_base, sessionmaker
from passlib.context import CryptContext
from jose import jwt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aarohan")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "aarohan.db")
engine = create_engine(f"sqlite:///{DB_FILE}", connect_args={"check_same_thread": False})
Sess = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Use pbkdf2_sha256 - bcrypt is broken in this conda env
pwd = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String(15))
    district = Column(String)
    state = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True))
    last_login = Column(DateTime(timezone=True))

class Village(Base):
    __tablename__ = "villages"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    district = Column(String)
    state = Column(String)
    danger_level = Column(String(15))
    risk_label = Column(String)
    ai_tier = Column(String)
    families_affected = Column(Integer)
    hazard_score = Column(Float)
    assigned_officer = Column(String)
    visit_status = Column(String(16))
    current_stage_index = Column(Integer, default=0)
    stage_entered_at = Column(DateTime(timezone=True))
    is_escalated = Column(Boolean, default=False)
    escalation_reason = Column(Text)

class FieldReport(Base):
    __tablename__ = "field_reports"
    id = Column(Integer, primary_key=True)
    village_id = Column(Integer, ForeignKey("villages.id"))
    submitted_by = Column(String)
    submitted_at = Column(DateTime(timezone=True))
    visit_date = Column(Date)
    gps_coordinates = Column(String)
    actual_families_count = Column(Integer)
    houses_in_risk_zone = Column(Integer)
    landslide_signs_observed = Column(Boolean, default=False)
    cracks_in_ground_observed = Column(Boolean, default=False)
    water_logging_observed = Column(Boolean, default=False)
    slope_erosion_visible = Column(Boolean, default=False)
    road_condition = Column(String(17))
    community_willing_to_relocate = Column(String(9))
    nearest_safe_structure_distance_km = Column(Float)
    field_officer_recommendation = Column(String(20))
    observations = Column(Text)
    photo_count = Column(Integer, default=0)
    is_offline_synced = Column(Boolean, default=True)

class CompensationClaim(Base):
    __tablename__ = "compensation_claims"
    id = Column(Integer, primary_key=True)
    village_id = Column(Integer, ForeignKey("villages.id"))
    applicant_name = Column(String(200))
    applicant_phone = Column(String(20))
    applicant_email = Column(String(200))
    damage_type = Column(String(100))
    damage_description = Column(Text)
    estimated_loss_inr = Column(Float)
    approved_amount_inr = Column(Float)
    status = Column(String(12), default="SUBMITTED")
    submitted_at = Column(DateTime(timezone=True))
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(String(200))
    remarks = Column(Text)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime(timezone=True))
    role = Column(String(50))
    village_or_site = Column(String(200))
    action = Column(Text)
    performed_by = Column(String(200))

Base.metadata.create_all(bind=engine, checkfirst=True)

ACCOUNTS = {
    "anoop.kumar@aarohan.gov.in": {"name": "Field Officer Anoop Kumar", "password": "FieldOfficer@123", "role": "FIELD_OFFICER", "district": "Wayanad", "state": "Kerala"},
    "priya.nair@aarohan.gov.in": {"name": "Field Officer Priya Nair", "password": "FieldOfficer@123", "role": "FIELD_OFFICER", "district": "Wayanad", "state": "Kerala"},
    "revenue.wayanad@aarohan.gov.in": {"name": "District Revenue Officer", "password": "RevenueOfficer@123", "role": "REVENUE_OFFICER", "district": "Wayanad", "state": "Kerala"},
    "disaster.control@aarohan.gov.in": {"name": "Disaster Management Control Officer", "password": "DisasterOfficer@123", "role": "REVENUE_OFFICER", "district": "Bay of Bengal & Coastal APAC Cell", "state": "National Disaster Authority"},
}

def seed():
    db = Sess()
    try:
        for email, info in ACCOUNTS.items():
            existing = db.query(User).filter(User.email == email).first()
            new_hash = pwd.hash(info["password"])
            if not existing:
                db.add(User(name=info["name"], email=email, hashed_password=new_hash, role=info["role"], district=info["district"], state=info["state"], is_active=True, created_at=datetime.now(timezone.utc)))
                logger.info(f"Created user: {email}")
            else:
                # Re-hash with pbkdf2 (migrate from broken bcrypt)
                if not existing.hashed_password.startswith("$pbkdf2"):
                    existing.hashed_password = new_hash
                    logger.info(f"Migrated password hash for: {email}")
        db.commit()
        logger.info("Seed complete")
    except Exception as e:
        db.rollback()
        logger.error(f"Seed error: {e}")
    finally:
        db.close()

seed()

def make_token(data):
    d = data.copy()
    d["exp"] = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_MINUTES)
    return jwt.encode(d, SECRET_KEY, algorithm=ALGORITHM)

def get_bearer():
    a = request.headers.get("Authorization", "")
    return a[7:] if a.startswith("Bearer ") else None

def auth_req(f):
    @wraps(f)
    def wrap(*args, **kw):
        token = get_bearer()
        if not token:
            return jsonify({"detail": "Not authenticated"}), 401
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            uid = int(payload["sub"])
        except Exception:
            return jsonify({"detail": "Invalid token"}), 401
        db = Sess()
        try:
            user = db.query(User).filter(User.id == uid).first()
            if not user or not user.is_active:
                return jsonify({"detail": "User not found"}), 401
            return f(*args, current_user=user, db=db, **kw)
        finally:
            db.close()
    return wrap

def udict(u): return {"id": u.id, "name": u.name, "email": u.email, "role": u.role, "district": u.district, "state": u.state, "is_active": u.is_active, "last_login": u.last_login.isoformat() if u.last_login else None}
def vdict(v): return {"id": v.id, "name": v.name, "district": v.district, "state": v.state, "danger_level": v.danger_level, "risk_label": v.risk_label, "ai_tier": v.ai_tier, "families_affected": v.families_affected, "hazard_score": v.hazard_score, "assigned_officer": v.assigned_officer, "visit_status": v.visit_status, "current_stage_index": v.current_stage_index, "is_escalated": v.is_escalated}
def rdict(r): return {"id": r.id, "village_id": r.village_id, "submitted_by": r.submitted_by, "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None, "visit_date": r.visit_date.isoformat() if r.visit_date else None, "observations": r.observations, "field_officer_recommendation": r.field_officer_recommendation, "actual_families_count": r.actual_families_count, "houses_in_risk_zone": r.houses_in_risk_zone, "landslide_signs_observed": r.landslide_signs_observed, "road_condition": r.road_condition, "photo_count": r.photo_count}
def cdict(c): return {"id": c.id, "village_id": c.village_id, "applicant_name": c.applicant_name, "damage_type": c.damage_type, "estimated_loss_inr": c.estimated_loss_inr, "approved_amount_inr": c.approved_amount_inr, "status": c.status, "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None, "reviewed_by": c.reviewed_by, "remarks": c.remarks}

@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not email or not password:
        return jsonify({"detail": "Email and password required"}), 400
    db = Sess()
    try:
        user = db.query(User).filter(User.email == email).first()
        # Auto-heal: create official account if missing
        if not user and email in ACCOUNTS:
            info = ACCOUNTS[email]
            if password == info["password"]:
                user = User(name=info["name"], email=email, hashed_password=pwd.hash(info["password"]), role=info["role"], district=info["district"], state=info["state"], is_active=True, created_at=datetime.now(timezone.utc))
                db.add(user)
                db.commit()
                db.refresh(user)
        # Also check if password matches official accounts directly (bypass broken bcrypt)
        if user and email in ACCOUNTS and not user.hashed_password.startswith("$pbkdf2"):
            info = ACCOUNTS[email]
            if password == info["password"]:
                user.hashed_password = pwd.hash(password)
                db.commit()
        if not user:
            return jsonify({"detail": "Invalid email or password"}), 401
        try:
            ok = pwd.verify(password, user.hashed_password)
        except Exception:
            # Fallback: check against known plaintext for official accounts
            if email in ACCOUNTS and password == ACCOUNTS[email]["password"]:
                ok = True
                user.hashed_password = pwd.hash(password)
                db.commit()
            else:
                ok = False
        if not ok:
            return jsonify({"detail": "Invalid email or password"}), 401
        if not user.is_active:
            return jsonify({"detail": "Account inactive"}), 401
        token = make_token({"sub": str(user.id), "role": user.role, "email": user.email})
        user.last_login = datetime.now(timezone.utc)
        try:
            db.add(AuditLog(timestamp=datetime.now(timezone.utc), role=user.role, village_or_site="System Auth", action=f"User {user.name} logged in", performed_by=user.name))
            db.commit()
        except Exception:
            db.rollback()
        return jsonify({"access_token": token, "token_type": "bearer", "user": udict(user)}), 200
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        return jsonify({"detail": f"Authentication error: {str(e)}"}), 500
    finally:
        db.close()

@app.route("/auth/logout", methods=["POST"])
@auth_req
def logout(current_user, db):
    try:
        db.add(AuditLog(timestamp=datetime.now(timezone.utc), role=current_user.role, village_or_site="System Auth", action=f"User {current_user.name} logged out", performed_by=current_user.name))
        db.commit()
    except Exception:
        db.rollback()
    return jsonify({"message": "Logged out"}), 200

@app.route("/auth/me", methods=["GET"])
@auth_req
def me(current_user, db):
    return jsonify(udict(current_user)), 200

@app.route("/field/villages", methods=["GET"])
@auth_req
def field_villages(current_user, db):
    return jsonify([vdict(v) for v in db.query(Village).all()]), 200

@app.route("/field/villages/<int:vid>", methods=["GET"])
@auth_req
def field_village(vid, current_user, db):
    v = db.query(Village).filter(Village.id == vid).first()
    return (jsonify(vdict(v)), 200) if v else (jsonify({"detail": "Not found"}), 404)

@app.route("/field/reports", methods=["GET"])
@auth_req
def get_reports(current_user, db):
    return jsonify([rdict(r) for r in db.query(FieldReport).order_by(FieldReport.submitted_at.desc()).limit(50).all()]), 200

@app.route("/field/reports", methods=["POST"])
@auth_req
def submit_report(current_user, db):
    data = request.get_json(silent=True) or {}
    vid = data.get("village_id")
    v = db.query(Village).filter(Village.id == vid).first()
    if not v: return jsonify({"detail": "Village not found"}), 404
    vdate = date.today()
    if data.get("visit_date"):
        try: vdate = date.fromisoformat(data["visit_date"])
        except: pass
    r = FieldReport(village_id=vid, submitted_by=data.get("submitted_by", current_user.name), submitted_at=datetime.now(timezone.utc), visit_date=vdate, gps_coordinates=data.get("gps_coordinates"), actual_families_count=data.get("actual_families_count"), houses_in_risk_zone=data.get("houses_in_risk_zone"), landslide_signs_observed=bool(data.get("landslide_signs_observed")), cracks_in_ground_observed=bool(data.get("cracks_in_ground_observed")), water_logging_observed=bool(data.get("water_logging_observed")), slope_erosion_visible=bool(data.get("slope_erosion_visible")), road_condition=data.get("road_condition"), community_willing_to_relocate=str(data.get("community_willing_to_relocate", False)), nearest_safe_structure_distance_km=data.get("nearest_safe_structure_distance_km"), field_officer_recommendation=data.get("field_officer_recommendation"), observations=data.get("observations"), photo_count=data.get("photo_count", 0), is_offline_synced=bool(data.get("is_offline_synced", True)))
    db.add(r)
    v.visit_status = "REPORT_SUBMITTED"
    if v.current_stage_index < 3: v.current_stage_index = 3
    db.commit()
    db.refresh(r)
    return jsonify(rdict(r)), 201

@app.route("/revenue/villages", methods=["GET"])
@auth_req
def rev_villages(current_user, db):
    return jsonify([vdict(v) for v in db.query(Village).all()]), 200

@app.route("/revenue/villages/<int:vid>", methods=["GET", "PUT", "PATCH"])
@auth_req
def rev_village(vid, current_user, db):
    v = db.query(Village).filter(Village.id == vid).first()
    if not v: return jsonify({"detail": "Not found"}), 404
    if request.method in ("PUT", "PATCH"):
        data = request.get_json(silent=True) or {}
        for f in ["visit_status", "current_stage_index", "assigned_officer", "danger_level"]:
            if f in data: setattr(v, f, data[f])
        db.commit(); db.refresh(v)
    return jsonify(vdict(v)), 200

@app.route("/revenue/claims", methods=["GET"])
@auth_req
def rev_claims(current_user, db):
    return jsonify([cdict(c) for c in db.query(CompensationClaim).order_by(CompensationClaim.submitted_at.desc()).all()]), 200

@app.route("/revenue/claims", methods=["POST"])
@auth_req
def submit_claim(current_user, db):
    data = request.get_json(silent=True) or {}
    c = CompensationClaim(village_id=data.get("village_id"), applicant_name=data.get("applicant_name"), applicant_phone=data.get("applicant_phone"), applicant_email=data.get("applicant_email"), damage_type=data.get("damage_type"), damage_description=data.get("damage_description"), estimated_loss_inr=data.get("estimated_loss_inr"), status="SUBMITTED", submitted_at=datetime.now(timezone.utc))
    db.add(c); db.commit(); db.refresh(c)
    return jsonify(cdict(c)), 201

@app.route("/revenue/claims/<int:cid>", methods=["PUT", "PATCH"])
@auth_req
def update_claim(cid, current_user, db):
    c = db.query(CompensationClaim).filter(CompensationClaim.id == cid).first()
    if not c: return jsonify({"detail": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    for f in ["status", "approved_amount_inr", "remarks"]:
        if f in data: setattr(c, f, data[f])
    c.reviewed_at = datetime.now(timezone.utc); c.reviewed_by = current_user.name
    db.commit(); db.refresh(c)
    return jsonify(cdict(c)), 200

@app.route("/audit/logs", methods=["GET"])
@auth_req
def audit_logs(current_user, db):
    rows = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return jsonify([{"id": l.id, "timestamp": l.timestamp.isoformat() if l.timestamp else None, "role": l.role, "village_or_site": l.village_or_site, "action": l.action, "performed_by": l.performed_by} for l in rows]), 200

@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Aarohan Flask Backend v2.0 - pbkdf2 auth", "status": "ok"}), 200

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200

@app.errorhandler(404)
def not_found(e): return jsonify({"detail": "Not found"}), 404

@app.errorhandler(500)
def server_err(e): return jsonify({"detail": "Internal server error"}), 500

if __name__ == "__main__":
    logger.info("Starting Aarohan Flask Backend on port 8008")
    app.run(host="0.0.0.0", port=8008, debug=False, use_reloader=False)
