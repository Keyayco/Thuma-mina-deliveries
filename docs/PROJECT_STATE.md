# PROJECT STATE — Thuma Mina Deliveries (TMD)

> **Save State Snapshot**  
> **Timestamp:** 2026-09-12T13:00:00Z  
> **Current Version:** 0.3.1-deploy-fix  
> **Authority Level:** Tier 3

---

## 1. Project Health & Snapshot

- **Current Phase:** Phase 2 Complete — Deployment & Runtime Compatibility Hardening
- **Current Version:** 0.3.1-deploy-fix
- **Active Blockers:** Awaiting redeploy under pinned Python 3.12.8 to verify Neon Frankfurt database connection.
- **Frontend Status:** Operational React 19 + Tailwind CSS application at root `/src`. Interactive Auth Console, JWT Token Inspector, and Soshanguve Address Manager integrated into Security Tab. Configured with typed API client (`src/services/api.ts`).
- **Backend Status:** Python Flask REST API operational in `backend/app` with application factory pattern (`create_app()`), CORS, SQLAlchemy ORM models (11 entities), Alembic migration configuration, complete JWT authentication endpoints (`/api/auth/*`), address management routes (`/api/users/addresses`), vendor catalog routes (`/api/vendors`), and `/api/health` endpoint.
- **Database / Neon Status:** PostgreSQL hosted on Neon in Frankfurt region (`eu-central-1`). SQLAlchemy declarative models and initial Alembic migration `001_initial_schema.py` ready. **Note: Neon database is not yet claimed as connected; live connection awaits redeployment under Python 3.12.8.**
- **Authentication Status:** Full JWT architecture implemented (Flask-JWT-Extended + Werkzeug pbkdf2:sha256 password hashing). Custom decorators `@role_required`, `@admin_required`, `@vendor_or_admin_required`, `@driver_or_admin_required` enforcing RBAC for `customer`, `vendor`, `driver`, and `admin`. Public admin self-assignment explicitly blocked (HTTP 403).
- **Deployment Status:** Backend runtime pinned to Python 3.12.8 via `render.yaml`, `backend/.python-version`, `/.python-version`, and `runtime.txt`. Resolves Python 3.14.3 SQLAlchemy 2.0.30 incompatibility (`TypeError: Can't replace canonical symbol for 'firstlineno'`). Configured with Gunicorn start command (`gunicorn --bind 0.0.0.0:$PORT run:app`), build command (`pip install -r requirements.txt`), and root directory (`backend`).
- **Testing Status:** Clean frontend compilation via Vite (`compile_applet` and `lint_applet`); 6 domain validation unit tests passing in `backend/tests/test_domain_rules.py`.

---

## 2. Work Summary

### Completed Work
- [x] Comprehensive business and operational analysis for Thuma Mina Deliveries in Soshanguve.
- [x] Architecture formally synchronized to React + Flask REST API + SQLAlchemy + Neon Frankfurt (ADR-005).
- [x] Supabase architecture explicitly superseded in `docs/SOURCE_OF_TRUTH.md`.
- [x] Backend directory structure created (`backend/app/`, `backend/migrations/`, `backend/requirements.txt`, `backend/run.py`).
- [x] SQLAlchemy models implemented for all 11 core entities matching business rules (`User/Profile`, `Address`, `Vendor`, `VendorMember`, `MenuCategory`, `MenuItem`, `Driver`, `Order`, `OrderItem`, `OrderStatusHistory`, `Delivery`, `Payment`).
- [x] Invariant rule enforced: ONE ORDER = ONE VENDOR (single vendor per order).
- [x] Alembic migration environment initialized with `001_initial_schema.py`.
- [x] Application factory (`create_app`) with CORS, JWT, error callbacks, and `/api/health` created.
- [x] Render Blueprint (`render.yaml`) updated to define both Flask backend web service and static frontend site.
- [x] Full JWT Authentication implemented (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/profile`, `/api/auth/change-password`, `/api/auth/verify`).
- [x] Role-Based Access Control decorators implemented (`@role_required`, `@admin_required`, `@vendor_or_admin_required`, `@driver_or_admin_required`).
- [x] Soshanguve Delivery Address management API implemented (`/api/users/addresses`) with mandatory township block and landmark description validation.
- [x] Vendor Catalog and categorized menu REST API implemented (`/api/vendors`).
- [x] Frontend typed API client service created (`src/services/api.ts`) with Bearer token injection and simulation fallback.
- [x] Interactive Auth Console, JWT Token Inspector, and Soshanguve Address Manager integrated into UI (`src/components/SecurityTab.tsx`).
- [x] Domain validation test suite implemented (`backend/tests/test_domain_rules.py`) with 6 passing tests.
- [x] Pinned backend Python runtime to stable Python 3.12.8 in `render.yaml`, `backend/.python-version`, `/.python-version`, `backend/runtime.txt`, and `/runtime.txt`.
- [x] Synchronized 4-tier documentation suite (`SOURCE_OF_TRUTH.md`, `PROJECT_STATE.md`, `AI_HANDOFF.md`, `DEV_LOG.md`).

### Current Work
- Runtime compatibility fix applied; awaiting Render redeploy to reach Neon database connection stage.
- **Phase 3 NOT started.**

### Next Task
- Verify Render deployment startup under Python 3.12.8 and execute initial Alembic migration against Neon Frankfurt.
- Once database connection is proven live, proceed to Phase 3: Order Lifecycle State Machine, Single-Vendor Cart Enforcement, and Driver Dispatching REST APIs.

---

## 3. Subsystem Status Matrix

| Subsystem | Status | Notes |
| :--- | :--- | :--- |
| **Documentation** | Completed | 4-tier documentation synchronized to Flask + Neon Frankfurt stack with REST API specs. |
| **Database Models** | Implemented | 11 SQLAlchemy models + 6 custom enums implemented in `backend/app/models/`. |
| **Migration System** | Initialized | Alembic setup with `001_initial_schema.py` ready for Neon connection. |
| **Backend API** | Operational | Flask app factory, health check, CORS, auth, addresses, and vendor routes in `backend/app/`. |
| **Auth System** | Operational | Full JWT authentication with password hashing, role claims, and `@role_required` decorators. |
| **Address Subsystem**| Operational | Township block and mandatory landmark description validation enforced. |
| **Frontend Client** | Operational | React 19 + Tailwind CSS 4 dashboard with typed API client and interactive Auth Console. |
| **Hosting Config** | Pinned (3.12.8) | `render.yaml`, `.python-version`, and `runtime.txt` pin Python 3.12.8 for Gunicorn backend. |

---

## 4. Environment Variables Checklist

- [x] `DATABASE_URL`: Set in `.env.example` (Awaiting live user Neon Frankfurt connection string)
- [x] `SECRET_KEY`: Documented in `.env.example`
- [x] `JWT_SECRET_KEY`: Documented in `.env.example`
- [x] `VITE_API_URL`: Configured for client-side API routing
