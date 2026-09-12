# AI HANDOFF — Thuma Mina Deliveries (TMD)

> **Handoff Document for Successor AI Agents**  
> **Current Version:** 0.3.1-deploy-fix  
> **Date:** 2026-09-12  
> **Git Branch:** main  
> **Authority Level:** Tier 4

---

## 1. Primary Objective

Transition TMD to the approved decoupled stack: **React 19 + Vite Frontend PWA** communicating via **HTTPS / REST API** with a **Python Flask Backend (SQLAlchemy + Alembic)**, deployed on **Render**, with persistence on **PostgreSQL hosted on Neon in Frankfurt (`eu-central-1`)**. The backend serves as the sole, authoritative gatekeeper for database access.

---

## 2. Completed Work & File Manifest

### Runtime & Infrastructure Hardening (Latest)
- `backend/.python-version` & `/.python-version` — Pinned Python runtime to `3.12.8` to fix Render default Python 3.14.3 crash (`TypeError: Can't replace canonical symbol for 'firstlineno'` during SQLAlchemy import).
- `backend/runtime.txt` & `/runtime.txt` — Added `python-3.12.8` for buildpack compatibility.
- `render.yaml` — Pinned `PYTHON_VERSION: 3.12.8` under `thuma-mina-backend` web service.
- Preserved exact backend commands:
  - Root Directory: `backend`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `gunicorn --bind 0.0.0.0:$PORT run:app`

### Phase 2 Implementations
- `/backend/app/utils/decorators.py` — `@role_required(*roles)`, `@admin_required`, `@vendor_or_admin_required`, `@driver_or_admin_required`, regex email and password strength validation helpers.
- `/backend/app/routes/auth.py` — Complete JWT authentication endpoints with admin self-registration protection.
- `/backend/app/routes/addresses.py` — Soshanguve Delivery Address management API.
- `/backend/app/routes/vendors.py` — Vendor Catalog & Menu API.
- `/src/services/api.ts` — Frontend typed API client with production-disabled simulation fallback.
- `/src/components/SecurityTab.tsx` — Interactive Auth & JWT Console, Token Claims Inspector, and Soshanguve Address Manager.
- `/backend/tests/test_domain_rules.py` — Automated test suite with 6 passing domain validation tests.

---

## 3. Architecture & Data Invariants

1. **Stack Rule:** Frontend communicates ONLY with Flask REST API via JSON (`Authorization: Bearer <token>`). The browser must NEVER receive `DATABASE_URL` or connect directly to Neon.
2. **Order Rule:** ONE ORDER = ONE VENDOR. No multi-vendor carts in MVP.
3. **Database Provider & Region:** PostgreSQL hosted on **Neon in Frankfurt** (`eu-central-1`). Neon connection is pending deployment verification; do not claim connected until live probe succeeds.
4. **Security & Passwords:** Passwords must be hashed using `werkzeug.security` (pbkdf2:sha256). No plaintext passwords in database or API responses.
5. **Small Fleet Reality:** TMD operates with 2 drivers in Soshanguve. No live GPS telemetry, algorithmic dispatch, or background battery drains in MVP.
6. **Township Addresses:** Section/Block (e.g., "Block L") and Landmark Description (e.g., "opposite church") are required fields in `Address`.
7. **Pricing Invariant:** All prices are stored in positive integer ZAR cents (`price_cents`, `unit_price_cents`, `subtotal_cents`, `delivery_fee_cents`, `total_cents`).

---

## 4. Tests Performed & Results

- **Backend Unit Tests:** Executed `backend/tests/test_domain_rules.py` — 6/6 tests passed (0.081s).
- **Frontend Build:** Verified `compile_applet` and `lint_applet` build cleanly without warnings or errors.
- **Runtime Pinning:** Verified `render.yaml`, `.python-version`, and `runtime.txt` all declare Python 3.12.8.
- **Security Check:** Verified no hardcoded database credentials or JWT secrets exist in repository code or configuration.

---

## 5. Exact Recommended Next Action for Successor AI

1. **Verify Render Backend Deployment:** Confirm that the Render backend starts cleanly with Python 3.12.8 without the SQLAlchemy `firstlineno` crash.
2. **Verify Neon Connectivity:** Once the service starts, verify that `preDeployCommand: flask db upgrade` succeeds and `GET /api/health` returns HTTP 200 with `database.connected: true`.
3. **Do NOT start Phase 3** until the live connection to Neon Frankfurt is verified.
4. Once verified, proceed to **Phase 3**:
   - Order Lifecycle State Machine REST API (`/api/orders`)
   - Driver Dispatching & Fulfillment API (`/api/deliveries`)
