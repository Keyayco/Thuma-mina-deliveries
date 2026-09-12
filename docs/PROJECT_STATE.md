# PROJECT STATE — Thuma Mina Deliveries (TMD)

> **Save State Snapshot**  
> **Timestamp:** 2026-09-12T14:15:00Z  
> **Current Version:** 0.4.0-arch-update  
> **Authority Level:** Tier 3

---

## 1. Project Health & Snapshot

- **Current Phase:** Architecture v2 Definition & Consistency Review (IN PROGRESS) — Documentation Only
- **Current Version:** 0.4.0-arch-update
- **Active Blockers:** Architecture V2 currently being defined and reviewed. Awaiting client decisions on open business questions before implementing schema or code.
- **Architecture Status:** Authoritative architecture v2.0.1 defined in `docs/SOURCE_OF_TRUTH.md`. Encompasses distance-band delivery pricing (proposed R38/5km), Cash on Delivery with customer handover PIN verification, max 3-order driver capacity, shift cash custody & reconciliation, vendor monthly billing, decoupled EFT payment verification, refund/dispute lifecycles, and TMD operating schedule ceilings.
- **Frontend Status:** Operational React 19 + Tailwind CSS application at root `/src`. Interactive Auth Console, JWT Token Inspector, and Soshanguve Address Manager integrated into Security Tab. Configured with typed API client (`src/services/api.ts`).
- **Backend Status:** Python Flask REST API operational in `backend/app` with application factory pattern (`create_app()`), CORS, SQLAlchemy ORM models (12 existing verified entities in initial migration), Alembic migration configuration, complete JWT authentication endpoints (`/api/auth/*`), address management routes (`/api/users/addresses`), vendor catalog routes (`/api/vendors`), and `/api/health` endpoint.
- **Database / Neon Status:** PostgreSQL hosted on Neon in Frankfurt region (`eu-central-1`). Existing schema `001_initial_schema.py` establishes 12 core tables. **Note: NO new database migration has been created or applied. Database remains strictly at initial schema until architecture is approved.**
- **Testing Status:** Clean frontend compilation via Vite (`compile_applet` and `lint_applet`); 6 domain validation unit tests passing in `backend/tests/test_domain_rules.py`.

---

## 2. Work Summary

### Completed Work
- [x] Comprehensive business and operational analysis for Thuma Mina Deliveries in Soshanguve.
- [x] Architecture formally synchronized to React + Flask REST API + SQLAlchemy + Neon Frankfurt (ADR-005).
- [x] Supabase architecture explicitly superseded in `docs/SOURCE_OF_TRUTH.md`.
- [x] Backend directory structure created (`backend/app/`, `backend/migrations/`, `backend/requirements.txt`, `backend/run.py`).
- [x] SQLAlchemy models implemented for 12 initial core entities (`User/Profile`, `Address`, `Vendor`, `VendorMember`, `MenuCategory`, `MenuItem`, `Driver`, `Order`, `OrderItem`, `OrderStatusHistory`, `Delivery`, `Payment`).
- [x] Invariant rule enforced: ONE ORDER = ONE VENDOR (single vendor per order).
- [x] Alembic migration environment initialized with `001_initial_schema.py` (establishes 12 tables).
- [x] Application factory (`create_app`) with CORS, JWT, error callbacks, and `/api/health` created.
- [x] Render Blueprint (`render.yaml`) updated to define both Flask backend web service and static frontend site.
- [x] Full JWT Authentication implemented with RBAC decorators.
- [x] Soshanguve Delivery Address management API implemented with landmark validation.
- [x] Vendor Catalog and categorized menu REST API implemented.
- [x] Frontend typed API client service created (`src/services/api.ts`).
- [x] Pinned backend Python runtime to stable Python 3.12.8 across `render.yaml`, `backend/.python-version`, `/.python-version`, `backend/runtime.txt`, and `/runtime.txt`.
- [x] **Master Architecture v2.0.1 Specification Pass:** Updated `docs/SOURCE_OF_TRUTH.md` incorporating updated client business requirements and domain boundaries:
  - Distance-band delivery pricing (proposed R38 per 5 km model with open rounding/engine decisions).
  - Cash on Delivery maximum threshold (R250) and customer handover PIN verification.
  - Clear separation of Order lifecycle from Driver dispatch queue.
  - Driver max capacity of 3 concurrent orders enforced server-side.
  - Driver shift tracking, cash custody, and shift-end deposit reconciliation.
  - Bounced delivery driver compensation (separate from order completion).
  - Vendor monthly billing model based on monthly order count (no vendor order payouts).
  - Decoupled EFT payment verification (`payment_reflected` vs `proof_required`).
  - Full refund, dispute, and vendor onboarding lifecycles.
  - Dual-entity ratings model separating driver performance from vendor quality.
  - TMD operating hours ceiling and public holiday closure enforcement.
  - In-app customer order-support communication stream ("Snapchat section").
  - Catalog of 13 explicit Open Architectural Decisions (`[OPEN DECISION]`).

- [x] **Schema Design v2.0.1 Specification:** Produced `docs/SCHEMA_DESIGN_V2.md` mapping Version 2.0.1 architecture to an audited relational schema (12 existing tables audited, 7 extended, 9 new entities proposed, 4 rejected).
- [x] **Final Schema Integrity Review (23-Point Audit):** Completed comprehensive integrity review of `docs/SCHEMA_DESIGN_V2.md`. Result: **PASS — SCHEMA READY FOR MIGRATION**.
- [x] **Alembic Migration Revision Created:** Authored `backend/migrations/versions/002_schema_v2.py` (Revision `002_schema_v2`, down revision `001_initial_schema`).
  - Implements schema changes across 8 altered existing tables and creates 9 new domain tables.
  - Implements PostgreSQL enum extensions (`vendorstatus`, `orderstatus`) and 6 new enums.
  - Adds check constraints, unique constraints, and partial unique index (`uq_driver_active_shift`).
  - Implements symmetrical downgrade logic with dependency-ordered table drops.
  - **Migration NOT executed.**
  - **Neon database NOT modified.**

### Current Work
- Schema Design V2 approved.
- Alembic migration script `002_schema_v2.py` created and statically validated.
- **NO database migration has been executed or applied.**
- **NO Neon database changes occurred.**
- **NO application code has been modified.**
- **NO SQLAlchemy models have been modified.**
- **NO deployment occurred.**

### Next Checkpoint
- **ALEMBIC MIGRATION READY FOR REVIEW**
- Following formal review, authorization may be granted to apply the migration in a controlled execution phase.

---

## 3. Subsystem Status Matrix

| Subsystem | Status | Notes |
| :--- | :--- | :--- |
| **Architecture (v2.0.1)** | Approved Specification | Authoritative master specification in `docs/SOURCE_OF_TRUTH.md`. |
| **Schema Design (v2.0.1)** | Drafted Specification | Audited relational schema specification in `docs/SCHEMA_DESIGN_V2.md`. |
| **Database Models** | 12 Verified / 9 Proposed | Initial 12 models in place; 9 candidate models specified for migration phase. |
| **Migration System** | Initialized (001 only) | Alembic `001_initial_schema.py` in place. No new migration created. |
| **Backend API** | Operational (Phase 2) | Flask app factory, health check, CORS, auth, addresses, and vendor routes. |
| **Auth System** | Operational | Full JWT authentication with password hashing, role claims, and RBAC decorators. |
| **Address Subsystem**| Operational | Township block and mandatory landmark description validation enforced. |
| **Frontend Client** | Operational | React 19 + Tailwind CSS 4 dashboard with typed API client. |
| **Hosting Config** | Pinned (3.12.8) | `render.yaml`, `.python-version`, and `runtime.txt` pin Python 3.12.8 for Gunicorn backend. |

---

## 4. Environment Variables Checklist

- [x] `DATABASE_URL`: Set in `.env.example` (Awaiting live user Neon Frankfurt connection string)
- [x] `SECRET_KEY`: Documented in `.env.example`
- [x] `JWT_SECRET_KEY`: Documented in `.env.example`
- [x] `VITE_API_URL`: Configured for client-side API routing
