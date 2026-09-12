# SOURCE OF TRUTH — Thuma Mina Deliveries (TMD)

> **Document Status:** Active & Authoritative Architecture Specification  
> **Version:** 2.0.1 (Consistency Pass & Domain Decoupling)  
> **Last Updated:** 2026-09-12  
> **Authority Level:** Tier 2 (Authoritative Source of Truth for Database Schema, Backend, API, and Frontend)  
> **Rule:** Any implementation, code generation, migration, or route creation MUST strictly conform to this document. No application code or database migrations are to be created until formal architectural sign-off.

---

## 1. System Architecture

### 1.1 Technical Stack & Component Topology
- **Frontend Client:** React 19 Single Page Application (SPA) / Progressive Web App (PWA) styled with Tailwind CSS, built with Vite.
- **Backend API Service:** Python 3.12.8 + Flask REST API implementing the application factory pattern (`create_app()`), CORS protection, and Flask-JWT-Extended authentication.
- **Object-Relational Mapping (ORM):** SQLAlchemy 2.x declarative models with Alembic database migrations.
- **Database Engine:** Managed PostgreSQL hosted on Neon in the Frankfurt region (`eu-central-1`).
- **Hosting & Cloud Infrastructure:**
  - Frontend: Render Static Site.
  - Backend: Render Web Service running Gunicorn (`gunicorn --bind 0.0.0.0:$PORT run:app`).
  - Database: Neon Cloud Serverless PostgreSQL (`eu-central-1`).
- **Decoupled Architecture (ADR-005):** The client browser NEVER communicates directly with PostgreSQL or receives `DATABASE_URL`. All database transactions are strictly mediated by the Flask REST API via authenticated JSON requests (`Authorization: Bearer <token>`).

### 1.2 Operating Context & Business Environment
- **Company Name:** Thuma Mina Deliveries (TMD)
- **Primary Operational Area:** Soshanguve, City of Tshwane, Gauteng, South Africa.
- **Service Scope:**
  - *Included Service Area:* The entire Soshanguve area is fully included as TMD's core operating territory. (Block listings are non-exhaustive and must not be treated as a rigid database constraint).
  - *Extended Coverage:* Deliveries outside Soshanguve are supported and priced under the same distance-based tariff framework.
- **Fleet Scale:** Hyper-local delivery service operating with a focused small fleet of two motorcycle/bike drivers (including the founder/operator).
- **Core Strategy:** Milestone-based tracking, landmark-accurate township navigation, cash flexibility, and community trust.

### 1.3 Subsystem Ecosystem Map

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TMD PRODUCT ECOSYSTEM                                  │
├───────────────────┬───────────────────┬────────────────────────┬───────────────────────┤
│     CUSTOMER      │      VENDOR       │         DRIVER         │    ADMIN / OPS        │
│   (PWA Client)    │ (Store Dashboard) │     (Fleet Mobile)     │  (Command Console)    │
├───────────────────┼───────────────────┼────────────────────────┼───────────────────────┤
│ • Discovery & Menu│ • Menu & Inventory│ • Availability/Status  │ • Operational Monitor │
│ • Soshanguve Addr │ • Order Queue     │ • Active Deliveries(<=3│ • Dispatch Queue Mgmt │
│ • Distance Pricing│ • Prep Milestones │ • Landmark Navigation  │ • Manual EFT Approval │
│ • COD / EFT       │ • Stockout Toggle │ • Cash Collection+PIN  │ • Cash Reconciliation │
│ • Payment Proof   │ • Item Replace/Sub│ • Shift Cash & Banking │ • Vendor Verification │
│ • Order Tracking  │ • Monthly Billings│ • Trip Compensation    │ • Monthly Invoicing   │
│ • In-App Support  │ • Ratings Summary │ • Performance Shielding│ • Dispute & Refunds   │
│ • Order Ratings   │                   │                        │ • Platform Hours Mgmt │
└───────────────────┴───────────────────┴────────────────────────┴───────────────────────┘
```

---

## 2. Roles and Permissions

### 2.1 Role-Based Access Control (RBAC) Matrix

| Capability / Resource | Customer (`customer`) | Vendor Operator (`vendor`) | Fleet Driver (`driver`) | Operations Admin (`admin`) |
| :--- | :---: | :---: | :---: | :---: |
| Browse Vendors & Menus | Yes | Yes | Yes | Yes |
| Manage Personal Addresses | Yes | No | No | Read/Admin |
| Place Orders | Yes | No | No | Support/Assist |
| View Order Status History | Own Orders | Own Store Orders | Assigned Deliveries | All Orders |
| Cancel Order (Pending) | Yes | No | No | Yes |
| Accept / Reject Orders | No | Own Store Orders | No | Yes |
| Update Prep Milestones | No | Own Store Orders | No | Yes |
| Propose Item Substitutions | No | Own Store Orders | No | Yes |
| Respond to Substitutions | Yes (Own Order) | No | No | Yes |
| View Drop-off Landmark Info | Own Address | Pickup Only | Assigned Deliveries | All Orders |
| Accept Delivery Assignment | No | No | Yes (Cap $\le 3$) | Assign Any |
| Validate Handover PIN | No (Possesses PIN) | No | Yes (Inputs PIN) | Override/Verify |
| Start / End Work Shift | No | No | Yes (Own Shift) | Audit/Close |
| Log Shift Cash Deposit | No | No | Yes (Own Shift) | Reconcile |
| Submit EFT Proof of Payment | Yes (When required)| No | No | Verify/Reject |
| Verify EFT Payments | No | No | No | Yes |
| Rate Order (Driver / Vendor) | Yes (Own Order) | No | No | Moderate |
| Submit Refund / Dispute | Yes (Own Order) | Dispute Only | No | Arbitrate |
| Manage Menu & Categories | No | Own Store | No | All Stores |
| Onboard / Verify Vendors | No | Submit Application| No | Full Authority |
| View Monthly TMD Invoices | No | Own Store Invoices | No | Full Ledger |
| Public User Registration | Yes | Requires Approval | Requires Approval | Restricted (Seed) |

### 2.2 Security Enforcement Rules
1. **Admin Assignment Block:** Public self-registration as `admin` is strictly forbidden and rejected with HTTP 403 Forbidden.
2. **Vendor Scoping:** Vendor operators can only read and mutate resources belonging to their verified `vendor_id`.
3. **Driver Scoping:** Drivers can only access drop-off landmarks and customer contact details for orders currently assigned to them.
4. **JWT Expiration & Claims:** Access tokens carry `user_id`, `role`, and `sub` claims with short expirations; backend endpoints enforce authorization via `@role_required`, `@admin_required`, `@vendor_or_admin_required`, and `@driver_or_admin_required`.

---

## 3. Customer Domain

1. **Authentication & Profile:** Customer registers with email, password, full name, and phone number. Profile stores preferences and contact details.
2. **Landmark-Centric Addresses:** Township street naming is often incomplete. Every delivery address requires:
   - `township_block` (Descriptive sector/block identification, free-text or structured, e.g., "Block L", "Block BB", extension names).
   - `landmark_description` (e.g., "Opposite Falala Community Hall, second house after yellow gate").
   - Optional `street_address` and `label` ("Home", "Work").
   - Neither database constraints nor validation rules shall restrict addresses to an assumed static alphabet of blocks.
3. **Storefront & Menu Discovery:** Customers browse active merchants, view categories, item descriptions, and prices in integer ZAR cents.
4. **Single-Vendor Cart Enforcement:** A customer cart may only contain items from a single vendor. Attempting to add an item from a second vendor prompts the customer to either clear the existing cart or complete the pending store's order first.
5. **Checkout & Distance Pricing:** System computes delivery fee based on vendor-to-customer distance bands (proposed R38 per 5 km).
6. **Payment Selection:**
   - Cash on Delivery (COD) for orders $\le$ R250.
   - Electronic Funds Transfer (EFT) with payment reference display. Proof of Payment (POP) is submitted if payment does not automatically reflect or when explicitly requested by operations.
7. **Live Order Tracking:** Customer monitors milestone progression (`pending` $\rightarrow$ `accepted` $\rightarrow$ `preparing` $\rightarrow$ `ready_for_pickup` $\rightarrow$ `assigned` $\rightarrow$ `picked_up` $\rightarrow$ `out_for_delivery` $\rightarrow$ `delivered`).
8. **Handover PIN Presentation:** Customer views their secret handover PIN on their live order tracking screen and provides it to the driver upon delivery.
9. **Order Support & Communication:** In-app order message thread ("Snapchat section") for instructions, questions, and landmark clarification with fallback WhatsApp deep-link.
10. **Dual Rating Submission:** Post-delivery review allowing the customer to rate the driver and vendor independently.
11. **Refund & Dispute Filing:** Formal submission of refund requests or quality disputes with text reasons and photo evidence.

---

## 4. Vendor Domain

1. **Marketplace Intermediary Role:** TMD is a technology platform and delivery logistics provider, NOT a reseller or retailer. The vendor is the legal seller of record.
2. **Onboarding Submission:** Prospective vendor submits business name, slug, phone, email, township block, landmark, operating hours, logo, and initial menu.
3. **Catalog Management:** Vendor organizes catalog into `menu_categories` and `menu_items` with integer ZAR cents prices (`price_cents >= 0`).
4. **Availability & Stockouts:** Vendor toggles `is_available` on items. If an ordered item is out of stock during kitchen assembly, vendor initiates an `order_substitutions` proposal to the customer.
5. **Order Fulfillment Queue:** Vendor receives incoming orders, reviews items, and either accepts or rejects (with a mandatory non-empty `rejection_reason`).
6. **Preparation Stages:** Vendor advances status from `accepted` to `preparing`, and finally to `ready_for_pickup` when packed.
7. **No TMD Order Payouts:** TMD does NOT collect customer food revenues on behalf of vendors and does NOT remit order payouts. Customer food payment is settled directly or merchant-side.
8. **Monthly Service Fee Statements:** Vendors view their completed monthly order counts, TMD service fee invoices, and payment status via `vendor_monthly_billings`.

---

## 5. Driver Domain

1. **Fleet Logistics Profile:** Driver record captures `user_id`, `vehicle_type` (`bicycle`, `motorbike`, `car`), `license_plate`, and active dispatch status (`is_online`).
2. **Shift Management:** Drivers clock in to start an active shift (`shift_status = 'active'`) and clock out to complete their shift (`shift_status = 'completed'`).
3. **Driver Capacity Constraint:** A driver can hold a maximum of **3 active concurrent orders** across assigned deliveries. Assignments exceeding capacity are rejected with HTTP 409 Conflict.
4. **Landmark Navigation:** Driver app displays landmark descriptions, township blocks, and click-to-call links for customer and vendor contact.
5. **Cash Collection & PIN Validation:** For COD orders, the driver collects physical cash and must enter the customer's secret handover PIN into the app. Handover cannot be completed without server PIN verification.
6. **Cash Change & Tips:** Driver records `cash_tendered_cents`, `change_returned_cents`, and optional `tip_cents`.
7. **Shift Cash Deposit & Reconciliation:** At shift end, driver logs cash deposited with TMD operations. Operations audits the deposit against expected collections:
   $$\text{Expected Cash} = \sum (\text{COD Amount Cents}) - \sum (\text{Driver Tips})$$
8. **Bounced Delivery Protection:** If a customer is unreachable or cannot pay, the delivery fails through no fault of the driver (`driver_at_fault = false`). The driver receives `trip_compensation_cents` and their performance rating is not penalized.

---

## 6. Admin Domain

1. **Operations Command Console:** Real-time visibility into all platform orders, dispatch assignment queue, active driver allocations, and vendor prep times.
2. **Dispatch Queue Management:** Oversee queue of orders ready for pickup; assign or reassign deliveries to active drivers who have available capacity ($< 3$).
3. **Electronic Payment Verification:** Review customer payments. If payment reflects, admin marks payment verified. If payment does not reflect, admin requests Proof of Payment (POP) from customer, audits the uploaded artifact, and approves or rejects with auditable timestamps and notes.
4. **Shift Cash Audit & Reconciliation:** Admin verifies driver physical cash deposits, records discrepancies, and marks shifts as `reconciled`.
5. **Vendor Onboarding Verification:** Multi-stage review of vendor applications: approve, reject, suspend, or remove with auditable category reasons.
6. **Monthly Vendor Billing Generation:** Admin reviews monthly completed order counts per vendor, generates invoices, records payments, and applies promotional fee waivers.
7. **Refund & Dispute Arbitration:** Admin evaluates refund requests and dispute claims, inspects evidence, and issues approvals, partial refunds, or rejections.
8. **Platform Operating Schedule Management:** Admin configures weekly TMD operating hours and manages the `public_holidays` calendar table.

---

## 7. Order Lifecycle vs. Dispatch Queue

### 7.1 Clear Separation of Concerns
To avoid coupling business order progression with fleet dispatch mechanics, the architecture strictly distinguishes:
- **Order Lifecycle Status:** Represents the customer-facing commercial and culinary state of the order.
- **Dispatch Queue State:** Represents driver capacity, assignment readiness, and delivery allocation.

An order reaching `ready_for_pickup` remains in that legitimate order status while the dispatch subsystem evaluates driver capacity. If all active drivers are at full capacity ($\ge 3$ active orders), the order's delivery record enters/remains in the dispatch queue without inventing artificial order lifecycle statuses.

### 7.2 Order Lifecycle State Machine

```
                        [Customer Places Order]
                                   │
                                   ▼
                            ┌─────────────┐
        ┌───────────────────│   PENDING   │──────────────────┐
        │                   └─────────────┘                  │
        │ (Customer cancels        │ (Vendor                 │ (Vendor rejects
        │  before accept)          │  accepts)               │  with reason)
        ▼                          ▼                         ▼
┌───────────────┐           ┌─────────────┐           ┌──────────────┐
│   CANCELLED   │           │  ACCEPTED   │           │   REJECTED   │
└───────────────┘           └─────────────┘           └──────────────┘
                                   │
                                   │ (Vendor begins prep)
                                   ▼
                            ┌─────────────┐
        ┌───────────────────│  PREPARING  │──────────────────┐
        │                   └─────────────┘                  │
        │ (Vendor stockout/        │ (Vendor finishes        │ (Customer cancels
        │  kitchen failure)        │  prep)                  │  during prep ->
        ▼                          ▼                         │  admin arbitrated)
┌───────────────┐           ┌─────────────┐                  ▼
│    FAILED     │           │  READY_FOR  │           ┌──────────────┐
└───────────────┘           │   PICKUP    │           │  CANCELLED   │
                            └─────────────┘           └──────────────┘
                                   │
                                   │ (Driver assigned & collects from vendor)
                                   ▼
                            ┌─────────────┐
                            │  PICKED_UP  │
                            └─────────────┘
                                   │
                                   │ (Driver departs vendor for landmark)
                                   ▼
                            ┌─────────────┐
       ┌────────────────────│   OUT_FOR   │───────────────────┐
       │                    │  DELIVERY   │                   │
       │                    └─────────────┘                   │
       │ (Customer missing /       │ (Cash + Handover PIN     │ (Unrecoverable
       │  refuses payment ->       │  confirmed OR            │  breakdown ->
       │  Bounced order)           │  EFT confirmed)          │  fail or reassign)
       ▼                           ▼                          ▼
┌───────────────┐           ┌─────────────┐            ┌──────────────┐
│    FAILED     │           │  DELIVERED  │            │    FAILED    │
│(Trip Comp OK) │           └─────────────┘            └──────────────┘
└───────────────┘
```

### 7.3 Order State Descriptions & Transition Invariants
- `pending`: Customer placed order. Awaiting vendor confirmation. Customer can cancel without penalty.
- `accepted`: Vendor confirmed order. Preparation has not yet started.
- `preparing`: Kitchen assembling goods. Customer cancellation now requires admin arbitration.
- `ready_for_pickup`: Goods packaged. Food is ready for courier collection. Order remains in this state until courier physically picks up.
- `picked_up`: Driver collected order from vendor storefront.
- `out_for_delivery`: Driver actively traveling to the customer landmark.
- `delivered`: Handover completed. Handover PIN successfully verified.
- `rejected`: Vendor declined order. Non-empty `rejection_reason` is mandatory.
- `cancelled`: Order aborted by customer or admin.
- `failed`: Order attempt unsuccessful (customer unavailable, payment refused, or unrecoverable breakdown). Driver receives trip compensation.

---

## 8. Payment Lifecycle & Verification

### 8.1 Payment Methods
1. **Cash on Delivery (COD):** Allowed strictly for orders where `total_cents <= 25000` (R 250.00). Configurable via `MAX_CASH_ORDER_CENTS`.
2. **Electronic Funds Transfer (EFT / Instant EFT / PFTS):** Allowed for all order values. Banking details and unique order payment reference displayed on checkout.

### 8.2 Decoupled Payment Verification & POP Workflow
Proof of Payment (POP) is **NOT** universally mandatory for all EFT transactions. Verification reflects real-world operational workflows:
1. Customer initiates EFT payment using the generated order payment reference.
2. TMD finance receiver / authorized verifier checks if payment reflects in the bank account (`payment_reflected`).
3. **Path A (Payment Reflects):** If funds reflect, verifier immediately approves the payment (`status = 'verified'`). No proof of payment upload is required from the customer.
4. **Path B (Payment Does Not Reflect):** If funds do not immediately reflect, the system/admin sets `proof_required = true`. The customer is notified to submit proof of payment (`proof_of_payment_url`).
5. **Resolution:**
   - If proof is submitted and verified, payment transitions to `verified`.
   - If proof is missing within the required verification window, or is audited as invalid, payment transitions to `failed`, triggering order cancellation.
6. **Audit Invariant:** Every verification action records `verified_by_user_id`, `verified_at`, and `verification_notes` / `rejection_reason`.

```
                  [Customer Places EFT Order]
                               │
                               ▼
                   [Payment Status: PENDING]
                               │
               [Finance Checks Account Reflection]
                               │
            ┌──────────────────┴──────────────────┐
            ▼ (Payment Reflects)                  ▼ (Does NOT Reflect)
   [Payment: VERIFIED]                 [Set: proof_required = true]
            │                                     │
   [Order Proceeds]                 ┌─────────────┴─────────────┐
                                    ▼ (Customer Uploads POP)    ▼ (No Proof / Timeout)
                           [Status: PROOF_SUBMITTED]      [Payment: FAILED]
                                    │                           │
                        ┌───────────┴───────────┐         [Order: CANCELLED]
                        ▼ (Proof Verified)      ▼ (Proof Rejected)
               [Payment: VERIFIED]      [Payment: FAILED]
```

### 8.3 Payment Data Minimalist Storage Principle
To prevent financial exposure and regulatory breach:
- **Forbidden:** Raw bank account credentials, credit card numbers, CVVs, online banking passwords, or customer banking PINs SHALL NEVER be stored.
- **Permitted & Required:**
  - `payment_method` (`cash`, `eft`).
  - `payment_reference` (System-generated order payment code displayed to customer for EFT reconciliation).
  - `amount_cents` (Integer ZAR cents).
  - `payment_reflected` (Boolean indicator of bank reflection).
  - `proof_required` (Boolean indicator whether customer must upload POP).
  - `proof_of_payment_url` (Secure storage link to uploaded receipt/PDF, populated only when required).
  - `verification_notes` / `rejection_reason`.
  - Audit fields: `verified_by_user_id`, `verified_at`.

---

## 9. Delivery & Dispatch Architecture

### 9.1 Driver Capacity Constraint
- **Capacity Ceiling:** A driver may hold a maximum of **3 active concurrent orders** (`['assigned', 'picked_up', 'out_for_delivery']`).
- **Server-Side Enforcement:** Driver assignment endpoint evaluates active delivery count:
  $$\text{active\_orders} = \operatorname{count}(\text{deliveries where driver\_id = :id and status} \in [\text{'assigned'}, \text{'picked\_up'}, \text{'out\_for\_delivery'}])$$
  If $\text{active\_orders} \ge 3$, the server rejects assignment with HTTP 409 Conflict.

### 9.2 Dispatch Queue Mechanics
- When an order reaches `ready_for_pickup`:
  - If an active driver has capacity ($< 3$ active orders), the order can be assigned.
  - If all active drivers are at full capacity, the order remains `ready_for_pickup` and its delivery record sits in the dispatch queue (`delivery_status = 'pending_assignment'`).
  - As soon as a driver completes a delivery (`delivered` or `failed`), capacity frees up and the next queued delivery can be assigned.
- **Manual Dispatch & Reassignment:** Operations console allows dispatchers to allocate queued deliveries or reassign orders in case of vehicle breakdown.

### 9.3 Delivery Failure Taxonomy & Driver Protection
When a delivery cannot be completed, the failure reason must be recorded:
- `customer_unavailable` (Customer not at landmark and unreachable).
- `customer_refused_payment` (Customer cannot tender COD amount).
- `incorrect_address` (Address or landmark description fundamentally erroneous).
- `driver_breakdown` (Motorcycle or bicycle mechanical failure).
- `vendor_delay_cancelled` (Vendor delay prompted cancellation).
- `weather_hazard` (Severe storm/hail preventing travel).
- `other`.
- **Fault Attribution:** `driver_at_fault` is set to `false` for customer absence, payment refusal, or weather hazards.
- **Trip Compensation:** When `driver_at_fault == false`, `trip_compensation_cents` is credited to the driver even though the customer order is marked `failed`. The unsuccessful delivery does NOT count as a successful customer delivery.

---

## 10. Cash Handover & Custody Architecture

1. **Order Ceiling Constraint:** COD is restricted to orders where `total_cents <= 25000` (R 250.00), configured via backend environment variable `MAX_CASH_ORDER_CENTS`.
2. **Customer Handover PIN:**
   - Generated automatically upon order placement.
   - Stored hashed or securely in `orders.cash_handover_pin`.
   - Displayed strictly on the customer's live tracking screen.
   - Driver NEVER sees the PIN prior to customer delivery.
   - Handover is marked completed ONLY after the driver enters the matching PIN provided by the customer.
3. **Cash Change & Tips:** Driver records `cash_tendered_cents`, `change_returned_cents`, and optional `tip_cents`.
4. **Shift Custody & Banking:** Drivers deposit cash with TMD operations at shift end. Operations audits physical cash against digital totals.

---

## 11. Driver Shift Lifecycle

1. **Shift States:**
   - `active`: Driver clocked in and available for deliveries up to capacity of 3.
   - `completed`: Driver clocked out of driving; cash in driver custody awaiting banking.
   - `reconciled`: Operations admin verified physical cash deposit, reconciled discrepancies, and closed shift.
2. **Financial Tally Equation:**
   $$\text{Expected Cash} = \sum_{\text{shift}} (\text{payments.amount\_cents}) - \sum_{\text{shift}} (\text{driver\_tips})$$
   $$\text{Discrepancy} = \text{cash\_deposited\_cents} - \text{Expected Cash}$$
3. **Discrepancy Notes:** Any excess or shortage is permanently recorded in `driver_shifts.reconciliation_discrepancy_cents` with admin notes.

---

## 12. Vendor Lifecycle

1. **Vendor Lifecycle States:**
   - `pending_review`: Vendor registered profile and draft menu. Storefront hidden from public browsing.
   - `active`: TMD management inspected business details and approved storefront. Published to customers.
   - `suspended`: Temporarily offline due to operational infractions.
   - `rejected`: Application declined during initial review.
   - `removed`: Permanently decommissioned.
2. **Auditable Transition Logging:** Every status change generates a `vendor_status_history` record containing:
   - `previous_status` $\rightarrow$ `new_status`
   - `changed_by_user_id` (admin)
   - `reason_category` (`excessive_delays`, `customer_complaints`, `hygiene_issue`, `poor_packaging`, `cleanliness`, `approved`, `other_management`)
   - `notes`

---

## 13. Refund Lifecycle

1. **Refund Request Submission:** Customer submits request via `/api/refunds` capturing `order_id`, `requested_amount_cents`, `reason`, and optional `evidence_url`. Status initialized to `requested`.
2. **Administrative Review:** Operations reviews order history, driver timestamps, and vendor prep logs. Status advances to `under_review`.
3. **Decision & Execution:**
   - `approved`: Admin approves amount (full or partial) and enters decision notes. Status transitions to `processed` upon fund return.
   - `rejected`: Admin declines request with mandatory explanation.

---

## 14. Dispute Lifecycle

1. **Scope:** Formal quality, missing item, hygiene, or conduct complaints requiring multi-party investigation.
2. **States:** `open` $\rightarrow$ `under_investigation` $\rightarrow$ `resolved` $\rightarrow$ `closed`.
3. **Investigation & Resolution:** Operations records interview notes from customer, vendor, and driver. Resolution determines whether merchant penalty, customer credit, or driver retraining is warranted.

---

## 15. Rating Architecture

1. **Dual-Entity Reviews:** Customer submits separate ratings for:
   - **Driver Rating:** Evaluates courier courtesy, punctuality, and handling.
   - **Vendor Rating:** Evaluates food taste, portion size, temperature, and packaging quality.
2. **Fault Isolation:** Driver ratings are shielded from negative reviews caused by kitchen delays, missing items, or food taste issues.
3. **Exclusion of Bounced Orders:** When an order fails due to customer absence or vendor stockouts, no driver penalty rating can be submitted.

---

## 16. Vendor Monthly Billing Architecture

1. **Business Model Separation:** TMD does NOT deduct commission from customer orders or remit food sales payouts. Vendors are billed monthly based on fulfilled order count.
2. **Ledger Entity (`vendor_monthly_billings`):**
   - `billing_period_start` and `billing_period_end` (e.g., calendar month).
   - `order_count`: Total successfully delivered orders for that vendor in the period.
   - `calculated_fee_cents`: Service fee calculated from order volume (`[OPEN DECISION]`).
   - `status`: `pending`, `issued`, `paid`, `overdue`, `waived`.
   - `invoice_number`: Unique invoice identifier.
   - `due_date`: Standard payment terms (e.g., 7 days from issue).

---

## 17. Delivery Pricing Architecture

1. **Distance-Band Tariff (Proposed):**
   - Proposed pricing is structured in discrete 5 km increments at **R 38.00 (3,800 cents) per band**:
     - Band 1 (0.1 – 5.0 km): R 38.00 (`3800` cents)
     - Band 2 (5.1 – 10.0 km): R 76.00 (`7600` cents)
     - Band 3 (10.1 – 15.0 km): R 114.00 (`11400` cents)
     - Band $N$: $N \times 3800$ cents
   - Proposed formula:
     $$\text{band\_index} = \max\left(1, \lceil \text{distance\_km} / 5.0 \rceil\right)$$
     $$\text{delivery\_fee\_cents} = \text{band\_index} \times 3800$$
   - *Note:* The exact rounding behavior, short-distance floor, and distance calculation method are pending confirmation (see Section 29, Open Decisions).
2. **Order Pricing Snapshot:** Order record immutably stores `distance_km`, `distance_band_index`, and `delivery_fee_cents` at checkout time to ensure historical pricing integrity.
3. **Itemization & Shielding:** Delivery fee is strictly itemized separately from food subtotal. TMD internal delivery margins and driver compensation splits are never revealed to customers.

---

## 18. Operating-Hours Architecture

### 18.1 Master Delivery Operating Schedule
- **Monday – Friday:** 08:00 – 18:00 SAST (UTC+2)
- **Saturday – Sunday:** 08:00 – 16:30 SAST (UTC+2)
- **Public Holidays:** Fully Closed

### 18.2 Platform Availability Ceiling Rule
- TMD operating hours represent the ultimate platform ordering ceiling.
- Orders cannot be placed when TMD is closed, regardless of whether a vendor's individual store hours are open.
- Backend validates current server time against the master schedule and `public_holidays` table, rejecting orders outside operating windows with HTTP 403.
- Frontend displays closed-state banner and countdown to the next opening window.

---

## 19. Customer Communication & Support Architecture ("Snapchat Section")

1. **Scope Clarification:** The client's reference to a "Snapchat section" is an **in-app customer order communication and support stream**, NOT an external API integration with Snap Inc.
2. **Capabilities:**
   - Order-linked messaging thread (`customer_order_messages`).
   - Milestone tracking visual cards.
   - Customer image uploads for landmark clarification (e.g., photo of house gate).
   - In-app help button with a direct WhatsApp fallback deep-link (`https://wa.me/27...`).

---

## 20. Receipt Architecture

1. **Tax Status:** TMD is currently NOT VAT registered. Township vendors are predominantly informal, non-VAT registered merchants. No VAT line items are displayed.
2. **Receipt Content:**
   - TMD business header and order reference code.
   - Date, timestamp, customer landmark address, and vendor details.
   - Itemized line items with unit prices, quantities, and item subtotals.
   - Explicit separate line item for Delivery Fee.
   - Total amount paid and payment method (COD or EFT).
3. **Delivery Mechanism:** Available within the app as a printable receipt view and downloadable/emailed summary.

---

## 21. Audit & History Architecture

Every critical operational and financial event is recorded in an immutable audit ledger:
- `order_status_history`: Order status transitions, actor ID, actor role, timestamp, reason.
- `vendor_status_history`: Vendor reviews, approvals, suspensions, removals, and reason category.
- `driver_shifts`: Driver shift start, end, cash collected, cash deposited, and reconciliation discrepancies.
- `payments`: Verification audit (`verified_by_user_id`, `verified_at`, `verification_notes`, `rejection_reason`).
- `refund_requests` & `order_disputes`: Reviewer ID, decision timestamps, and arbitration notes.

---

## 22. Database Entity Map & Verification

### 22.1 Existing Verified Database Tables (Exactly 12 Tables)
The initial Alembic migration (`001_initial_schema.py`) and SQLAlchemy models establish exactly 12 tables:
1. **`profiles`:** User accounts and roles (`CUSTOMER`, `VENDOR`, `DRIVER`, `ADMIN`).
2. **`addresses`:** Landmark-accurate township delivery addresses (`township_block`, `landmark_description`).
3. **`vendors`:** Merchant profiles, status (`PENDING`, `ACTIVE`, `SUSPENDED`), prep time, open flag.
4. **`vendor_members`:** Associates user accounts with vendor stores and member roles (`OWNER`, `MANAGER`, `STAFF`).
5. **`menu_categories`:** Classification of vendor menu items.
6. **`menu_items`:** Menu items with integer ZAR cents pricing (`price_cents`).
7. **`drivers`:** Fleet profiles, vehicle type (`MOTORBIKE`, `BICYCLE`, `CAR`), license plate, online status, current orders count.
8. **`orders`:** Core order entity enforcing single-vendor association, order number, status, subtotal, delivery fee, and total.
9. **`order_items`:** Line items with item snapshot, quantity, unit price, and total price.
10. **`order_status_history`:** Audit log for order milestone transitions.
11. **`deliveries`:** Courier assignments, delivery status (`PENDING`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`, `FAILED`), pickup and delivered timestamps.
12. **`payments`:** Financial transaction records (`amount_cents`, `method`, `status`, `proof_of_payment_url`, `verified_at`).

### 22.2 Candidate New Tables (Domain Architecture Expansion)
13. **`driver_shifts`:** Shift tracking, cash collected, physical deposit, and reconciliation.
14. **`vendor_monthly_billings`:** Monthly order-count service fee statements and invoice tracking.
15. **`refund_requests`:** Customer refund claims, review status, and administrative arbitration.
16. **`order_disputes`:** Order quality disputes and multi-party resolution logs.
17. **`ratings`:** Dual-entity reviews separating driver performance from vendor food quality.
18. **`order_substitutions`:** Out-of-stock item proposals initiated by vendors for customer approval.
19. **`customer_order_messages`:** In-app order communication thread and support messages.
20. **`vendor_status_history`:** Audit log of vendor onboarding approvals, suspensions, and removals.
21. **`public_holidays`:** Calendar of South African public holidays when TMD operations are closed.

---

## 23. Entity Relationships & Domain Isolation

```
profiles (1) ──────────< (N) addresses
profiles (1) ──────────< (N) orders (as customer)
profiles (1) ──────────< (1) drivers (as driver profile)
profiles (1) ──────────< (N) vendor_members

vendors (1) ───────────< (N) vendor_members
vendors (1) ───────────< (N) menu_categories
vendors (1) ───────────< (N) menu_items
vendors (1) ───────────< (N) orders
vendors (1) ───────────< (N) vendor_monthly_billings
vendors (1) ───────────< (N) vendor_status_history

orders (1) ────────────< (N) order_items
orders (1) ────────────< (N) order_status_history
orders (1) ──────────── (1) deliveries
orders (1) ──────────── (1) payments
orders (1) ────────────< (N) order_substitutions
orders (1) ────────────< (N) refund_requests
orders (1) ────────────< (N) order_disputes
orders (1) ────────────< (N) ratings
orders (1) ────────────< (N) customer_order_messages

drivers (1) ───────────< (N) deliveries
drivers (1) ───────────< (N) driver_shifts
drivers (1) ───────────< (N) ratings (as target)
```

---

## 24. Customer-Visible Financial Data

| Financial Element | Visibility | Description |
| :--- | :---: | :--- |
| Menu Item Price | Visible | Displayed on store menu and checkout (`price_cents`). |
| Order Subtotal | Visible | Sum of menu items ordered (`subtotal_cents`). |
| Delivery Fee | Visible | Explicit line item based on distance band (`delivery_fee_cents`). |
| Order Total | Visible | Subtotal + Delivery Fee (`total_cents`). |
| Cash Handover PIN | Visible | Secret PIN revealed on tracking screen for COD handover. |
| Cash Tendered & Change | Visible | Displayed on delivery confirmation and receipt. |

---

## 25. Internal-Only Financial Data

| Financial Element | Visibility | Internal Access & Usage |
| :--- | :---: | :--- |
| TMD Delivery Margin Split | Strictly Hidden | TMD internal operating margin vs. driver payout. |
| Driver Trip Compensation | Hidden from Customer | Remuneration credited to driver for trip completion or bounced delivery. |
| Driver Shift Cash Total | Hidden from Customer | Total cash held by driver during shift; visible only to driver and admin. |
| Shift Reconciliation Discrepancy | Internal Admin Only | Cash audit discrepancy recorded upon shift banking. |
| Vendor Monthly Service Fee | Internal Admin & Vendor | Monthly bill based on fulfilled order count; hidden from customers. |
| Vendor Store Revenue | Vendor & Admin Only | Food sales revenue remains merchant-side; TMD does not handle food payouts. |

---

## 26. API Security Boundaries

1. **Zero Client Database Access:** All database interactions occur on the server. No PostgreSQL credentials or `DATABASE_URL` are exposed to the browser.
2. **JWT Authentication & RBAC:** Tokens contain user UUID, role claims, and short expirations. Protected routes enforce role checks via Flask decorators (`@jwt_required()`, `@role_required`, `@admin_required`).
3. **Password Security:** Salted and hashed using `werkzeug.security` (PBKDF2:SHA256). Plaintext passwords are never persisted.
4. **No Raw Banking Credentials:** Only TMD's public receiving account details are displayed for customer EFT deposits. Customers never enter credit card CVVs, online banking passwords, or bank login credentials.
5. **CORS & Environment Separation:** Strict CORS whitelist restricting origins in production; sensitive credentials managed via environment variables (`SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`).

---

## 27. Deferred Features (Out-of-Scope for MVP)

1. **Live GPS Background Streaming:** Continuous driver tracking on maps is deferred to conserve mobile data and battery. Milestone progression provides sufficient transparency.
2. **Automated Algorithmic Dispatch (TSP):** Automated route optimization is deferred. Manual dispatcher allocation is superior for a 2-driver fleet.
3. **Native Mobile App Binaries:** Native iOS/Android app store builds are deferred; responsive PWA satisfies all mobile touch requirements.
4. **Multi-Vendor Carts:** Combining goods from multiple vendors into a single checkout is deferred (enforced invariant: ONE ORDER = ONE VENDOR).
5. **Automated Third-Party Payment Webhooks:** Real-time card debit gateways are deferred; MVP relies on Cash on Delivery and verified EFT.
6. **External Snapchat API Integration:** Direct API integration with Snap Inc. is out-of-scope; replaced by an in-app order communication thread.
7. **Automated Vendor Order Payouts:** TMD does not collect food revenues or remit payouts to vendors.

---

## 28. Architectural Domain Decoupling Invariants

To maintain clean boundaries and avoid architectural slop, the following domains MUST remain strictly separated in code and schema:
1. **ORDER:** Commercial and culinary contract between customer and vendor (`orders`, `order_items`).
2. **PAYMENT:** Financial transaction, reflection status, and verification audit (`payments`).
3. **DELIVERY:** Physical transport and courier logistics (`deliveries`).
4. **DISPATCH:** Queue management and fleet capacity allocation (server-side capacity rule $\le 3$).
5. **DRIVER SHIFT:** Timekeeping and active work window (`driver_shifts`).
6. **CASH CUSTODY:** Physical money collected, held, deposited, and reconciled (`driver_shifts`, `payments`).
7. **VENDOR BILLING:** Periodic platform service fee accounting (`vendor_monthly_billings`).
8. **REFUND:** Money return claims and approvals (`refund_requests`).
9. **DISPUTE:** Multi-party complaint arbitration (`order_disputes`).
10. **RATING:** Customer feedback isolated by target entity (`ratings`).
11. **AUDIT:** Historical state transition records (`order_status_history`, `vendor_status_history`).

---

## 29. Open Decisions / Unresolved Business Rules (`[OPEN DECISION]`)

The following items represent business rules where exact parameters have not yet been finalized by the client. The architecture has been designed to accommodate them flexibly without hardcoding premature assumptions:

1. **`[OPEN DECISION]` Partial 5 km Increment Rounding:**
   - *Issue:* Confirmation whether partial distance increments strictly round upward to the next full R38 band (e.g., 5.1 km = R76), or if a tolerance buffer exists.
   - *Status:* Proposed formula uses $\lceil \text{distance} / 5.0 \rceil \times 3800$, awaiting client confirmation.
2. **`[OPEN DECISION]` Distance Calculation Engine:**
   - *Issue:* Determination of the exact distance calculation method: road-routing distance (via Google Maps / OSRM API), straight-line Haversine formula, or a fixed township block-to-block lookup matrix.
   - *Status:* Unresolved; data model stores `distance_km` as a generic float.
3. **`[OPEN DECISION]` Minimum Distance Floor (0–1 km):**
   - *Issue:* Confirmation whether an ultra-short distance discount tier applies (e.g., intra-block delivery < 1 km = R25), or if Band 1 (R38) applies universally from 0 km to 5 km.
   - *Status:* Unresolved.
4. **`[OPEN DECISION]` Vendor Monthly Fee Formula:**
   - *Issue:* Exact formula for charging vendors based on monthly completed order volume.
   - *Options:* Tiered volume brackets (e.g., 0–50 orders = R300, 51–150 = R600), flat per-order fee (e.g., R5/order), or base subscription + order commission.
   - *Status:* Unresolved; `vendor_monthly_billings` captures `order_count` and `calculated_fee_cents` without enforcing a rigid formula.
5. **`[OPEN DECISION]` Driver Bounced Delivery Compensation Amount:**
   - *Issue:* Remuneration amount for a driver when a delivery bounces through customer absence or payment refusal.
   - *Options:* Full delivery fee (R38), a flat return stipend (e.g., R20), or a percentage of the trip fee.
   - *Status:* Unresolved; `deliveries.trip_compensation_cents` stores the awarded amount dynamically.
6. **`[OPEN DECISION]` Customer Handover PIN Format:**
   - *Issue:* Specific length and format of the handover verification PIN (e.g., 4 digits, 6 digits, alphanumeric).
   - *Status:* Unresolved; model treats PIN as a secure string without hardcoding digit length.
7. **`[OPEN DECISION]` Customer Payment Information Scope:**
   - *Issue:* Clarification of the client phrase "customer must provide bank account/payment info". To prevent security and compliance violations, raw credentials will not be collected. Client must confirm if this refers only to payment reference, bank name, or account holder name for EFT reconciliation.
   - *Status:* Unresolved.
8. **`[OPEN DECISION]` Refund Approval Authority:**
   - *Issue:* Whether vendor operators can self-approve micro-refunds (e.g., < R50 for a missing drink), or if all refunds must be arbitrated by TMD central operations.
   - *Status:* Unresolved.
9. **`[OPEN DECISION]` Rating Scale & Feedback Criteria:**
   - *Issue:* Whether ratings use a 1–5 star scale, thumbs-up/down binary, or mandatory tag selections for low scores.
   - *Status:* Unresolved.
10. **`[OPEN DECISION]` Customer Support Communication Retention & Privacy:**
    - *Issue:* Message retention window, archiving, and privacy constraints for in-app order chat messages between customer, driver, and TMD support.
    - *Status:* Unresolved.
11. **`[OPEN DECISION]` Receipt & Invoice Legal Registration Numbers:**
    - *Issue:* Required CIPC business registration number or tax reference numbers to be displayed on formal vendor monthly invoices.
    - *Status:* Unresolved.
12. **`[OPEN DECISION]` Driver Cash Float & Change Policy:**
    - *Issue:* Whether drivers are issued a daily cash float (e.g., R100 in small change) by TMD operations, or if change is strictly subject to driver availability.
    - *Status:* Unresolved.
13. **`[OPEN DECISION]` Electronic Payment Verification SLA & Order Expiry:**
    - *Issue:* Maximum time window allowed for customer to submit proof of payment (if required) and for admin to verify funds before an unreflected EFT order automatically expires or cancels.
    - *Status:* Unresolved.
