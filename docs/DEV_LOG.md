# DEV LOG — Thuma Mina Deliveries (TMD)

> **Engineering History & Decision Log**  
> **Authority Level:** Tier 5

---

## Log ID: LOG-20260905-01
- **Date:** 2026-09-05
- **Type:** Architecture & Initialization
- **Status:** Resolved / Completed
- **Context:** Initializing the Thuma Mina Deliveries (TMD) platform for collaborative cross-AI engineering.
- **Problem:**
  The project needed a complete technical specification, system architecture, database schema, security model, and multi-AI handoff framework before any implementation code is written. Without this, development would suffer from scope creep (e.g. attempting to build an Uber Eats clone), inconsistent database schemas, and fragmented handoffs between AI platforms.
- **Investigation:**
  Analyzed the business context: TMD operates in Soshanguve, South Africa, currently using WhatsApp, direct calls, COD, and manual EFT with a 2-bike fleet. Identified key risks including township address ambiguity, mobile data costs, and cash security. Evaluated the proposed stack: React + Vite + Tailwind CSS + Supabase (PostgreSQL, Auth, RLS, Storage, Realtime) deployed as a PWA on GitHub/Vercel.
- **Root Cause / Technical Evaluation:**
  Introducing an intermediate custom backend server (like Express or Flask) adds maintenance overhead, cold starts, and hosting cost without providing any benefit over Supabase's native PostgreSQL Row Level Security and database functions.
- **Solution:**
  1. Affirmed the client-to-Supabase direct architecture, strictly enforcing authorization at the PostgreSQL RLS layer.
  2. Formalized the core business rule: ONE ORDER = ONE VENDOR.
  3. Established a normalized 11-table database schema with custom PostgreSQL enums, constraints, and RLS policies.
  4. Deferred live GPS telemetry, algorithmic dispatch, native apps, and automated payment gateways to future phases.
  5. Established the 4-tier documentation system (`SOURCE_OF_TRUTH.md`, `PROJECT_STATE.md`, `AI_HANDOFF.md`, `DEV_LOG.md`).
- **Files Affected:**
  - `metadata.json`
  - `index.html`
  - `.env.example`
  - `docs/SOURCE_OF_TRUTH.md`
  - `docs/PROJECT_STATE.md`
  - `docs/AI_HANDOFF.md`
  - `docs/DEV_LOG.md`
- **Verification:**
  All four markdown documentation files successfully created and cross-referenced. Project metadata synchronized.
- **Lessons:**
  Explicitly defining what *not* to build (deferred features) is as crucial as defining what to build. In township commerce, UX must prioritize landmark-first address capture and payment abstraction for COD/manual EFT over complex card processing.

---

## Log ID: LOG-20260905-02
- **Date:** 2026-09-05
- **Type:** Security & Authorization
- **Status:** Resolved / Documented
- **Context:** Designing user roles and access control across the 4 user categories: Customer, Vendor, Driver, and Admin.
- **Problem:**
  Relying solely on frontend UI button hiding for access control creates security vulnerabilities where malicious actors could manipulate order states or access private customer address details via direct API calls.
- **Investigation:**
  Evaluated Supabase's Row Level Security (RLS) model. In a client-direct architecture, RLS is the database's firewall. By mapping users in `auth.users` to a `profiles` table with a typed `user_role` enum and a `vendor_members` mapping table, PostgreSQL policies can inspect `auth.uid()` directly.
- **Solution:**
  Documented table-level RLS policies in `SOURCE_OF_TRUTH.md` guaranteeing that:
  - Customers can only read and mutate their own orders and addresses.
  - Vendors can only view and process orders assigned to their store.
  - Drivers can only view delivery details for orders assigned to their driver ID.
  - Admins retain unrestricted operational oversight.
- **Files Affected:**
  - `docs/SOURCE_OF_TRUTH.md`
- **Verification:**
  Policies mathematically cover all CRUD operations across all core entities.
- **Lessons:**
  Always design database RLS policies concurrently with schema creation rather than retrofitting them after frontend development.

---

## Log ID: LOG-20260905-03
- **Date:** 2026-09-05
- **Type:** UI/UX Design Theme Implementation
- **Status:** Resolved / Implemented
- **Context:** Applying the "Clean Utility / Minimal" design theme to the TMD platform initialization hub.
- **Problem:**
  The project needed an intuitive, high-contrast, clean utility interface reflecting the South African delivery operational identity (#FF6321 brand orange, slate neutrals, monospace technical badges, and modular layout) without adding unrequested fake functionality or modifying the authoritative specification.
- **Investigation:**
  Extracted design tokens from the design specification:
  - Brand Accent: `#FF6321` (vibrant safety orange)
  - Canvas: `#f8fafc` (slate-50) with white surface cards and `border-slate-200`
  - Typography: Crisp sans-serif paired with monospaced badges (`text-[10px] font-mono`)
  - Layout: Persistent structural sidebar, breadcrumb header, multi-column dashboard grid, and terminal footer.
- **Solution:**
  1. Built modular components: `Sidebar`, `Header`, `Footer`, `OverviewTab`, `SchemaTab`, `VendorsTab`, `DriversTab`, `OrderPipelineTab`, `DocsTab`, and `LowCreditHandoffModal`.
  2. Maintained zero-leakage of unrequested backend bloat while providing real interactive inspectors for the architected schema, 2-bike fleet, Soshanguve vendor directory, and documentation files.
- **Files Affected:**
  - `src/App.tsx`
  - `src/components/Sidebar.tsx`
  - `src/components/Header.tsx`
  - `src/components/Footer.tsx`
  - `src/components/OverviewTab.tsx`
  - `src/components/SchemaTab.tsx`
  - `src/components/SecurityTab.tsx`
  - `src/components/VendorsTab.tsx`
  - `src/components/DriversTab.tsx`
  - `src/components/OrderPipelineTab.tsx`
  - `src/components/DocsTab.tsx`
  - `src/components/LowCreditHandoffModal.tsx`
  - `src/data/initialData.ts`
  - `docs/PROJECT_STATE.md`
  - `docs/DEV_LOG.md`
- **Verification:**
  `compile_applet` passed with zero errors; `lint_applet` passed with zero TypeScript issues.

---

## Log ID: LOG-20260905-04
- **Date:** 2026-09-05
- **Type:** Infrastructure & Hosting Configuration
- **Status:** Resolved / Implemented
- **Context:** User requested Render (https://render.com) for production deployment of the TMD platform.
- **Problem:**
  Deploying client-side Single Page Applications (SPAs) on Render static hosting requires specific build settings and rewrite rules (`/* -> /index.html`) to prevent 404 errors on browser page reloads or direct route navigation. The configuration needed to be codified as Infrastructure as Code (IaC) to ensure reproducible zero-config deployments.
- **Investigation:**
  Evaluated Render's Blueprint specification (`render.yaml`):
  - Service Type: `web` with `runtime: static`.
  - Build Command: `npm run build`.
  - Static Publish Path: `./dist`.
  - Route Rewrites: Single-page application fallback routing via `routes: [{ type: 'rewrite', source: '/*', destination: '/index.html' }]`.
  - Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` placeholder syncs.
- **Solution:**
  1. Created `/render.yaml` Blueprint specification at project root.
  2. Documented ADR-004 in `docs/SOURCE_OF_TRUTH.md` formalizing Render Static Site hosting.
  3. Updated `docs/PROJECT_STATE.md` and `docs/AI_HANDOFF.md` with Render hosting details.
- **Files Affected:**
  - `render.yaml`
  - `docs/SOURCE_OF_TRUTH.md`
  - `docs/PROJECT_STATE.md`
  - `docs/AI_HANDOFF.md`
  - `docs/DEV_LOG.md`
- **Verification:**
  Syntax validated against Render Blueprint specifications; local builds generate compliant `dist/` artifacts.

---

## Log ID: LOG-20260905-05
- **Date:** 2026-09-05
- **Type:** Architecture Synchronization & Backend Foundation (Phase 1)
- **Status:** Resolved / Implemented
- **Context:** Formally transitioning TMD repository from client-direct Supabase architecture to decoupled Python Flask REST API + SQLAlchemy ORM + Alembic + PostgreSQL hosted on Neon in Frankfurt (`eu-central-1`).
- **Problem:**
  The project previously assumed Supabase client-direct data access with Row Level Security. The official architectural mandate requires a dedicated Python Flask backend serving as the sole authority for database access, with database hosted on Neon Frankfurt. Browser must never receive database credentials or connect directly to PostgreSQL.
- **Investigation & Design:**
  1. Evaluated repository structure: Decided to keep the operational React dashboard at `/src` (to prevent breakages in current preview runtime) while creating a dedicated, clean `/backend` directory containing `app/`, `migrations/`, `requirements.txt`, and `run.py`.
  2. Evaluated 11 conceptual entities: Implemented modular SQLAlchemy models matching all existing business rules (`profiles`, `addresses`, `vendors`, `vendor_members`, `menu_categories`, `menu_items`, `drivers`, `orders`, `order_items`, `order_status_history`, `deliveries`, `payments`).
  3. Ensured business invariant: ONE ORDER = ONE VENDOR enforced in model relationships.
  4. Configured Alembic migration environment with `001_initial_schema.py` covering all 11 tables, 6 PostgreSQL enums, foreign keys with appropriate cascades, and indexes.
  5. Implemented application factory pattern `create_app()` with Flask-CORS, Flask-JWT-Extended, and diagnostic `/api/health` endpoint.
  6. Updated `render.yaml` to specify both the Python Web Service (`thuma-mina-backend`) and Frontend Static Site (`thuma-mina-deliveries`).
  7. Formally superseded ADR-001 with ADR-005 in `docs/SOURCE_OF_TRUTH.md`.
- **Files Affected:**
  - `docs/SOURCE_OF_TRUTH.md`
  - `docs/PROJECT_STATE.md`
  - `docs/AI_HANDOFF.md`
  - `docs/DEV_LOG.md`
  - `.env.example`
  - `render.yaml`
  - `backend/requirements.txt`
  - `backend/run.py`
  - `backend/app/__init__.py`
  - `backend/app/config.py`
  - `backend/app/extensions.py`
  - `backend/app/models/*`
  - `backend/app/routes/*`
  - `backend/migrations/*`
- **Verification:**
  - Python modules checked and compiled cleanly via `python3 -m py_compile`.
  - Frontend builds cleanly via `npm run build` and lints cleanly via `npm run lint`.
  - Zero hardcoded credentials or database secrets committed.


