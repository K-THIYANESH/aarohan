# AAROHAN - National Disaster Relocation Decision Support System

AAROHAN (आरोहण) is an integrated decision support platform empowering District Collectors, Revenue Officers, and Field Inspectors to execute data-backed landslide, flood, and coastal disaster relocations across India.

---

## 🏗 System Architecture

The repository is structured as a full-stack web application:

- **Frontend (`/frontend`)**: React 19 + Vite + Tailwind CSS + Lucide Icons + React-Leaflet
- **Backend (`/backend`)**: FastAPI + SQLAlchemy + SQLite / PostgreSQL + Pydantic v2
- **Audit & Governance**: Built-in audit trail logging and multi-role access control (Field Officer, Revenue Officer, Disaster Control Officer)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ 
- **Python**: 3.10+

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the web dashboard at: `http://localhost:3000`

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --port 8008 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8008/docs`

---

## 🔐 Built-in Role Bypass & Demo Logins
For rapid evaluation without running the backend server, the frontend includes single-click instant portal bypass buttons:
- **Field Inspector**: Ground Verification & Evidence Submission Portal
- **Revenue Officer**: Forest & Land Legal Title Clearance Portal
- **Disaster Control Officer**: Strategic AI Risk & Bay of Bengal APAC Hub
