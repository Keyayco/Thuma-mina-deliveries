# AI HANDOFF — Thuma Mina Deliveries (TMD)

> **Handoff Document for Successor AI Agents**  
> **Current Version:** 0.3.0-phase2  
> **Date:** 2026-09-06  
> **Git Branch:** main  
> **Authority Level:** Tier 4

---

## 1. Primary Objective

Transition TMD to the approved decoupled stack: **React 19 + Vite Frontend PWA** communicating via **HTTPS / REST API** with a **Python Flask Backend (SQLAlchemy + Alembic)**, deployed on **Render**, with persistence on **PostgreSQL hosted on Neon in Frankfurt (`eu-central-1`)**. The backend serves as the sole, authoritative gatekeeper for database access.

---

## 2. Completed Work & File Manifest

### Phase 2 Implementations
- `/backend/app/utils/decorators.py` — `@role_required(*roles)`, `@admin_required`, `@vendor_or_admin_required`, `@driver_or_admin_required`, regex email and password strength validation helpers.
- `/backend/app/routes/auth.py` — Complete JWT authentication endpoints:
  - `POST /api/auth/register` (creates user, validates fields, hashes password with PBKDF2:SHA256, auto-creates driver profile if role is driver).
  - `POST /api/auth/login` (verifies credentials, returns signed JWT access token).
  - `GET /api/auth/me` (returns user profile with addresses, vendor memberships, or driver profile).
  - `PUT /api/auth/profile` (updates full name, phone number).
  - `PUT /api/auth/change-password` (verifies existing password and updates hash).
  - `POST /api/auth/verify` (validates active token claims).
- `/backend/app/routes/addresses.py` — Soshanguve Delivery Address management API:
  - `GET /api/users/addresses` (lists addresses).
  - `POST /api/users/addresses` (enforces township block and mandatory landmark description).
  - `PUT /api/users/addresses/<id>` (updates address with ownership check).
  - `DELETE /api/users/addresses/<id>` (deletes address with default promotion fallback).
  - `PATCH /api/users/addresses/<id>/default` (sets default address).
- `/backend/app/routes/vendors.py` — Vendor Catalog & Menu API:
  - `GET /api/vendors` (lists active vendors, with block and is_open filters).
  - `GET /api/vendors/<id_or_slug>` (retrieves vendor details and categories).
  - `GET /api/vendors/<id_or_slug>/menu` (categorized menu items with prices in integer cents).
  - `POST /api/vendors` & `POST /api/vendors/<id>/items` (protected vendor mutation routes).
- `/src/services/api.ts` — Frontend typed API client with localStorage Bearer token injection and resilient simulation fallback.
- `/src/components/SecurityTab.tsx` — Enhanced with an interactive Auth & JWT Console, Token Claims Inspector, and Soshanguve Address Manager.
- `/backend/tests/test_domain_rules.py` — Automated test suite verifying password hashing, email regex, integer cents math, single-vendor order invariant, and township address landmark requirements.

---

## 3. Architecture & Data Invariants

1. **Stack Rule:** Frontend communicates ONLY with Flask REST API via JSON (`Authorization: Bearer <token>`). The browser must NEVER receive `DATABASE_URL` or connect directly to Neon.
2. **Order Rule:** ONE ORDER = ONE VENDOR. No multi-vendor carts in MVP.
3. **Database Provider & Region:** PostgreSQL hosted on **Neon in Frankfurt** (`eu-central-1`).
4. **Security & Passwords:** Passwords must be hashed using `werkzeug.security` (pbkdf2:sha256). No plaintext passwords in database or API responses.
5. **Small Fleet Reality:** TMD operates with 2 drivers in Soshanguve. No live GPS telemetry, algorithmic dispatch, or background battery drains in MVP.
6. **Township Addresses:** Section/Block (e.g., "Block L") and Landmark Description (e.g., "opposite church") are required fields in `Address`.
7. **Pricing Invariant:** All prices are stored in positive integer ZAR cents (`price_cents`, `unit_price_cents`, `subtotal_cents`, `delivery_fee_cents`, `total_cents`).

---

## 4. Tests Performed & Results

- **Backend Python Compilation:** Validated all 23 backend modules with Python 3.10 `py_compile` (zero errors).
- **Backend Unit Tests:** Executed `backend/tests/test_domain_rules.py` — 5/5 tests passed (0.084s).
- **Frontend Build:** Verified `compile_applet` builds cleanly without warnings or errors.
- **Security Check:** Verified no hardcoded database credentials or JWT secrets exist in repository code or configuration.

---

## 5. Exact Recommended Next Action for Successor AI

Proceed to **Phase 3**:
1. Implement the **Order Lifecycle State Machine REST API** (`/api/orders`):
   - `POST /api/orders`: Validate single-vendor constraint, compute subtotal from current menu prices, calculate delivery fee, create order record, items, and initial `OrderStatusHistory` entry.
   - `GET /api/orders`: List customer orders, or vendor incoming orders, or driver assigned deliveries based on JWT role.
   - `PATCH /api/orders/<id>/status`: Transition order status according to permitted state machine (`pending` -> `accepted` -> `preparing` -> `ready_for_pickup` -> `out_for_delivery` -> `delivered`).
2. Implement **Driver Dispatching & Fulfillment API** (`/api/deliveries`):
   - Assignment of 2-bike fleet riders to orders ready for pickup.
   - Cash-on-Delivery (COD) reconciliation.
