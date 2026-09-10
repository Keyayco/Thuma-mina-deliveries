# SOURCE OF TRUTH — Thuma Mina Deliveries (TMD)

> **Document Status:** Active & Authoritative  
> **Version:** 1.0.0  
> **Last Updated:** 2026-09-05  
> **Authority Level:** Tier 2 (Directly under running system code/database)

---

## 1. Business Identity

- **Company Name:** Thuma Mina Deliveries
- **Abbreviation:** TMD
- **Operating Location:** Soshanguve, Gauteng, South Africa
- **Current Operational Reality:**
  - Operating delivery service run with two bike drivers (including the founder/owner).
  - High customer trust built via direct WhatsApp chats and phone calls.
  - Deliveries requested on-demand from any local shop, takeaway, or vendor.
  - Payment collected via Cash on Delivery (COD) and manual Electronic Funds Transfer (EFT/PFTS / Capitec Pay / bank transfers).
- **Core Mission:** Digitize and streamline the Soshanguve local commerce and delivery ecosystem without breaking the human trust, cash flexibility, and neighborhood knowledge that make the business work.

---

## 2. Business Model

1. **Delivery Fees:** Tiered or distance/zone-based delivery fees charged to the customer per order.
2. **Vendor Commission / Marketplace Fee:** A modest percentage or flat fee per fulfilled order charged to onboarded vendors in exchange for storefront visibility, automated order routing, and delivery fulfillment.
3. **Driver Remuneration:** Commission or fixed per-drop fee paid to drivers for fulfilled deliveries.
4. **Order Rule:** **ONE ORDER = ONE VENDOR.** No multi-vendor bundling in MVP. If a customer desires items from two vendors, two independent orders are generated, tracked, dispatched, and settled.

---

## 3. Product Vision

TMD evolves from a manual WhatsApp dispatch operation into a localized, community-centric hyper-local marketplace and delivery engine:
- **Customers** effortlessly discover local eateries, spazas, and shops, browse menus with transparent pricing, place orders with landmark-accurate township delivery details, and track order stages in real time.
- **Vendors** gain a digital storefront with a simple, high-contrast dashboard to manage availability, accept incoming orders, update prep progress, and eliminate phone miscommunications.
- **Drivers** have a streamlined mobile view showing pickup tickets, customer landmarks/contact numbers, and delivery status updates.
- **Admins / Dispatchers** have full operational oversight: monitoring order health, assigning drivers, confirming manual payments, and keeping the township moving.

---

## 4. MVP Scope vs. Out-of-Scope (Boundaries)

### MVP Scope (In-Scope)
- **Customer:**
  - Phone/Email authentication and persistent profile.
  - Vendor discovery list and vendor detail view (filtered by Soshanguve zones/sectors).
  - Categorized menu item browsing with price in ZAR (Rands).
  - Single-vendor cart management (add, edit quantities, clear).
  - Checkout with delivery address input (street + township section + landmark description + recipient phone).
  - Payment method selection: `Cash on Delivery` or `Manual EFT / PFTS`.
  - Order placement and instant tracking view (status tracker with step-by-step progress).
  - Customer order history with receipt summaries.
- **Vendor:**
  - Secure login for vendor operators.
  - Profile management (name, operating hours, prep time, contact).
  - Menu management: category creation, item creation, pricing, and instantaneous toggle for item availability (stockout protection).
  - Live incoming order queue with audio/visual notification.
  - Accept or Reject order (with required rejection reason).
  - Status progression: `Accepted` -> `Preparing` -> `Ready for Pickup`.
- **Driver:**
  - Driver login and availability toggle (`online` / `offline`).
  - Active assigned deliveries view with pickup and drop-off information.
  - Direct click-to-call customer/vendor action and WhatsApp deep-link.
  - Status updates: `Picked Up` -> `Delivered`.
  - Cash-collected confirmation field for COD deliveries.
- **TMD Admin:**
  - Live operations command dashboard (all active orders by status).
  - Driver dispatch / assignment modal.
  - Manual payment verification tool for EFT orders (marking payment as verified).
  - Vendor catalog review and activation toggle.
  - User and driver status management.

### Out-of-Scope (Explicitly Deferred)
- **Live continuous GPS driver tracking on maps:** High battery/data drain, high latency, unnecessary for initial 2-bike fleet where status stages provide sufficient visibility.
- **Automated algorithmic dispatch:** At 2 drivers, human dispatcher or simple queue assignment is superior and zero-cost.
- **Native iOS/Android apps:** App store fees, review delays, and device storage resistance. PWA solves this immediately.
- **Multi-vendor shopping carts:** Creates combinatorial complexity in delivery splitting, driver routing, and refund handling.
- **Automated Payment Gateway Integration:** Card processing and automated checkout gateways are deferred until baseline order volume, transaction economics, and banking configurations are verified.
- **Complex Loyalty / Points Programs:** Distracts from baseline operational reliability.
- **AI Recommendation Engines:** Premature optimization for an initial catalog of local businesses.
- **Automated WhatsApp Business Bot / SMS Gateways:** Adds per-message API overhead (e.g. Twilio/Meta WhatsApp Cloud API). Direct WhatsApp deep-links (`wa.me/`) achieve customer-driver contact for free.

---

## 5. User Roles & Permissions

1. **`customer`**:
   - Can read active vendors and active menu items.
   - Can create addresses and manage own addresses.
   - Can create orders for self; can read and subscribe to own orders.
   - Cannot read other customers' orders or vendor administrative data.
2. **`vendor`**:
   - Can read and update own vendor profile, categories, and menu items.
   - Can read orders assigned to their `vendor_id`.
   - Can update order status from `pending` -> `accepted` | `rejected` -> `preparing` -> `ready_for_pickup`.
   - Cannot view other vendors' orders or customer payment records.
3. **`driver`**:
   - Can update own availability status (`is_available`).
   - Can read orders and delivery tickets assigned to their `driver_id`.
   - Can update delivery status (`picked_up`, `delivered`).
   - Can view drop-off address, landmark, and customer contact number.
4. **`admin`**:
   - Unrestricted read and write access across vendors, drivers, orders, deliveries, payments, and system configurations.

---

## 6. Business Rules

1. **Single-Vendor Enforcement:** A cart may only contain items belonging to a single vendor. Attempting to add an item from Vendor B while having items from Vendor A prompts the customer to either clear the existing cart or complete Vendor A's order first.
2. **Township Address Resolution:** In Soshanguve, standard postal addresses often lack precise geocoding. All delivery addresses **must** capture:
   - Recipient Full Name & Active Phone Number
   - Township Section / Block (e.g., Block L, Block F, Extension 4)
   - Street Address / House Number
   - **Crucial Landmark Description** (e.g., "Behind Shell Garage", "Opposite Falala Shopping Center", "Blue gate next to spaza")
3. **Currency & Precision:** All monetary amounts are stored as integer **cents** in South African Rand (ZAR). (e.g., R 45.50 is stored as `4550`).
4. **Order Cancellation Window:** Customers may cancel an order only while its status is `pending`. Once a vendor updates the order to `accepted` or `preparing`, cancellation requires admin intervention to avoid food wastage.
5. **Driver Assignment:** Orders are assigned to drivers once `accepted` or `preparing`. A driver can handle multiple orders only if explicitly dispatched by the admin.

---

## 7. Order & Delivery State Lifecycles

### Order Lifecycle State Machine
```
[Customer Places Order] 
         ↓
      pending ──(Vendor Rejects)──> rejected
         ↓ (Vendor Accepts)
      accepted
         ↓ (Vendor begins prep)
      preparing
         ↓ (Vendor finishes prep)
  ready_for_pickup
         ↓ (Driver picks up order)
 out_for_delivery
         ↓ (Driver arrives & hands over)
     delivered
```
*(An order can also be marked `cancelled` by customer while `pending`, or by `admin` at any active stage with audit notes.)*

### Delivery Lifecycle State Machine
```
   assigned ──(Driver picks up from vendor)──> picked_up ──(Completed at customer)──> delivered
         │
         └──(Unable to deliver / wrong address)──> failed
```

---

## 8. Payment Strategy & SA Provider Analysis

### Current MVP Implementation
- **Payment Abstraction Layer:** An extensible interface (`PaymentService`) decoupling the order checkout flow from the specific underlying gateway.
- **Initial Supported Methods:**
  1. `CASH_ON_DELIVERY`: Customer tenders cash directly to the driver upon delivery. Driver verifies and marks the amount collected.
  2. `EFT_PFTS`: Manual Electronic Funds Transfer or Instant Payment (Capitec Pay / PayShap / Nedbank / FNB). The app generates a unique Order Reference (e.g., `TMD-8492`), displays TMD's official banking details, and allows the customer to upload or submit confirmation. The TMD admin flags the order payment status as `paid` upon receipt in bank statement.

### South African Payment Gateway Evaluation (Phase 2 Roadmap)
1. **Paystack (Stripe / SA):**
   - *Fees:* 2.9% + R1.00 per local card transaction; EFT channel available.
   - *Pros:* Developer-first SDK, webhooks, sub-accounts / split payments for marketplace vendors.
2. **Yoco:**
   - *Fees:* 2.7% to 2.95% (excl. VAT); popular across township merchants.
   - *Pros:* High brand trust in SA townships, online payment gateway (Yoco Gateway) with hosted checkout.
3. **Ozow (Instant EFT):**
   - *Fees:* 1.5% to 2.0% with minimum fee caps.
   - *Pros:* Dominant instant bank-to-bank EFT mechanism in SA; ideal for customers without credit cards.
4. **PayFast by Network:**
   - *Fees:* 3.2% - 3.5% + R2.00.
   - *Pros:* Broad payment methods (Mobicred, debit, credit, instant EFT).

*Decision:* Keep checkout gateway-agnostic in code, launch MVP with COD and manual EFT/PFTS, and integrate Paystack or Ozow once transaction volume reaches initial stability milestones.

---

## 9. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Application (PWA)                    │
│           React 19 + TypeScript + Tailwind CSS              │
│       Vite Bundler + Lucide Icons + Motion Transitions      │
│              Hosted on Vercel / Render Static               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                   HTTPS / JSON REST API Calls
                 Authorization: Bearer <JWT>
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Flask REST API Server                     │
│                Python 3.10+ / Gunicorn                      │
│             Deployed on Render (Web Service)                │
│                                                             │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   JWT Auth & Security   │  │   Role Authorization     │  │
│  │  (Werkzeug + PyJWT)     │  │ (Customer/Vendor/Driver) │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               SQLAlchemy ORM & Alembic                │  │
│  │  - Relational Models (Profiles, Vendors, Orders, etc.)│  │
│  │  - Database Migrations & Version Control              │  │
│  │  - Connection Pooling & Server-Side Validation        │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                       SQLAlchemy / TLS
               Strictly Server-Side Connection
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL on Neon Frankfurt                │
│                    Region: eu-central-1                     │
│  - Relational Schema (11 Core Entities + 6 Enums)           │
│  - Foreign Keys, Indexes, Constraints & Cascades            │
│  - Isolated from Browser (Zero Direct Client Access)        │
└─────────────────────────────────────────────────────────────┘
```

- **Decoupled 3-Tier Architecture:** The frontend communicates strictly via standard HTTPS REST API endpoints with the Flask backend.
- **Server-Authoritative Data Access:** The Flask backend is the sole authority for database connectivity, business validation, and state transitions. The browser never receives database credentials, connection strings, or direct database access.
- **PWA Capabilities:** Service worker caching for application shell, mobile install prompt, and graceful offline detection messages.
- **Hosting & Infrastructure:**
  - **Frontend:** Render (https://render.com) Static Site service / Vercel. Managed via root `render.yaml` Blueprint (`npm run build`, publish `./dist`, SPA rewrite rule `/*` -> `/index.html`).
  - **Backend API:** Render Web Service running Python 3.10+ with Gunicorn (`run:app`).
  - **Database:** Serverless PostgreSQL hosted on Neon in the **Frankfurt** region (`eu-central-1`).
  - **Environment Variables:**
    - Backend: `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, `FLASK_ENV`, `CORS_ORIGINS`.
    - Frontend: `VITE_API_URL`.

---

## 10. Database Schema Specification

### Custom PostgreSQL Enums
```sql
CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'driver', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'rejected');
CREATE TYPE delivery_status AS ENUM ('assigned', 'picked_up', 'delivered', 'failed');
CREATE TYPE payment_method AS ENUM ('cash', 'eft_pfts', 'online');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE vehicle_type AS ENUM ('bicycle', 'motorbike', 'car');
```

### Table Definitions

#### `profiles`
- `id` (UUID, PK, references `auth.users.id` ON DELETE CASCADE)
- `role` (user_role, NOT NULL, DEFAULT 'customer')
- `full_name` (TEXT, NOT NULL)
- `phone_number` (TEXT, NOT NULL)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### `addresses`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, references `profiles.id` ON DELETE CASCADE)
- `label` (TEXT, NOT NULL, e.g. "Home", "Work")
- `township_section` (TEXT, NOT NULL, e.g. "Block L", "Block TT")
- `street_address` (TEXT, NOT NULL)
- `landmark_description` (TEXT, NOT NULL)
- `contact_phone` (TEXT, NOT NULL)
- `is_default` (BOOLEAN, NOT NULL, DEFAULT false)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### `vendors`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `name` (TEXT, NOT NULL)
- `slug` (TEXT, UNIQUE, NOT NULL)
- `description` (TEXT)
- `township_section` (TEXT, NOT NULL)
- `street_address` (TEXT, NOT NULL)
- `phone_number` (TEXT, NOT NULL)
- `banner_url` (TEXT)
- `logo_url` (TEXT)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true)
- `is_accepting_orders` (BOOLEAN, NOT NULL, DEFAULT true)
- `estimated_prep_minutes` (INTEGER, NOT NULL, DEFAULT 25)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### `vendor_members`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `vendor_id` (UUID, NOT NULL, references `vendors.id` ON DELETE CASCADE)
- `user_id` (UUID, NOT NULL, references `profiles.id` ON DELETE CASCADE)
- `role` (TEXT, NOT NULL, DEFAULT 'manager') -- 'owner', 'manager', 'staff'
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- UNIQUE(`vendor_id`, `user_id`)

#### `menu_categories`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `vendor_id` (UUID, NOT NULL, references `vendors.id` ON DELETE CASCADE)
- `name` (TEXT, NOT NULL)
- `display_order` (INTEGER, NOT NULL, DEFAULT 0)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### `menu_items`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `vendor_id` (UUID, NOT NULL, references `vendors.id` ON DELETE CASCADE)
- `category_id` (UUID, NOT NULL, references `menu_categories.id` ON DELETE CASCADE)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `price_cents` (INTEGER, NOT NULL CHECK (price_cents >= 0))
- `image_url` (TEXT)
- `is_available` (BOOLEAN, NOT NULL, DEFAULT true)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### `drivers`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, UNIQUE, NOT NULL, references `profiles.id` ON DELETE CASCADE)
- `vehicle_type` (vehicle_type, NOT NULL, DEFAULT 'motorbike')
- `vehicle_registration` (TEXT)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true)
- `is_available` (BOOLEAN, NOT NULL, DEFAULT false)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### `orders`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `order_number` (TEXT, UNIQUE, NOT NULL) -- e.g. "TMD-260905-001"
- `customer_id` (UUID, NOT NULL, references `profiles.id`)
- `vendor_id` (UUID, NOT NULL, references `vendors.id`)
- `delivery_address_id` (UUID, NOT NULL, references `addresses.id`)
- `status` (order_status, NOT NULL, DEFAULT 'pending')
- `subtotal_cents` (INTEGER, NOT NULL CHECK (subtotal_cents >= 0))
- `delivery_fee_cents` (INTEGER, NOT NULL CHECK (delivery_fee_cents >= 0))
- `total_cents` (INTEGER, NOT NULL CHECK (total_cents >= 0))
- `payment_method` (payment_method, NOT NULL)
- `payment_status` (payment_status, NOT NULL, DEFAULT 'pending')
- `customer_notes` (TEXT)
- `rejection_reason` (TEXT)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### `order_items`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `order_id` (UUID, NOT NULL, references `orders.id` ON DELETE CASCADE)
- `menu_item_id` (UUID, references `menu_items.id` ON DELETE SET NULL)
- `item_name` (TEXT, NOT NULL)
- `unit_price_cents` (INTEGER, NOT NULL CHECK (unit_price_cents >= 0))
- `quantity` (INTEGER, NOT NULL CHECK (quantity > 0))
- `total_price_cents` (INTEGER, NOT NULL CHECK (total_price_cents >= 0))
- `notes` (TEXT)

#### `order_status_history`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `order_id` (UUID, NOT NULL, references `orders.id` ON DELETE CASCADE)
- `changed_by_user_id` (UUID, references `profiles.id`)
- `previous_status` (order_status)
- `new_status` (order_status, NOT NULL)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### `deliveries`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `order_id` (UUID, UNIQUE, NOT NULL, references `orders.id` ON DELETE CASCADE)
- `driver_id` (UUID, NOT NULL, references `drivers.id`)
- `status` (delivery_status, NOT NULL, DEFAULT 'assigned')
- `assigned_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `picked_up_at` (TIMESTAMPTZ)
- `delivered_at` (TIMESTAMPTZ)
- `delivery_notes` (TEXT)
- `cash_collected_cents` (INTEGER, DEFAULT 0)

#### `payments`
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `order_id` (UUID, UNIQUE, NOT NULL, references `orders.id` ON DELETE CASCADE)
- `amount_cents` (INTEGER, NOT NULL CHECK (amount_cents >= 0))
- `payment_method` (payment_method, NOT NULL)
- `payment_status` (payment_status, NOT NULL, DEFAULT 'pending')
- `reference_code` (TEXT, NOT NULL)
- `proof_of_payment_url` (TEXT)
- `verified_by_user_id` (UUID, references `profiles.id`)
- `verified_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

---

## 11. Security Model & Role-Based Authorization

The Flask REST API enforces all authorization, authentication, and data access policies. Direct client-to-database connections are strictly prohibited.

Key security controls:
- **Authentication:** Stateless JSON Web Token (JWT) architecture. Tokens issued via `/api/auth/login` and `/api/auth/register`, signed with `JWT_SECRET_KEY` on the backend.
- **Password Security:** Salted and hashed passwords stored using standard cryptographic algorithms (`werkzeug.security.generate_password_hash` / pbkdf2:sha256). Plaintext passwords are never logged, stored, or returned.
- **Role-Based Access Control (RBAC):**
  - **`customer`:** Can view active vendors/menus, create orders, manage personal addresses, and view personal order history.
  - **`vendor`:** Can manage their assigned vendor menu/profile, accept/reject incoming orders, and update prep status.
  - **`driver`:** Can toggle online/offline status, view active delivery assignments, update delivery milestones, and confirm COD collections.
  - **`admin`:** Full administrative control over all customers, vendors, drivers, orders, and system settings.
- **Backend Authorization Enforcement:**
  - Route decorators (`@jwt_required()`, `@role_required(...)`) validate token validity and user roles on every privileged request.
  - Resource ownership checks guarantee users can only query or mutate their own records (e.g., verifying `order.customer_id == current_user.id` or user is admin/vendor).
- **CORS Configuration:** Configured to whitelist frontend origins in production and local dev origins during development. Credentials and cookies are restricted.

---

## 12. Coding Standards & Conventions

1. **Backend Code Structure:** Strict application factory pattern (`create_app()`), modular blueprints, SQLAlchemy declarative models, Alembic migrations, environment-based configuration.
2. **TypeScript Strictness:** Strict null checks, explicit return types on data services, zero `any` usage in frontend code.
3. **Icons:** Strict usage of `lucide-react`. No custom inline SVGs.
4. **Animations:** Use `motion/react` for smooth view transitions, cart side-sheets, and status badge pulses.
5. **Formatting:** Money must always be formatted using a centralized utility: `formatZAR(cents: number): string` -> e.g., `R 45.00`. All database price columns store integer cents (`unit_price_cents`, `total_price_cents`).
6. **No Mock Data / No Fake Buttons:** Handlers must either call the API or clearly present functional states. No silent empty click handlers.
7. **Mobile-First UX:** Minimum touch target size 44x44px. High color contrast suitable for outdoor sunlight viewing in Soshanguve.

---

## 13. Architectural Decision Records (ADRs)

- **ADR-001: Supabase as All-in-One Backend [SUPERSEDED]**
  - *Status:* SUPERSEDED by ADR-005 on 2026-09-05.
  - *Previous Decision:* Adopt Supabase without custom backend.
  - *Reason for Supersession:* Replaced by dedicated Python Flask REST API with SQLAlchemy on Render and PostgreSQL on Neon Frankfurt to provide full server-side business logic control and eliminate vendor lock-in.
- **ADR-002: Deferral of Live GPS Tracking**
  - *Decision:* Track order stages via discrete milestone states (`pending`, `accepted`, `preparing`, `ready_for_pickup`, `out_for_delivery`, `delivered`) rather than background GPS telemetry.
  - *Rationale:* Battery conservation on driver phones, low-data footprint for customers, and realistic operation for a 2-driver fleet.
- **ADR-003: Single-Vendor per Order Enforcement**
  - *Decision:* Restrict shopping carts to single vendor fulfillment.
  - *Rationale:* Drastically simplifies driver dispatching, vendor prep time synchronization, and accounting settlements.
- **ADR-004: Render Cloud Infrastructure (Static Site + Web Service)**
  - *Decision:* Deploy the frontend client as a Render Static Site and the backend API as a Render Web Service, managed via root `render.yaml` Blueprint.
  - *Rationale:* Render provides seamless Git-triggered automated deployments, zero-cost static tier, native Single Page Application (SPA) rewrite rules, free automated SSL/TLS certificates, and infrastructure-as-code version control without managing bare servers.
- **ADR-005: Decoupled Python Flask API with PostgreSQL on Neon Frankfurt**
  - *Decision:* Adopt Python + Flask REST API with SQLAlchemy ORM and Alembic migrations, hosted on Render, connecting to serverless PostgreSQL on Neon in Frankfurt (`eu-central-1`).
  - *Rationale:* The Flask backend acts as the sole database gatekeeper, ensuring strict separation of concerns, secure server-side JWT authentication, flexible South African payment gateway integration, and high availability while preventing database credentials from ever leaking to client browsers.

---

## 14. REST API Endpoint Specification (Phase 2)

All API requests and responses utilize JSON encoding (`Content-Type: application/json`). Protected routes require an `Authorization: Bearer <access_token>` header.

### 14.1 Health & Connectivity
- `GET /api/health`
  - Public endpoint.
  - Returns service status, region (`eu-central-1`), and PostgreSQL connectivity check.

### 14.2 Authentication (`/api/auth`)
- `POST /api/auth/register`
  - Payload: `{ email, password, full_name, phone_number?, role? }`
  - Validates email regex, password strength (min 6 characters), creates user record with salted password hash, initializes driver record if `role == 'driver'`.
  - Returns: `{ message, access_token, token_type: "Bearer", user: { id, email, full_name, role, ... } }` (HTTP 201).
- `POST /api/auth/login`
  - Payload: `{ email, password }`
  - Validates credentials via `check_password_hash`.
  - Returns signed JWT access token with role and email claims (HTTP 200).
- `GET /api/auth/me`
  - Protected: `@jwt_required()`.
  - Returns complete user profile, linked addresses, vendor memberships (if vendor), and driver profile (if driver) (HTTP 200).
- `PUT /api/auth/profile`
  - Protected: `@jwt_required()`.
  - Payload: `{ full_name?, phone_number? }`.
- `PUT /api/auth/change-password`
  - Protected: `@jwt_required()`.
  - Payload: `{ current_password, new_password }`.
- `POST /api/auth/verify`
  - Protected: `@jwt_required()`.
  - Validates token claims and returns `{ valid: true, user_id, role, email }`.

### 14.3 Delivery Addresses (`/api/users/addresses`)
- `GET /api/users/addresses`
  - Protected: `@jwt_required()`.
  - Lists authenticated user's addresses ordered by default flag and creation date.
- `POST /api/users/addresses`
  - Protected: `@jwt_required()`.
  - Payload: `{ township_block, landmark_description, label?, street_address?, is_default? }`.
  - Validates that `township_block` and `landmark_description` are non-empty strings (mandated for township navigation).
- `PUT /api/users/addresses/<id>`
  - Protected: `@jwt_required()`.
  - Updates specified address (enforces owner ID check).
- `DELETE /api/users/addresses/<id>`
  - Protected: `@jwt_required()`.
  - Deletes address and automatically promotes remaining address to default if needed.
- `PATCH /api/users/addresses/<id>/default`
  - Protected: `@jwt_required()`.
  - Sets specified address as active default.

### 14.4 Vendor Catalog & Menus (`/api/vendors`)
- `GET /api/vendors`
  - Public. Query parameters: `block` (township block filter), `is_open` (boolean).
- `GET /api/vendors/<id_or_slug>`
  - Public. Returns vendor profile, categories, and operational metrics.
- `GET /api/vendors/<id_or_slug>/menu`
  - Public. Returns categorized menu items with prices in integer cents and real-time availability.
- `POST /api/vendors`
  - Protected: `@role_required(UserRole.ADMIN, UserRole.VENDOR)`.
  - Registers new vendor and creates owner membership.
- `POST /api/vendors/<vendor_id>/categories`
  - Protected: `@vendor_or_admin_required`.
- `POST /api/vendors/<vendor_id>/items`
  - Protected: `@vendor_or_admin_required`.
  - Enforces `price_cents` as positive integer.
- `PATCH /api/vendors/<vendor_id>/items/<item_id>`
  - Protected: `@vendor_or_admin_required`.
  - In-stock / 86 toggle and price adjustment.


