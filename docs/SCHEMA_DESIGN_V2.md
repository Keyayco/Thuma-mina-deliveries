# DATABASE SCHEMA DESIGN V2 — Thuma Mina Deliveries (TMD)

> **Document Status:** Authoritative Schema Specification & Architectural Mapping  
> **Version:** 2.0.1-DRAFT (Schema Review Specification)  
> **Target Architecture:** `docs/SOURCE_OF_TRUTH.md` Version 2.0.1  
> **Target Database Engine:** PostgreSQL 16+ (Neon Cloud Serverless, Frankfurt `eu-central-1`)  
> **Scope:** Schema Design & Specification Only — No Code or Migration Applied  
> **Notice:** This document defines the exact conceptual, physical, and relational schema mapping required to support the TMD Master Architecture V2.0.1 without collapsing domain boundaries.

---

## 1. Executive Summary & Existing Schema Audit

### 1.1 Existing Migration Baseline Verification
The initial Alembic migration (`backend/migrations/versions/001_initial_schema.py`) and SQLAlchemy models establish **exactly 12 tables**:

| # | Table Name | Existing Business Responsibility | Audit Disposition |
| :--- | :--- | :--- | :--- |
| 1 | `profiles` | User accounts, authentication credentials, and platform roles (`CUSTOMER`, `VENDOR`, `DRIVER`, `ADMIN`). | **EXTEND** (Add phone verification & soft-deactivation flags) |
| 2 | `addresses` | Landmark-centric delivery addresses in Soshanguve and surrounding areas. | **KEEP AS-IS / EXTEND** (Add optional geo-coordinates for future distance engine) |
| 3 | `vendors` | Storefront identity, location, prep time, and operational open/close flag. | **EXTEND** (Add expanded status enum, branding URLs, operating hours JSON) |
| 4 | `vendor_members` | Role-based store membership linking users to vendors (`OWNER`, `MANAGER`, `STAFF`). | **KEEP AS-IS** |
| 5 | `menu_categories` | Menu classification and sort order for a vendor's catalog. | **KEEP AS-IS** |
| 6 | `menu_items` | Products with pricing in integer ZAR cents (`price_cents`) and stock toggle. | **EXTEND** (Add availability schedule & prep notes) |
| 7 | `drivers` | Fleet profiles, vehicle classification, online status, and current order counter. | **EXTEND** (Add max order ceiling constraint & shift reference) |
| 8 | `orders` | Commercial contract enforcing ONE ORDER = ONE VENDOR and price totals. | **EXTEND** (Add distance snapshot, pricing version, handover PIN, failure reasons) |
| 9 | `order_items` | Line-item historical price and quantity snapshot. | **KEEP AS-IS** |
| 10 | `order_status_history` | Historical audit trail of order milestone transitions. | **EXTEND** (Add transition actor `changed_by_user_id` and actor role) |
| 11 | `deliveries` | Physical transport dispatch, courier allocation, and milestone timestamps. | **EXTEND** (Add dispatch queue states, PIN verification, fault attribution, trip compensation) |
| 12 | `payments` | Financial record for COD and manual EFT verification. | **EXTEND** (Decouple reflection from proof, add audit verifier, cash change/tips) |

---

### 1.2 Detailed Audit of Existing Tables

#### 1. `profiles`
- **Current Columns:**
  - `id`: `String(36)` (UUID v4), PK, Non-nullable
  - `email`: `String(255)`, Unique, Index `ix_profiles_email`, Non-nullable
  - `password_hash`: `String(255)`, Non-nullable
  - `full_name`: `String(255)`, Non-nullable
  - `phone_number`: `String(20)`, Nullable
  - `role`: `Enum('CUSTOMER', 'VENDOR', 'DRIVER', 'ADMIN', name='userrole')`, Default `CUSTOMER`, Non-nullable
  - `created_at`: `DateTime`, Default `utcnow`, Non-nullable
  - `updated_at`: `DateTime`, Default `utcnow`, Non-nullable
- **Relationships:** `addresses` (1:N), `orders` (1:N), `driver_profile` (1:1), `vendor_memberships` (1:N).
- **Audit Assessment:** **EXTEND**.
  - Need `is_active: Boolean` (default `true`) for administrative account suspension/deactivation.
  - Need `phone_verified: Boolean` (default `false`) for delivery SMS/contact security.

#### 2. `addresses`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `user_id`: `String(36)`, FK `profiles.id` (ON DELETE CASCADE), Index `ix_addresses_user_id`, Non-nullable
  - `label`: `String(50)`, Nullable, Default `'Home'`
  - `township_block`: `String(50)`, Non-nullable (e.g., 'Block L', 'Block BB')
  - `landmark_description`: `Text`, Non-nullable (Landmark-accurate township navigation)
  - `street_address`: `String(255)`, Nullable
  - `is_default`: `Boolean`, Default `false`, Non-nullable
  - `created_at`: `DateTime`, Default `utcnow`, Non-nullable
- **Relationships:** `user` (N:1), `orders` (1:N).
- **Audit Assessment:** **EXTEND**.
  - Retain landmark-centric navigation as mandatory.
  - Add optional `latitude: Float`, `longitude: Float` to support external road-routing distance calculation without breaking non-GPS township lookups.
  - Ensure no artificial constraint restricts `township_block` to an assumed alphabet.

#### 3. `vendors`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `name`: `String(255)`, Non-nullable
  - `slug`: `String(255)`, Unique, Index `ix_vendors_slug`, Non-nullable
  - `description`: `Text`, Nullable
  - `phone`: `String(20)`, Non-nullable
  - `email`: `String(255)`, Nullable
  - `township_block`: `String(50)`, Non-nullable
  - `landmark_description`: `Text`, Non-nullable
  - `status`: `Enum('PENDING', 'ACTIVE', 'SUSPENDED', name='vendorstatus')`, Default `ACTIVE`, Non-nullable
  - `prep_time_minutes`: `Integer`, Default `25`, Non-nullable
  - `is_open`: `Boolean`, Default `true`, Non-nullable
  - `created_at`: `DateTime`, Non-nullable
  - `updated_at`: `DateTime`, Non-nullable
- **Relationships:** `members` (1:N), `categories` (1:N), `items` (1:N), `orders` (1:N).
- **Audit Assessment:** **EXTEND**.
  - Current status enum only has 3 states: `PENDING`, `ACTIVE`, `SUSPENDED`. Architecture V2.0.1 mandates a 5-stage lifecycle: `PENDING_REVIEW`, `ACTIVE`, `SUSPENDED`, `REJECTED`, `REMOVED`.
  - Add `logo_url: String(500)` and `banner_url: String(500)` for customer storefront presentation.
  - Add `operating_hours: JSONB / Text` to store weekly merchant opening schedules.
  - Add `latitude: Float`, `longitude: Float` for distance calculations from the vendor kitchen.

#### 4. `vendor_members`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `vendor_id`: `String(36)`, FK `vendors.id` (ON DELETE CASCADE), Index, Non-nullable
  - `user_id`: `String(36)`, FK `profiles.id` (ON DELETE CASCADE), Index, Non-nullable
  - `member_role`: `Enum('OWNER', 'MANAGER', 'STAFF', name='vendormemberrole')`, Default `STAFF`, Non-nullable
  - `created_at`: `DateTime`, Non-nullable
- **Constraints:** Unique index across `(vendor_id, user_id)`.
- **Relationships:** `vendor` (N:1), `user` (N:1).
- **Audit Assessment:** **KEEP AS-IS**.

#### 5. `menu_categories`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `vendor_id`: `String(36)`, FK `vendors.id` (ON DELETE CASCADE), Index, Non-nullable
  - `name`: `String(100)`, Non-nullable
  - `sort_order`: `Integer`, Default `0`, Non-nullable
  - `created_at`: `DateTime`, Non-nullable
- **Relationships:** `vendor` (N:1), `items` (1:N).
- **Audit Assessment:** **KEEP AS-IS**.

#### 6. `menu_items`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `vendor_id`: `String(36)`, FK `vendors.id` (ON DELETE CASCADE), Index, Non-nullable
  - `category_id`: `String(36)`, FK `menu_categories.id` (ON DELETE SET NULL), Index, Nullable
  - `name`: `String(255)`, Non-nullable
  - `description`: `Text`, Nullable
  - `price_cents`: `Integer`, Non-nullable (Integer ZAR cents)
  - `image_url`: `String(500)`, Nullable
  - `is_available`: `Boolean`, Default `true`, Non-nullable
  - `created_at`: `DateTime`, Non-nullable
  - `updated_at`: `DateTime`, Non-nullable
- **Relationships:** `vendor` (N:1), `category` (N:1), `order_items` (1:N).
- **Audit Assessment:** **EXTEND**.
  - Add `preparation_notes: Text` (optional customer instruction guide).

#### 7. `drivers`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `user_id`: `String(36)`, FK `profiles.id` (ON DELETE CASCADE), Unique, Index, Non-nullable
  - `vehicle_type`: `Enum('MOTORBIKE', 'BICYCLE', 'CAR', name='vehicletype')`, Default `MOTORBIKE`, Non-nullable
  - `license_plate`: `String(50)`, Nullable
  - `is_online`: `Boolean`, Default `false`, Non-nullable
  - `current_orders_count`: `Integer`, Default `0`, Non-nullable
  - `created_at`: `DateTime`, Non-nullable
  - `updated_at`: `DateTime`, Non-nullable
- **Relationships:** `user` (1:1), `deliveries` (1:N).
- **Audit Assessment:** **EXTEND**.
  - `current_orders_count` is currently a raw integer counter. Add Check Constraint `CHECK (current_orders_count >= 0 AND current_orders_count <= 3)` to reinforce the business capacity ceiling in the database.
  - **Correction (Integrity Review):** Do NOT add `active_shift_id` to `drivers`. Adding `drivers.active_shift_id` creates an undesirable circular foreign-key dependency with `driver_shifts.driver_id` and introduces redundant, desynchronizable state. Instead, a driver's active shift is determined directly from `driver_shifts` filtered by `shift_status = 'ACTIVE'`, strictly protected at the database level by a PostgreSQL partial unique index (`uq_driver_active_shift`).

#### 8. `orders`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `order_number`: `String(50)`, Unique, Index `ix_orders_order_number`, Non-nullable
  - `customer_id`: `String(36)`, FK `profiles.id` (ON DELETE RESTRICT), Index, Non-nullable
  - `vendor_id`: `String(36)`, FK `vendors.id` (ON DELETE RESTRICT), Index, Non-nullable
  - `delivery_address_id`: `String(36)`, FK `addresses.id` (ON DELETE RESTRICT), Non-nullable
  - `status`: `Enum('PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED', name='orderstatus')`, Default `PENDING`, Index, Non-nullable
  - `subtotal_cents`: `Integer`, Non-nullable
  - `delivery_fee_cents`: `Integer`, Default `2000`, Non-nullable
  - `total_cents`: `Integer`, Non-nullable
  - `customer_notes`: `Text`, Nullable
  - `created_at`: `DateTime`, Non-nullable
  - `updated_at`: `DateTime`, Non-nullable
- **Relationships:** `customer` (N:1), `vendor` (N:1), `delivery_address` (N:1), `items` (1:N), `status_history` (1:N), `delivery` (1:1), `payment` (1:1).
- **Audit Assessment:** **EXTEND**.
  - Current `orderstatus` enum lacks `FAILED` (required when an order bounces or cannot be delivered).
  - Add distance snapshot fields: `distance_km: Float`, `distance_band_index: Integer`, `pricing_rule_version: String(20)`.
  - Add `cash_handover_pin: String(64)` (secure hash or code displayed to customer for delivery validation).
  - Add `vendor_rejection_reason: Text` (mandatory when vendor rejects).
  - Add `cancellation_reason: Text` (when cancelled by customer or admin).

#### 9. `order_items`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `order_id`: `String(36)`, FK `orders.id` (ON DELETE CASCADE), Index, Non-nullable
  - `menu_item_id`: `String(36)`, FK `menu_items.id` (ON DELETE RESTRICT), Non-nullable
  - `item_name`: `String(255)`, Non-nullable (snapshot)
  - `quantity`: `Integer`, Default `1`, Non-nullable
  - `unit_price_cents`: `Integer`, Non-nullable (snapshot)
  - `total_price_cents`: `Integer`, Non-nullable (snapshot)
  - `notes`: `Text`, Nullable
- **Relationships:** `order` (N:1), `menu_item` (N:1).
- **Audit Assessment:** **KEEP AS-IS**.

#### 10. `order_status_history`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `order_id`: `String(36)`, FK `orders.id` (ON DELETE CASCADE), Index, Non-nullable
  - `status`: `String(50)`, Non-nullable
  - `notes`: `Text`, Nullable
  - `created_at`: `DateTime`, Default `utcnow`, Non-nullable
- **Relationships:** `order` (N:1).
- **Audit Assessment:** **EXTEND**.
  - Add `changed_by_user_id: String(36)` (FK `profiles.id` ON DELETE SET NULL, Nullable) to record who initiated the transition.
  - Add `actor_role: String(20)` (`customer`, `vendor`, `driver`, `admin`, `system`).

#### 11. `deliveries`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `order_id`: `String(36)`, FK `orders.id` (ON DELETE CASCADE), Unique, Index, Non-nullable
  - `driver_id`: `String(36)`, FK `drivers.id` (ON DELETE SET NULL), Index, Nullable
  - `status`: `Enum('PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED', name='deliverystatus')`, Default `PENDING`, Non-nullable
  - `pickup_time`: `DateTime`, Nullable
  - `delivered_time`: `DateTime`, Nullable
  - `delivery_notes`: `Text`, Nullable
  - `created_at`: `DateTime`, Non-nullable
  - `updated_at`: `DateTime`, Non-nullable
- **Relationships:** `order` (1:1), `driver` (N:1).
- **Audit Assessment:** **EXTEND**.
  - Add `assigned_time: DateTime` (when courier accepted/assigned).
  - Add `pin_verified: Boolean` (default `false`).
  - Add `failure_reason: String(50)` (`customer_unavailable`, `customer_refused_payment`, `driver_breakdown`, etc.).
  - Add `driver_at_fault: Boolean` (default `true`, set to `false` for bounced customer orders to protect ratings).
  - Add `trip_compensation_cents: Integer` (default `0`, tracks driver compensation for completed or non-fault bounced trips).

#### 12. `payments`
- **Current Columns:**
  - `id`: `String(36)`, PK, Non-nullable
  - `order_id`: `String(36)`, FK `orders.id` (ON DELETE CASCADE), Unique, Index, Non-nullable
  - `amount_cents`: `Integer`, Non-nullable
  - `method`: `Enum('CASH', 'EFT', name='paymentmethod')`, Default `CASH`, Non-nullable
  - `status`: `Enum('PENDING', 'COMPLETED', 'FAILED', name='paymentstatus')`, Default `PENDING`, Non-nullable
  - `proof_of_payment_url`: `String(500)`, Nullable
  - `verified_at`: `DateTime`, Nullable
  - `created_at`: `DateTime`, Non-nullable
- **Relationships:** `order` (1:1).
- **Audit Assessment:** **EXTEND**.
  - Add `payment_reference: String(50)` (Unique EFT tracking code displayed to customer).
  - Add `payment_reflected: Boolean` (default `false`, marks whether funds reflect in bank account).
  - Add `proof_required: Boolean` (default `false`, set true only when payment does not reflect).
  - Add `verified_by_user_id: String(36)` (FK `profiles.id` ON DELETE SET NULL, Nullable).
  - Add `verification_notes: Text` and `rejection_reason: Text`.
  - Add Cash Handover fields: `cash_tendered_cents: Integer`, `change_returned_cents: Integer`, `tip_cents: Integer` (default 0).

---

## 2. Mapping Requirements to Database Responsibilities

| Business Domain / Requirement | Primary Table Responsibility | Supporting Table(s) | Architectural Placement Rationale |
| :--- | :--- | :--- | :--- |
| **Customer Management** | `profiles` | `addresses` | Profile manages identity/credentials; addresses handle multiple landmark delivery locations. |
| **Vendor Catalog & Staff** | `vendors` | `vendor_members`, `menu_categories`, `menu_items` | Clean normalization of merchant storefront, staff permissions, catalog categories, and inventory. |
| **Vendor Lifecycle Audit** | `vendor_status_history` | `vendors` | **New Entity Required.** Stores audit trail of approvals, suspensions, and removals with mandatory reason categories. |
| **Order Placement & State** | `orders` | `order_items`, `order_status_history` | `orders` enforces ONE ORDER = ONE VENDOR and immutable price totals. `order_items` stores line-item snapshots. |
| **Item Substitutions** | `order_substitutions` | `orders`, `order_items` | **New Entity Required.** Kitchen assembly stockouts require customer-negotiated item replacements without mutating original order until agreed. |
| **Payment Verification** | `payments` | `orders` | Decouples `payment_reflected` from `proof_required`. Stores audit of authorized verifier and timestamps. |
| **Delivery Logistics** | `deliveries` | `orders`, `drivers` | Represents physical courier transport, pickup/drop-off timestamps, and PIN verification. |
| **Dispatch Queue** | `deliveries` (status = `PENDING`) | `drivers` (capacity $\le 3$) | **No new table needed.** Dispatch queue is modeled by deliveries awaiting driver assignment while orders remain `READY_FOR_PICKUP`. |
| **Driver Shift & Cash Custody** | `driver_shifts` | `drivers`, `payments` | **New Entity Required.** Tracks driver clock-in sessions, total cash collected, physical deposit, and shift-end reconciliation discrepancies. |
| **Vendor Monthly Billing** | `vendor_monthly_billings` | `vendors`, `orders` | **New Entity Required.** Monthly platform fee statements based on completed order counts (TMD does not remit vendor payouts). |
| **Customer Refunds** | `refund_requests` | `orders`, `profiles` | **New Entity Required.** Formal refund review lifecycle (`requested`, `under_review`, `approved`, `rejected`, `processed`). |
| **Order Disputes** | `order_disputes` | `orders`, `profiles` | **New Entity Required.** Multi-party quality, packaging, and conduct investigations. |
| **Customer Reviews** | `ratings` | `orders`, `drivers`, `vendors` | **New Entity Required.** Dual-entity review decoupling driver courier rating from vendor culinary rating. |
| **Customer Support Thread** | `customer_order_messages` | `orders`, `profiles` | **New Entity Required.** In-app order communication thread ("Snapchat section") with timestamps and sender role. |
| **Operating Hours Ceiling** | Application Config + `public_holidays` | `vendors` | **New Entity Required.** Master delivery hours are platform configuration; `public_holidays` stores calendar closure dates. |
| **Auditing & History** | Domain-specific history tables | `order_status_history`, `vendor_status_history`, `driver_shifts` | Domain-specific history preserves strict relational foreign keys and typed fields over a brittle "generic audit" table. |

---

## 3. Proposal and Justification of New Entities

The following 9 new entities are formally proposed. Each entity addresses a discrete business lifecycle that cannot be modeled in existing tables without violating relational integrity or domain decoupling.

### 3.1 `driver_shifts` (Driver Shift & Cash Custody Ledger)
1. **Why Necessary:** Drivers collect physical cash across multiple deliveries throughout their work day. Cash custody cannot be modeled on individual delivery rows because physical deposits and reconciliation occur at the *shift* level.
2. **Why Existing Table Cannot Represent It:** `drivers` is a persistent 1:1 user profile. Overwriting cash totals on `drivers` would destroy historical daily audit logs. `deliveries` represents single trips, not aggregated shift cash custody.
3. **Primary Key:** `id: String(36)` (UUID v4).
4. **Foreign Keys:**
   - `driver_id`: `String(36)`, FK `drivers.id` (ON DELETE RESTRICT), Index.
   - `reconciled_by_user_id`: `String(36)`, FK `profiles.id` (ON DELETE SET NULL), Nullable.
5. **Important Columns:**
   - `shift_status`: `Enum('ACTIVE', 'COMPLETED', 'RECONCILED', name='driver_shift_status')`, Default `'ACTIVE'`.
   - `started_at`: `DateTime`, Non-nullable.
   - `ended_at`: `DateTime`, Nullable.
   - `cash_collected_cents`: `Integer`, Default `0`, Non-nullable (Sum of COD collected).
   - `cash_deposited_cents`: `Integer`, Default `0`, Non-nullable (Physical cash handed to TMD).
   - `expected_deposit_cents`: `Integer`, Default `0`, Non-nullable.
   - `reconciliation_discrepancy_cents`: `Integer`, Default `0`, Non-nullable ($\text{deposited} - \text{expected}$).
   - `reconciliation_notes`: `Text`, Nullable.
   - `reconciled_at`: `DateTime`, Nullable.
6. **Important Constraints:**
   - `CHECK (cash_collected_cents >= 0)`
   - `CHECK (cash_deposited_cents >= 0)`
   - **Partial Unique Index:** `CREATE UNIQUE INDEX uq_driver_active_shift ON driver_shifts (driver_id) WHERE shift_status = 'ACTIVE';` (Guarantees at database level that a driver can have at most one concurrent active shift, eliminating circular FKs with `drivers`).
7. **Important Indexes:** `ix_driver_shifts_driver_id`, `ix_driver_shifts_status`, `uq_driver_active_shift`.
8. **Relationships:** Belongs to `driver` (N:1), reconciled by `admin` (N:1).
9. **Financial Data:** YES (Contains primary cash custody reconciliation figures in integer ZAR cents).
10. **Derived vs. Stored:** `cash_collected_cents` is incremented transactionally upon order delivery; `expected_deposit_cents` is stored as an immutable audit snapshot at shift close.

---

### 3.2 `vendor_monthly_billings` (Vendor Platform Fee Ledger)
1. **Why Necessary:** TMD operates as a delivery and technology platform, billing vendors monthly based on completed order volume. TMD does not remit food payouts.
2. **Why Existing Table Cannot Represent It:** `vendors` is a profile table. Individual orders represent consumer transactions. A periodic billing ledger is required to track monthly invoicing, payment terms, and fee waivers.
3. **Primary Key:** `id: String(36)` (UUID v4).
4. **Foreign Keys:**
   - `vendor_id`: `String(36)`, FK `vendors.id` (ON DELETE RESTRICT), Index.
   - `created_by_user_id`: `String(36)`, FK `profiles.id` (ON DELETE SET NULL), Nullable.
5. **Important Columns:**
   - `invoice_number`: `String(50)`, Unique, Index.
   - `billing_period_start`: `Date`, Non-nullable.
   - `billing_period_end`: `Date`, Non-nullable.
   - `order_count`: `Integer`, Non-nullable (Number of completed orders in period).
   - `calculated_fee_cents`: `Integer`, Non-nullable (Service fee in ZAR cents).
   - `status`: `Enum('PENDING', 'ISSUED', 'PAID', 'OVERDUE', 'WAIVED', name='billing_status')`, Default `'PENDING'`.
   - `due_date`: `Date`, Non-nullable.
   - `paid_at`: `DateTime`, Nullable.
   - `payment_reference`: `String(100)`, Nullable.
   - `notes`: `Text`, Nullable.
6. **Important Constraints:**
   - `CHECK (billing_period_end >= billing_period_start)`
   - `CHECK (order_count >= 0)`
   - `CHECK (calculated_fee_cents >= 0)`
   - Unique Constraint: `(vendor_id, billing_period_start, billing_period_end)`.
7. **Important Indexes:** `ix_vendor_monthly_billings_vendor_id`, `ix_vendor_monthly_billings_status`.
8. **Relationships:** Belongs to `vendor` (N:1).
9. **Financial Data:** YES (Service fee invoice amounts in integer ZAR cents).
10. **Derived vs. Stored:** `order_count` is derived by counting successful orders in the month, then frozen into the billing record to preserve historical invoice integrity.

---

### 3.3 `refund_requests` (Customer Refund Claims)
1. **Why Necessary:** Handles customer money-back claims for spoiled goods, non-delivery, or incorrect items, establishing an auditable review pipeline.
2. **Why Existing Table Cannot Represent It:** `payments` records the original payment transaction. Overwriting payment amounts would destroy original ledger accounting. A distinct claim workflow is required.
3. **Primary Key:** `id: String(36)` (UUID v4).
4. **Foreign Keys:**
   - `order_id`: `String(36)`, FK `orders.id` (ON DELETE RESTRICT), Index.
   - `customer_id`: `String(36)`, FK `profiles.id` (ON DELETE RESTRICT), Index.
   - `reviewed_by_user_id`: `String(36)`, FK `profiles.id` (ON DELETE SET NULL), Nullable.
   - `dispute_id`: `String(36)`, FK `order_disputes.id` (ON DELETE SET NULL), Nullable, Index (allows refunds resulting from dispute arbitration to be linked while keeping both workflows independent).
5. **Important Columns:**
   - `requested_amount_cents`: `Integer`, Non-nullable.
   - `approved_amount_cents`: `Integer`, Nullable.
   - `reason`: `Text`, Non-nullable.
   - `evidence_url`: `String(500)`, Nullable (photo of defective item).
   - `status`: `Enum('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSED', name='refund_status')`, Default `'REQUESTED'`.
   - `admin_notes`: `Text`, Nullable.
   - `reviewed_at`: `DateTime`, Nullable.
   - `processed_at`: `DateTime`, Nullable.
6. **Important Constraints:**
   - `CHECK (requested_amount_cents > 0)`
   - `CHECK (approved_amount_cents IS NULL OR approved_amount_cents >= 0)`
7. **Important Indexes:** `ix_refund_requests_order_id`, `ix_refund_requests_customer_id`, `ix_refund_requests_dispute_id`, `ix_refund_requests_status`.
8. **Relationships:** Belongs to `order` (N:1), `customer` (N:1), `reviewed_by` (N:1), `dispute` (N:1, Nullable).
9. **Financial Data:** YES (Refund claim amounts in integer ZAR cents).
10. **Derived vs. Stored:** Stored directly as asserted by customer and arbitrated by admin.

---

### 3.4 `order_disputes` (Order Quality & Conduct Disputes)
1. **Why Necessary:** Separates formal investigative complaints (e.g., missing items, courier conduct, severe delays) from simple refund claims. Disputes require structured notes and resolution actions.
2. **Why Existing Table Cannot Represent It:** `refund_requests` is strictly financial. A dispute may result in warnings, merchant retraining, or courier sanctions without an immediate cash refund.
3. **Primary Key:** `id: String(36)` (UUID v4).
4. **Foreign Keys:**
   - `order_id`: `String(36)`, FK `orders.id` (ON DELETE RESTRICT), Index.
   - `opened_by_user_id`: `String(36)`, FK `profiles.id` (ON DELETE RESTRICT), Index.
   - `resolved_by_user_id`: `String(36)`, FK `profiles.id` (ON DELETE SET NULL), Nullable.
5. **Important Columns:**
   - `dispute_type`: `Enum('MISSING_ITEMS', 'FOOD_QUALITY', 'DELIVERY_CONDUCT', 'PACKAGING_DAMAGE', 'EXTREME_DELAY', 'OTHER', name='dispute_type')`, Non-nullable.
   - `status`: `Enum('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', name='dispute_status')`, Default `'OPEN'`.
   - `description`: `Text`, Non-nullable.
   - `resolution`: `Text`, Nullable.
   - `opened_at`: `DateTime`, Non-nullable.
   - `resolved_at`: `DateTime`, Nullable.
6. **Important Constraints:** Non-empty description.
7. **Important Indexes:** `ix_order_disputes_order_id`, `ix_order_disputes_status`.
8. **Relationships:** Belongs to `order` (N:1), opened by `user` (N:1), resolved by `admin` (N:1).
9. **Financial Data:** NO.
10. **Derived vs. Stored:** Fully stored qualitative investigation record.

---

### 3.5 `ratings` (Dual-Entity Customer Reviews)
1. **Why Necessary:** The architecture strictly requires separating courier performance from kitchen culinary quality. A customer must be able to rate the driver and vendor independently.
2. **Why Existing Table Cannot Represent It:** Neither `orders`, `deliveries`, nor `vendors` can store a dual review without denormalizing or creating NULL-heavy columns.
3. **Primary Key:** `id: String(36)` (UUID v4).
4. **Foreign Keys:**
   - `order_id`: `String(36)`, FK `orders.id` (ON DELETE CASCADE), Unique, Index.
   - `customer_id`: `String(36)`, FK `profiles.id` (ON DELETE CASCADE), Index.
   - `driver_id`: `String(36)`, FK `drivers.id` (ON DELETE SET NULL), Index, Nullable.
   - `vendor_id`: `String(36)`, FK `vendors.id` (ON DELETE CASCADE), Index.
5. **Important Columns:**
   - `driver_score`: `Integer`, Nullable (e.g., 1–5 scale or numeric score).
   - `driver_feedback`: `Text`, Nullable.
   - `vendor_score`: `Integer`, Nullable.
   - `vendor_feedback`: `Text`, Nullable.
   - `driver_shielded`: `Boolean`, Default `false`, Non-nullable (True if driver rating was suppressed due to kitchen failure or customer absence).
   - `created_at`: `DateTime`, Non-nullable.
6. **Important Constraints:**
   - Unique Constraint: `order_id` (One review set per order).
   - `CHECK (driver_score IS NULL OR driver_score >= 0)` (Non-negative score; exact ceiling or scale, e.g. 1..5 stars vs 1..10 vs binary 0/1 thumbs up/down, is maintained as an `[OPEN DECISION]` to avoid premature schema restriction).
   - `CHECK (vendor_score IS NULL OR vendor_score >= 0)`
7. **Important Indexes:** `ix_ratings_order_id`, `ix_ratings_driver_id`, `ix_ratings_vendor_id`.
8. **Relationships:** Belongs to `order` (1:1), targets `driver` (N:1) and `vendor` (N:1).
9. **Financial Data:** NO.
10. **Derived vs. Stored:** Aggregated merchant and driver average scores are derived queries over this table.

---

### 3.6 `order_substitutions` (Out-of-Stock Item Proposals)
1. **Why Necessary:** When a vendor discovers an ingredient or item is unavailable during kitchen prep, they propose a substitution to the customer. This requires customer approval before modifying the order.
2. **Why Existing Table Cannot Represent It:** Mutating `order_items` directly before the customer accepts would violate order integrity and audit trails.
3. **Primary Key:** `id: String(36)` (UUID v4).
4. **Foreign Keys:**
   - `order_id`: `String(36)`, FK `orders.id` (ON DELETE CASCADE), Index.
   - `original_item_id`: `String(36)`, FK `order_items.id` (ON DELETE RESTRICT), Non-nullable.
   - `proposed_menu_item_id`: `String(36)`, FK `menu_items.id` (ON DELETE RESTRICT), Non-nullable.
5. **Important Columns:**
   - `status`: `Enum('PROPOSED', 'ACCEPTED', 'REJECTED', name='substitution_status')`, Default `'PROPOSED'`.
   - `price_difference_cents`: `Integer`, Default `0`, Non-nullable (Proposed item price minus original).
   - `vendor_note`: `Text`, Nullable.
   - `customer_response_note`: `Text`, Nullable.
   - `proposed_at`: `DateTime`, Non-nullable.
   - `responded_at`: `DateTime`, Nullable.
6. **Important Constraints:** Non-nullable foreign keys.
7. **Important Indexes:** `ix_order_substitutions_order_id`.
8. **Relationships:** Belongs to `order` (N:1), references `order_items` and `menu_items`.
9. **Financial Data:** YES (Tracks `price_difference_cents` for invoice/refund adjustment).
10. **Derived vs. Stored:** Price difference is calculated at proposal time and frozen.

---

### 3.7 `customer_order_messages` (In-App Support & Navigation Thread)
1. **Why Necessary:** Represents the in-app communication thread between customer, driver, and TMD operations ("Snapchat section"), supporting landmark photo sharing and delivery questions.
2. **Why Existing Table Cannot Represent It:** Messages are multi-record chat items associated with an order. `orders` or `deliveries` cannot store a message thread without an 1:N relational entity.
3. **Primary Key:** `id: String(36)` (UUID v4).
4. **Foreign Keys:**
   - `order_id`: `String(36)`, FK `orders.id` (ON DELETE CASCADE), Index.
   - `sender_id`: `String(36)`, FK `profiles.id` (ON DELETE RESTRICT), Index.
5. **Important Columns:**
   - `sender_role`: `String(20)`, Non-nullable (`customer`, `driver`, `vendor`, `admin`).
   - `message_text`: `Text`, Non-nullable.
   - `media_url`: `String(500)`, Nullable (gate or landmark photo upload).
   - `is_read`: `Boolean`, Default `false`, Non-nullable.
   - `created_at`: `DateTime`, Non-nullable.
6. **Important Constraints:** Non-empty message text or media URL.
7. **Important Indexes:** `ix_customer_order_messages_order_id`, `ix_customer_order_messages_created_at`.
8. **Relationships:** Belongs to `order` (N:1), sent by `profile` (N:1).
9. **Financial Data:** NO.
10. **Derived vs. Stored:** Pure chronological message stream.

---

### 3.8 `vendor_status_history` (Vendor Onboarding & Governance Audit)
1. **Why Necessary:** Mandatory audit trail recording every state change in a vendor's lifecycle (reviews, approvals, suspensions, removals) along with standardized reason categories and admin notes.
2. **Why Existing Table Cannot Represent It:** `order_status_history` is strictly for order milestones. `vendors` only holds the current state.
3. **Primary Key:** `id: String(36)` (UUID v4).
4. **Foreign Keys:**
   - `vendor_id`: `String(36)`, FK `vendors.id` (ON DELETE CASCADE), Index.
   - `changed_by_user_id`: `String(36)`, FK `profiles.id` (ON DELETE SET NULL), Nullable.
5. **Important Columns:**
   - `previous_status`: `String(50)`, Nullable.
   - `new_status`: `String(50)`, Non-nullable.
   - `reason_category`: `String(50)`, Non-nullable (`EXCESSIVE_DELAYS`, `HYGIENE_ISSUE`, `POOR_PACKAGING`, `CLEANLINESS`, `ONBOARDING_APPROVAL`, `OTHER_MANAGEMENT`).
   - `notes`: `Text`, Nullable.
   - `created_at`: `DateTime`, Non-nullable.
6. **Important Constraints:** Non-empty `new_status` and `reason_category`.
7. **Important Indexes:** `ix_vendor_status_history_vendor_id`.
8. **Relationships:** Belongs to `vendor` (N:1), executed by `admin` (N:1).
9. **Financial Data:** NO.
10. **Derived vs. Stored:** Immutable append-only audit trail.

---

### 3.9 `public_holidays` (Operational Schedule Calendar)
1. **Why Necessary:** TMD delivery service is fully closed on South African public holidays. Hardcoding dates in application code is brittle and requires redeployment every year.
2. **Why Existing Table Cannot Represent It:** No calendar table exists in the initial schema.
3. **Primary Key:** `id: String(36)` (UUID v4).
4. **Foreign Keys:** None.
5. **Important Columns:**
   - `holiday_date`: `Date`, Unique, Index, Non-nullable.
   - `name`: `String(100)`, Non-nullable (e.g., 'Freedom Day', 'Youth Day').
   - `is_closed`: `Boolean`, Default `true`, Non-nullable.
   - `created_at`: `DateTime`, Non-nullable.
6. **Important Constraints:** Unique `holiday_date`.
7. **Important Indexes:** `ix_public_holidays_holiday_date`.
8. **Relationships:** None (Reference lookup table for operating schedule middleware).
9. **Financial Data:** NO.
10. **Derived vs. Stored:** Managed calendar dates.

---

### 3.10 Explicitly Rejected Entities (Unnecessary Complexity)
- **Rejected: `generic_audit_log` ("everything" table):** Collapsing order transitions, vendor approvals, and payment verifications into a single polymorphic table destroys foreign key guarantees and complicates indexed queries. Domain-specific audit tables (`order_status_history`, `vendor_status_history`, `driver_shifts`) are cleaner.
- **Rejected: `vendor_payouts` / `vendor_wallets`:** TMD is a delivery platform, not an escrow or payment aggregator. Food sales remain merchant-side; TMD does not remit order payouts.
- **Rejected: `driver_locations_realtime`:** Real-time GPS stream is out-of-scope (deferred to conserve battery/data); milestone tracking is sufficient.
- **Rejected: `cart_items` (Database Table):** Customer carts are transient and local to the browser session until checkout. Storing uncommitted cart items in PostgreSQL introduces unnecessary write amplification.

---

## 4. Critical Domain Separation

To prevent architectural degradation, the schema enforces strict separation across 11 core domains:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     ORDER       │       │    DELIVERY     │       │    DISPATCH     │
│ (Commercial &   │◄─────►│ (Transport &    │◄─────►│ (Capacity &     │
│  Kitchen Prep)  │       │  Courier Drops) │       │  Assignment)    │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    PAYMENT      │       │  DRIVER SHIFT   │       │  CASH CUSTODY   │
│ (Reflection &   │       │ (Clock-in / Out │       │ (Deposits &     │
│  Verification)  │       │  Sessions)      │       │  Discrepancies) │
└────────┬────────┘       └─────────────────┘       └─────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     REFUND      │       │     DISPUTE     │       │ VENDOR BILLING  │
│ (Money Claims)  │       │ (Investigations)│       │ (Monthly Order  │
└─────────────────┘       └─────────────────┘       │  Volume Invoices│
                                                    └─────────────────┘
```

1. **ORDER $\neq$ PAYMENT:** An order is a commercial contract with a vendor. A payment is a financial transaction. An order can be accepted and prepared while an EFT payment is pending verification.
2. **PAYMENT $\neq$ CASH DEPOSIT:** Collecting cash from a customer (`payments`) is a per-order transaction. Depositing cash with TMD operations (`driver_shifts`) is a shift-level custody transfer.
3. **DELIVERY $\neq$ DISPATCH ASSIGNMENT:** An order's delivery record is created upon checkout. The dispatch assignment occurs when a driver with capacity ($\le 3$) accepts the delivery.
4. **VENDOR BILLING $\neq$ VENDOR PAYOUT:** TMD never pays vendors. Vendors pay TMD monthly service fees based on completed order volume.
5. **REFUND $\neq$ DISPUTE:** A refund is a financial reimbursement claim. A dispute is an investigation into food quality, hygiene, or conduct.
6. **DRIVER SHIFT $\neq$ DRIVER DELIVERY:** Deliveries are discrete trips. Shifts are multi-hour work sessions tracking availability, total collected cash, and physical reconciliation.
7. **ORDER STATUS HISTORY $\neq$ GENERAL AUDIT LOG:** Order milestones are tracked in `order_status_history`. Vendor governance is tracked in `vendor_status_history`. Payment audits are recorded directly on `payments`.

---

## 5. Order Model & Lifecycle Architecture

### 5.1 The Invariant: ONE ORDER = ONE VENDOR
The schema enforces single-vendor orders at the database level:
- `orders.vendor_id` is non-nullable.
- `order_items` references `menu_items`, and application validation ensures all `menu_items` belong to `orders.vendor_id`.

### 5.2 Comprehensive Order Lifecycle State Machine
The updated `orders.status` enum represents the culinary and commercial progression:
`PENDING` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY_FOR_PICKUP` $\rightarrow$ `ASSIGNED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`.

**Unsuccessful Terminal Branches:**
- `CANCELLED`: Customer aborts prior to prep, or admin aborts due to unreflected EFT payment.
- `REJECTED`: Vendor declines incoming order with mandatory `orders.vendor_rejection_reason`.
- `FAILED`: Delivery attempt fails (customer absent, refused payment, or breakdown). Driver receives trip compensation.

---

## 6. Dispatch Queue & Driver Capacity Architecture

### 6.1 Clear Separation of Order Status from Dispatch Queue
- An order packed by a kitchen transitions to `orders.status = 'READY_FOR_PICKUP'`.
- The corresponding `deliveries` record has `deliveries.status = 'PENDING'`.
- **The order remains in `READY_FOR_PICKUP`** while waiting in the dispatch queue. We do NOT create a redundant order status `pending_dispatch`.
- When an available driver is assigned, `deliveries.status` becomes `'ASSIGNED'` and `orders.status` transitions to `'ASSIGNED'`.

### 6.2 Hard Driver Capacity Constraint ($\le 3$) & Three-Layer Enforcement Architecture

A driver cannot hold more than 3 active concurrent orders (`ASSIGNED`, `PICKED_UP`, `OUT_FOR_DELIVERY`). Enforcement is strictly divided into three complementary architectural layers:

1. **Layer 1 — Database Constraint (Safety Boundary / Hard Ceiling):**
   - `drivers.current_orders_count` carries a check constraint: `CHECK (current_orders_count >= 0 AND current_orders_count <= 3)`.
   - *Architectural Classification:* This database constraint is an absolute backstop safety net. It **is NOT sufficient by itself** to prevent concurrent over-assignment race conditions during parallel dispatch events.

2. **Layer 2 — Application Logic (Assignment & Eligibility Rules):**
   - The dispatch service evaluates driver availability: driver must be `is_online = true`, have an active clock-in session in `driver_shifts` (`shift_status = 'ACTIVE'`), and have capacity available (`current_orders_count < 3`).
   - The application determines candidate drivers and order batching routes before issuing any assignment command.

3. **Layer 3 — Transactional Concurrency Control (Race Condition Protection):**
   - When assigning an order to a driver, the operation executes inside an explicit database transaction with row-level locking:
     `SELECT id, current_orders_count FROM drivers WHERE id = :driver_id FOR UPDATE;`
   - The transaction verifies active deliveries:
     `SELECT COUNT(*) FROM deliveries WHERE driver_id = :driver_id AND status IN ('ASSIGNED', 'PICKED_UP');`
   - If `count < 3`, the delivery is assigned to the driver and `current_orders_count` is incremented. If `count >= 3`, the assignment transaction aborts or retries with another candidate driver.
   - This prevents two concurrent dispatch workers from assigning a 3rd and 4th order to the same courier simultaneously.

---

## 7. Delivery Pricing Snapshot Architecture

### 7.1 Historical Pricing Integrity
To insulate historical orders from future tariff revisions, `orders` freezes:
- `distance_km`: Floating point distance measured at checkout.
- `distance_band_index`: Discrete band calculated at checkout (e.g., 1 for 0–5 km, 2 for 5.1–10 km).
- `pricing_rule_version`: String identifier (e.g., `'v2_r38_per_5km'`).
- `delivery_fee_cents`: Total delivery fee in integer ZAR cents (e.g., `3800` for Band 1).

### 7.2 Service Area Scope
- Soshanguve in its entirety is the core included service territory.
- Deliveries outside Soshanguve are supported using the identical distance-band pricing framework.
- No database check constraint restricts address blocks to an artificial alphabet.

---

## 8. Payment & Electronic Funds Transfer (EFT) Architecture

### 8.1 Decoupled Proof of Payment Workflow
The `payments` table cleanly decouples bank reflection from proof requirements:
- `payment_reflected: Boolean` (Default `false`): Set to `true` when finance verifies funds in the bank account.
- `proof_required: Boolean` (Default `false`): Set to `true` only if payment does not automatically reflect.
- `proof_of_payment_url: String(500)` (Nullable): Uploaded POP artifact.
- `status`:
  - `PENDING`: Awaiting bank reflection or proof.
  - `COMPLETED`: Approved by verifier.
  - `FAILED`: Payment expired, rejected, or proof missing.
- `verified_by_user_id`: Records the admin actor.
- `verified_at`: Timestamp of approval/rejection.

### 8.2 Security & Financial Data Minimization
- **Strictly Prohibited:** Raw bank passwords, banking PINs, credit card numbers, CVVs, and confidential online banking credentials SHALL NEVER be stored.
- **Stored Data:** Only public payment reference, method (`CASH`, `EFT`), amount in cents, reflection flag, and verification metadata are persisted.

---

## 9. Cash on Delivery (COD) & Handover PIN Architecture

### 9.1 Configurable Order Ceiling
- COD is allowed only when `orders.total_cents <= 25000` (R 250.00).
- Enforced as an application business rule referencing `MAX_CASH_ORDER_CENTS` configuration, avoiding hardcoded database constraints that would prevent future threshold adjustments.

### 9.2 Customer Handover PIN Verification
- `orders.cash_handover_pin`: Short-lived physical handover verification token generated upon order placement and displayed exclusively on the customer's live tracking view.
- **Security & Lifecycle Consideration:** The handover PIN is strictly a short-lived operational token valid only for the physical handover of this specific delivery. It is NOT a permanent banking credential, payment password, or user account secret.
- **Storage & Representation Flexibility:** The schema models this as `String(64)`. The exact length and formatting (e.g., 4 digits, 6 digits, alphanumeric token) remains an explicit `[OPEN DECISION] #6`. Storing an application-level hash (e.g. SHA-256) versus a short numeric string is an implementation security option supported by the `String(64)` field without requiring schema revisions.
- `deliveries.pin_verified`: Boolean flag initialized to `false`.
- Handover completion requires the driver to enter the PIN; the server validates it against `orders.cash_handover_pin` before advancing delivery to `DELIVERED` and payment to `COMPLETED`.

### 9.3 Cash Reconciliation & Bounced Deliveries
- `payments.cash_tendered_cents`, `change_returned_cents`, and `tip_cents` record cash tendered.
- When an order bounces through no fault of the courier (`driver_at_fault = false`), `deliveries.trip_compensation_cents` awards the courier trip remuneration while `orders.status` is set to `FAILED`.

---

## 10. Vendor Commercial & Billing Model

- **No Vendor Payouts:** TMD does not collect food revenues or remit payouts to vendors.
- **Monthly Invoicing Ledger:** `vendor_monthly_billings` records `order_count`, `calculated_fee_cents`, `billing_period_start`, `billing_period_end`, `invoice_number`, and `status`.
- **Fee Formula Flexibility:** The fee calculation formula is maintained in the application layer, allowing the database to accommodate tiered brackets, flat per-order fees, or subscriptions without schema alterations.

---

## 11. Customer Communication & Support Architecture

- **In-App Thread:** `customer_order_messages` stores chronological communication between customer, driver, and TMD support ("Snapchat section").
- **Fields:** `order_id`, `sender_id`, `sender_role`, `message_text`, `media_url`, `is_read`, `created_at`.
- **WhatsApp Fallback:** Application frontend generates dynamic `https://wa.me/` deep-links for WhatsApp escalation without storing third-party tokens in the database.

---

## 12. Operating Hours & Schedule Enforcement

### 12.1 Schedule Architecture
- **TMD Platform Operating Hours:** Master schedule (Mon–Fri 08:00–18:00, Sat–Sun 08:00–16:30) is managed as platform configuration.
- **Public Holidays:** Managed via `public_holidays` data-driven table (`holiday_date`, `name`, `is_closed`).
- **Vendor Store Hours:** Stored in `vendors.operating_hours` (JSONB).
- **Master Platform Ceiling Rule:** TMD operating hours act as the absolute platform availability ceiling; ordering is blocked across all vendors when TMD is closed, regardless of individual vendor opening configurations.

### 12.2 Architectural Evaluation: JSONB vs. Normalized Operating Hours Table

During the integrity review, we evaluated whether `vendors.operating_hours JSONB` should be retained or replaced with a normalized child table `vendor_operating_hours (id, vendor_id, day_of_week, open_time, close_time, is_closed)`.

| Evaluation Dimension | Option A: `vendors.operating_hours` (JSONB) | Option B: Normalized `vendor_operating_hours` Table | Recommendation & Justification |
| :--- | :--- | :--- | :--- |
| **Weekly Schedules** | Encapsulates Monday–Sunday intervals natively in a single object. | Requires 7 distinct rows per vendor. | **Option A wins:** Simpler data model; atomic write on save. |
| **Querying Open Vendors** | Evaluated via standard PostgreSQL JSONB operators or in-memory by vendor service. | Queried via `JOIN ... WHERE day_of_week = X AND current_time BETWEEN open AND close`. | **Tie:** In Soshanguve (tens to hundreds of vendors), in-memory evaluation against cached store profiles is standard. |
| **Atomic Updates** | Merchant saves whole schedule in one `UPDATE vendors SET operating_hours = ...`. | Requires multi-row `UPDATE` or `DELETE` + 7-row `INSERT` transaction. | **Option A wins:** Prevents partial schedule states or race conditions. |
| **Future Extensibility** | Accommodates multiple shifts/intervals (e.g. lunch 11:30–14:00, dinner 17:00–21:00) with zero schema migrations. | Requires complex multi-record composite keys or schema redesign for split shifts. | **Option A wins:** Extreme flexibility for township merchants. |
| **Exceptions & Holidays** | Ad-hoc closures handled by master `is_open: Boolean` toggle; public holidays handled by `public_holidays`. | Often conflates regular weekly hours with calendar dates. | **Option A wins:** Clear domain decoupling between weekly template and calendar exceptions. |
| **Timezone Handling** | All hours interpreted strictly under South Africa Standard Time (SAST, UTC+2; no DST transitions). | Same. | **Tie:** Both operate under single SAST timezone. |
| **Database Simplicity** | 0 additional tables, 0 extra foreign keys, 0 cascading delete risks. | Adds 1 table, 700+ rows per 100 vendors, extra migration and foreign key overhead. | **Option A wins:** Avoids unnecessary relational table sprawl. |

**Conclusion:** Option A (`vendors.operating_hours` JSONB) is approved and retained. It provides maximum flexibility, atomic merchant updates, and avoids table proliferation without sacrificing query performance.

---

## 13. Data Integrity & Constraint Classification

| Integrity Rule | Enforcement Layer | Implementation Mechanism |
| :--- | :---: | :--- |
| **Single Vendor Order** | Database & Application | `orders.vendor_id` FK + transactional validation that all `menu_items` belong to `orders.vendor_id`. |
| **Driver Capacity Ceiling ($\le 3$)** | 3-Layer Enforcement | DB Check: `CHECK (current_orders_count BETWEEN 0 AND 3)` (physical ceiling) + Application Dispatch Eligibility + Transactional `SELECT ... FOR UPDATE` (race condition concurrency protection). |
| **Single Active Driver Shift** | Database Constraint | PostgreSQL Partial Unique Index: `CREATE UNIQUE INDEX uq_driver_active_shift ON driver_shifts (driver_id) WHERE shift_status = 'ACTIVE'`. |
| **COD Maximum Value (R250)** | Configuration & Application | Application validation checking `orders.total_cents <= Config.MAX_CASH_ORDER_CENTS`. |
| **Positive Financial Amounts** | Database Constraint | Check constraints on `price_cents >= 0`, `amount_cents >= 0`, `subtotal_cents >= 0`, `total_cents >= 0`. |
| **Unique User Email** | Database Constraint | Unique index `ix_profiles_email`. |
| **Unique Driver Profile** | Database Constraint | Unique constraint on `drivers.user_id`. |
| **Unique Order Number** | Database Constraint | Unique index `ix_orders_order_number`. |
| **Unique Delivery per Order** | Database Constraint | Unique constraint on `deliveries.order_id`. |
| **Unique Payment per Order** | Database Constraint | Unique constraint on `payments.order_id`. |
| **Refund Cap $\le$ Order Total** | Transactional Rule | Transactional check: `requested_amount_cents <= order.total_cents`. |
| **Billing Period Validity** | Database Constraint | Check constraint: `CHECK (billing_period_end >= billing_period_start)`. |
| **Unique Vendor Monthly Bill** | Database Constraint | Unique constraint on `(vendor_id, billing_period_start, billing_period_end)`. |

---

## 14. Performance & Indexing Strategy

To guarantee rapid queries under concurrent mobile operations in Soshanguve, the following targeted indexes are specified:

1. **Customer Lookups:**
   - `ix_orders_customer_id` on `orders(customer_id)`
   - `ix_addresses_user_id` on `addresses(user_id)`
2. **Vendor Dashboard:**
   - `ix_orders_vendor_id` on `orders(vendor_id)`
   - `ix_menu_items_vendor_id` on `menu_items(vendor_id)`
   - `ix_vendor_members_vendor_id` on `vendor_members(vendor_id)`
3. **Driver & Dispatch Operations:**
   - `ix_deliveries_driver_id` on `deliveries(driver_id)`
   - `ix_deliveries_status` on `deliveries(status)`
   - `ix_drivers_is_online` on `drivers(is_online)`
4. **Order Milestone & State Tracking:**
   - `ix_orders_status` on `orders(status)`
   - `ix_order_status_history_order_id` on `order_status_history(order_id)`
5. **Payment Verification & Queue:**
   - `ix_payments_status` on `payments(status)`
   - `ix_payments_method` on `payments(method)`
   - `ix_payments_payment_reference` on `payments(payment_reference)`
6. **Customer Communication & Support:**
   - `ix_customer_order_messages_order_id` on `customer_order_messages(order_id)`
   - `ix_customer_order_messages_created_at` on `customer_order_messages(created_at)`
7. **Shifts & Cash Reconciliation:**
   - `ix_driver_shifts_driver_id` on `driver_shifts(driver_id)`
   - `ix_driver_shifts_status` on `driver_shifts(shift_status)`

---

## 15. Final Conceptual Schema Map (21 Tables Total)

### 15.1 Entity Specifications

```
1. profiles (Extended)
   - id: String(36) [PK]
   - email: String(255) [UQ, IDX]
   - password_hash: String(255)
   - full_name: String(255)
   - phone_number: String(20)
   - role: Enum(userrole)
   - is_active: Boolean [NEW]
   - phone_verified: Boolean [NEW]
   - created_at, updated_at: DateTime
   -> Domain: Identity

2. addresses (Extended)
   - id: String(36) [PK]
   - user_id: String(36) [FK -> profiles.id, IDX]
   - label: String(50)
   - township_block: String(50)
   - landmark_description: Text
   - street_address: String(255)
   - latitude, longitude: Float [NEW, Nullable]
   - is_default: Boolean
   - created_at: DateTime
   -> Domain: Location

3. vendors (Extended)
   - id: String(36) [PK]
   - name: String(255)
   - slug: String(255) [UQ, IDX]
   - description: Text
   - phone: String(20)
   - email: String(255)
   - township_block: String(50)
   - landmark_description: Text
   - status: Enum(vendorstatus) [PENDING_REVIEW, ACTIVE, SUSPENDED, REJECTED, REMOVED]
   - prep_time_minutes: Integer
   - is_open: Boolean
   - logo_url, banner_url: String(500) [NEW]
   - operating_hours: JSONB / Text [NEW]
   - latitude, longitude: Float [NEW, Nullable]
   - created_at, updated_at: DateTime
   -> Domain: Merchant

4. vendor_members (Keep As-Is)
   - id: String(36) [PK]
   - vendor_id: String(36) [FK -> vendors.id, IDX]
   - user_id: String(36) [FK -> profiles.id, IDX]
   - member_role: Enum(vendormemberrole)
   - created_at: DateTime
   -> Domain: Merchant RBAC

5. menu_categories (Keep As-Is)
   - id: String(36) [PK]
   - vendor_id: String(36) [FK -> vendors.id, IDX]
   - name: String(100)
   - sort_order: Integer
   - created_at: DateTime
   -> Domain: Catalog

6. menu_items (Extended)
   - id: String(36) [PK]
   - vendor_id: String(36) [FK -> vendors.id, IDX]
   - category_id: String(36) [FK -> menu_categories.id, IDX, Nullable]
   - name: String(255)
   - description: Text
   - price_cents: Integer
   - image_url: String(500)
   - is_available: Boolean
   - preparation_notes: Text [NEW]
   - created_at, updated_at: DateTime
   -> Domain: Catalog

7. drivers (Extended)
   - id: String(36) [PK]
   - user_id: String(36) [FK -> profiles.id, UQ, IDX]
   - vehicle_type: Enum(vehicletype)
   - license_plate: String(50)
   - is_online: Boolean
   - current_orders_count: Integer [CHECK 0..3]
   - created_at, updated_at: DateTime
   -> Domain: Fleet Logistics

8. orders (Extended)
   - id: String(36) [PK]
   - order_number: String(50) [UQ, IDX]
   - customer_id: String(36) [FK -> profiles.id, IDX]
   - vendor_id: String(36) [FK -> vendors.id, IDX]
   - delivery_address_id: String(36) [FK -> addresses.id]
   - status: Enum(orderstatus) [PENDING..DELIVERED, CANCELLED, REJECTED, FAILED]
   - subtotal_cents, delivery_fee_cents, total_cents: Integer
   - distance_km: Float [NEW]
   - distance_band_index: Integer [NEW]
   - pricing_rule_version: String(20) [NEW]
   - cash_handover_pin: String(64) [NEW]
   - vendor_rejection_reason: Text [NEW]
   - cancellation_reason: Text [NEW]
   - customer_notes: Text
   - created_at, updated_at: DateTime
   -> Domain: Commercial Order

9. order_items (Keep As-Is)
   - id: String(36) [PK]
   - order_id: String(36) [FK -> orders.id, IDX]
   - menu_item_id: String(36) [FK -> menu_items.id]
   - item_name: String(255)
   - quantity: Integer
   - unit_price_cents, total_price_cents: Integer
   - notes: Text
   -> Domain: Commercial Order

10. order_status_history (Extended)
    - id: String(36) [PK]
    - order_id: String(36) [FK -> orders.id, IDX]
    - status: String(50)
    - notes: Text
    - changed_by_user_id: String(36) [NEW, FK -> profiles.id, Nullable]
    - actor_role: String(20) [NEW]
    - created_at: DateTime
    -> Domain: Order Audit

11. deliveries (Extended)
    - id: String(36) [PK]
    - order_id: String(36) [FK -> orders.id, UQ, IDX]
    - driver_id: String(36) [FK -> drivers.id, IDX, Nullable]
    - status: Enum(deliverystatus) [PENDING, ASSIGNED, PICKED_UP, DELIVERED, FAILED]
    - assigned_time, pickup_time, delivered_time: DateTime [Nullable]
    - pin_verified: Boolean [NEW, Default false]
    - failure_reason: String(50) [NEW]
    - driver_at_fault: Boolean [NEW, Default true]
    - trip_compensation_cents: Integer [NEW, Default 0]
    - delivery_notes: Text
    - created_at, updated_at: DateTime
    -> Domain: Delivery & Dispatch

12. payments (Extended)
    - id: String(36) [PK]
    - order_id: String(36) [FK -> orders.id, UQ, IDX]
    - amount_cents: Integer
    - method: Enum(paymentmethod) [CASH, EFT]
    - status: Enum(paymentstatus) [PENDING, COMPLETED, FAILED]
    - payment_reference: String(50) [NEW, UQ, IDX]
    - payment_reflected: Boolean [NEW, Default false]
    - proof_required: Boolean [NEW, Default false]
    - proof_of_payment_url: String(500)
    - verified_by_user_id: String(36) [NEW, FK -> profiles.id, Nullable]
    - verification_notes, rejection_reason: Text [NEW]
    - cash_tendered_cents, change_returned_cents: Integer [NEW, Nullable]
    - tip_cents: Integer [NEW, Default 0]
    - verified_at, created_at: DateTime
    -> Domain: Payment

13. driver_shifts (NEW PROPOSAL)
    - id: String(36) [PK]
    - driver_id: String(36) [FK -> drivers.id, IDX]
    - shift_status: Enum(driver_shift_status) [ACTIVE, COMPLETED, RECONCILED]
    - started_at: DateTime
    - ended_at: DateTime [Nullable]
    - cash_collected_cents: Integer [Default 0]
    - cash_deposited_cents: Integer [Default 0]
    - expected_deposit_cents: Integer [Default 0]
    - reconciliation_discrepancy_cents: Integer [Default 0]
    - reconciliation_notes: Text [Nullable]
    - reconciled_by_user_id: String(36) [FK -> profiles.id, Nullable]
    - reconciled_at: DateTime [Nullable]
    -> Domain: Driver Shift & Cash Custody

14. vendor_monthly_billings (NEW PROPOSAL)
    - id: String(36) [PK]
    - vendor_id: String(36) [FK -> vendors.id, IDX]
    - invoice_number: String(50) [UQ, IDX]
    - billing_period_start, billing_period_end: Date
    - order_count: Integer
    - calculated_fee_cents: Integer
    - status: Enum(billing_status) [PENDING, ISSUED, PAID, OVERDUE, WAIVED]
    - due_date: Date
    - paid_at: DateTime [Nullable]
    - payment_reference: String(100) [Nullable]
    - notes: Text [Nullable]
    -> Domain: Vendor Billing

15. refund_requests (NEW PROPOSAL)
    - id: String(36) [PK]
    - order_id: String(36) [FK -> orders.id, IDX]
    - customer_id: String(36) [FK -> profiles.id, IDX]
    - dispute_id: String(36) [FK -> order_disputes.id, Nullable, IDX]
    - requested_amount_cents: Integer
    - approved_amount_cents: Integer [Nullable]
    - reason: Text
    - evidence_url: String(500) [Nullable]
    - status: Enum(refund_status) [REQUESTED, UNDER_REVIEW, APPROVED, REJECTED, PROCESSED]
    - admin_notes: Text [Nullable]
    - reviewed_by_user_id: String(36) [FK -> profiles.id, Nullable]
    - reviewed_at, processed_at: DateTime [Nullable]
    -> Domain: Refund

16. order_disputes (NEW PROPOSAL)
    - id: String(36) [PK]
    - order_id: String(36) [FK -> orders.id, IDX]
    - opened_by_user_id: String(36) [FK -> profiles.id, IDX]
    - dispute_type: Enum(dispute_type)
    - status: Enum(dispute_status) [OPEN, UNDER_INVESTIGATION, RESOLVED, CLOSED]
    - description: Text
    - resolution: Text [Nullable]
    - resolved_by_user_id: String(36) [FK -> profiles.id, Nullable]
    - opened_at: DateTime
    - resolved_at: DateTime [Nullable]
    -> Domain: Dispute

17. ratings (NEW PROPOSAL)
    - id: String(36) [PK]
    - order_id: String(36) [FK -> orders.id, UQ, IDX]
    - customer_id: String(36) [FK -> profiles.id, IDX]
    - driver_id: String(36) [FK -> drivers.id, IDX, Nullable]
    - vendor_id: String(36) [FK -> vendors.id, IDX]
    - driver_score: Integer [Nullable, OPEN DECISION: scale 1..5 vs 0..1 vs 1..10]
    - driver_feedback: Text [Nullable]
    - vendor_score: Integer [Nullable, OPEN DECISION: scale 1..5 vs 0..1 vs 1..10]
    - vendor_feedback: Text [Nullable]
    - driver_shielded: Boolean [Default false]
    - created_at: DateTime
    -> Domain: Rating

18. order_substitutions (NEW PROPOSAL)
    - id: String(36) [PK]
    - order_id: String(36) [FK -> orders.id, IDX]
    - original_item_id: String(36) [FK -> order_items.id]
    - proposed_menu_item_id: String(36) [FK -> menu_items.id]
    - status: Enum(substitution_status) [PROPOSED, ACCEPTED, REJECTED]
    - price_difference_cents: Integer [Default 0]
    - vendor_note: Text [Nullable]
    - customer_response_note: Text [Nullable]
    - proposed_at: DateTime
    - responded_at: DateTime [Nullable]
    -> Domain: Order Substitution

19. customer_order_messages (NEW PROPOSAL)
    - id: String(36) [PK]
    - order_id: String(36) [FK -> orders.id, IDX]
    - sender_id: String(36) [FK -> profiles.id, IDX]
    - sender_role: String(20)
    - message_text: Text
    - media_url: String(500) [Nullable]
    - is_read: Boolean [Default false]
    - created_at: DateTime [IDX]
    -> Domain: Customer Communication ("Snapchat Section")

20. vendor_status_history (NEW PROPOSAL)
    - id: String(36) [PK]
    - vendor_id: String(36) [FK -> vendors.id, IDX]
    - previous_status: String(50) [Nullable]
    - new_status: String(50)
    - reason_category: String(50)
    - notes: Text [Nullable]
    - changed_by_user_id: String(36) [FK -> profiles.id, Nullable]
    - created_at: DateTime
    -> Domain: Vendor Governance Audit

21. public_holidays (NEW PROPOSAL)
    - id: String(36) [PK]
    - holiday_date: Date [UQ, IDX]
    - name: String(100)
    - is_closed: Boolean [Default true]
    - created_at: DateTime
    -> Domain: Operational Calendar
```

### 15.2 Relational Map Summary

```
CUSTOMER (profiles)
├── addresses (1:N)
├── orders (1:N)
│   ├── order_items (1:N)
│   ├── order_status_history (1:N)
│   ├── deliveries (1:1)
│   ├── payments (1:1)
│   ├── order_substitutions (1:N)
│   ├── refund_requests (1:N)
│   ├── order_disputes (1:N)
│   ├── ratings (1:1)
│   └── customer_order_messages (1:N)
└── ratings (1:N as author)

VENDOR (vendors)
├── vendor_members (1:N)
├── menu_categories (1:N)
│   └── menu_items (1:N)
├── orders (1:N)
├── vendor_monthly_billings (1:N)
├── vendor_status_history (1:N)
└── ratings (1:N as target)

DRIVER (drivers)
├── deliveries (1:N)
├── driver_shifts (1:N)
└── ratings (1:N as target)
```

---

## 16. Catalog of Open Architectural & Schema Decisions (`[OPEN DECISION]`)

The following 13 items remain open for client confirmation and are intentionally unconstrained in the schema to ensure backward compatibility:

1. **`[OPEN DECISION]` Partial 5 km Rounding:** Confirming mathematical ceiling ($\lceil \text{distance} / 5.0 \rceil \times 3800$) vs. distance grace buffer. Schema stores floating `distance_km` and calculated `delivery_fee_cents`.
2. **`[OPEN DECISION]` Distance Calculation Engine:** Road routing API vs. Haversine straight-line vs. township block lookup matrix. Schema accommodates all via generic distance float.
3. **`[OPEN DECISION]` Minimum Distance Floor:** Confirming whether trips $< 1$ km receive an ultra-short discount or standard Band 1 (R38). Handled in application logic.
4. **`[OPEN DECISION]` Vendor Monthly Fee Formula:** Volume tiers vs. flat fee per completed order vs. monthly base subscription. Schema stores generic `order_count` and `calculated_fee_cents`.
5. **`[OPEN DECISION]` Driver Bounced Delivery Compensation Amount:** Exact remuneration (full R38 vs. flat stipend). Schema stores dynamic `trip_compensation_cents`.
6. **`[OPEN DECISION]` Customer Handover PIN Format:** Exact digit length and character structure. Schema stores a flexible `String(64)`.
7. **`[OPEN DECISION]` Customer Payment Information Scope:** Exact information required under the client phrase "bank account/payment info". Confidential credentials excluded; only reference and metadata stored.
8. **`[OPEN DECISION]` Refund Approval Authority:** Whether vendors can self-approve micro-refunds ($< \text{R}50$) or if all refunds require TMD admin arbitration. Schema links reviewer to `profiles.id`.
9. **`[OPEN DECISION]` Rating Scale & Feedback Criteria:** 1–5 stars vs. binary thumbs-up/down. Schema allows numeric score 1–5 or binary equivalent.
10. **`[OPEN DECISION]` Communication Retention & Privacy:** Archiving window for `customer_order_messages`.
11. **`[OPEN DECISION]` Receipt & Invoice Legal Registration Numbers:** CIPC and tax registration display requirements for vendor invoices.
12. **`[OPEN DECISION]` Driver Cash Float Policy:** Whether daily cash floats are issued by TMD operations. Handled in shift custody ledger.
13. **`[OPEN DECISION]` EFT Verification SLA & Order Expiry:** Timeout window for unverified EFT orders before automatic cancellation. Handled in background task scheduler.
