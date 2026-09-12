# AI HANDOFF — Thuma Mina Deliveries (TMD)

> **Handoff Document for Successor AI Agents**  
> **Current Version:** 0.4.0-arch-update  
> **Date:** 2026-09-12  
> **Git Branch:** main  
> **Authority Level:** Tier 4

---

## 1. Primary Objective

Transition TMD to the approved decoupled stack: **React 19 + Vite Frontend PWA** communicating via **HTTPS / REST API** with a **Python Flask Backend (SQLAlchemy + Alembic)**, deployed on **Render**, with persistence on **PostgreSQL hosted on Neon in Frankfurt (`eu-central-1`)**. The backend serves as the sole, authoritative gatekeeper for database access.

---

## 2. Completed Work & File Manifest

### Architecture v2.0.0 Update (Latest)
- `/docs/SOURCE_OF_TRUTH.md` — Updated in place as the authoritative specification incorporating all expanded business requirements:
  - Flat R38 per 5 km distance-band pricing model with ceiling rounding.
  - Cash on Delivery maximum threshold of R250 (`MAX_CASH_ORDER_CENTS = 25000`) and customer 4-digit PIN verification.
  - Maximum 3 concurrent active orders per driver enforced server-side.
  - Driver shift lifecycle, trip compensation for bounced deliveries, and shift-end cash deposit reconciliation.
  - Vendor monthly billing model based on monthly order counts (completely separated from order transactions; no vendor order payouts).
  - Multi-stage vendor onboarding and verification audit lifecycle.
  - Dual-entity ratings model separating driver performance from vendor food quality.
  - TMD operating hours availability ceiling (Mon–Fri 08:00–18:00, Sat–Sun 08:00–16:30, Public Holidays closed).
  - In-app customer order-support communication stream ("Snapchat section" / order thread).
  - Explicit catalog of 6 Open Decisions (`[OPEN DECISION]`).
- **NO new database migration created or applied.**
- **NO code implementation performed yet.**

### Runtime & Infrastructure Hardening
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

1. **Authoritative Blueprint:** Always consult `/docs/SOURCE_OF_TRUTH.md` v2.0.0 before creating or modifying models, routes, or workflows.
2. **Stack Rule:** Frontend communicates ONLY with Flask REST API via JSON (`Authorization: Bearer <token>`). The browser must NEVER receive `DATABASE_URL` or connect directly to Neon.
3. **Order Rule:** ONE ORDER = ONE VENDOR. No multi-vendor carts in MVP.
4. **Database Provider & Region:** PostgreSQL hosted on **Neon in Frankfurt** (`eu-central-1`). Neon connection is pending deployment verification; do not claim connected until live probe succeeds.
5. **Security & Passwords:** Passwords must be hashed using `werkzeug.security` (pbkdf2:sha256). No plaintext passwords in database or API responses.
6. **Township Addresses:** Section/Block (e.g., "Block L") and Landmark Description (e.g., "opposite church") are required fields in `Address`.
7. **Pricing Invariant:** All prices are stored in positive integer ZAR cents (`price_cents`, `unit_price_cents`, `subtotal_cents`, `delivery_fee_cents`, `total_cents`).
8. **COD Threshold & PIN:** COD restricted to orders $\le$ R250. Handover requires customer 4-digit PIN verification.
9. **Driver Capacity Limit:** Maximum 3 active concurrent orders per driver.
10. **TMD Operating Hours:** Orders blocked outside TMD operating schedule (Mon–Fri 08:00–18:00, Sat–Sun 08:00–16:30, Holidays closed).

---

## 4. Tests Performed & Results

- **Backend Unit Tests:** Executed `backend/tests/test_domain_rules.py` — 6/6 tests passed.
- **Frontend Build:** Verified `compile_applet` and `lint_applet` build cleanly without warnings or errors.
- **Runtime Pinning:** Verified `render.yaml`, `.python-version`, and `runtime.txt` all declare Python 3.12.8.
- **Documentation Verification:** Confirmed `docs/SOURCE_OF_TRUTH.md`, `docs/PROJECT_STATE.md`, `docs/DEV_LOG.md`, and `docs/AI_HANDOFF.md` are synchronized.

---

## 5. Exact Recommended Next Action for Successor AI

1. **Verify Render Backend Deployment:** Confirm that the Render backend starts cleanly with Python 3.12.8 without the SQLAlchemy `firstlineno` crash.
2. **Verify Neon Connectivity:** Once the service starts, verify that `preDeployCommand: flask db upgrade` succeeds and `GET /api/health` returns HTTP 200 with `database.connected: true`.
3. **Resolve Open Decisions:** Before running Alembic migrations for candidate models (shifts, billings, ratings, refunds), obtain confirmation on the 6 `[OPEN DECISION]` items in `docs/SOURCE_OF_TRUTH.md`.
4. **Do NOT start Phase 3** until the live connection to Neon Frankfurt is verified and the migration plan is approved.
5. Once verified, proceed to:
   - Alembic migration for model extensions and candidate entities.
   - Order Lifecycle State Machine REST API (`/api/orders`).
   - Driver Dispatching & Fulfillment API (`/api/deliveries`).

