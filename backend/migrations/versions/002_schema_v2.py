"""002_schema_v2

Revision ID: 002_schema_v2
Revises: 001_initial_schema
Create Date: 2026-09-12 12:00:00.000000

Evolution migration from 001_initial_schema to TMD Architecture V2.0.1 (Schema Design V2).
Alters 8 existing tables, adds 9 new normalized domain tables, creates new enums,
and adds check constraints, indexes, and foreign keys.

DO NOT EXECUTE DIRECTLY.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_schema_v2'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'

    # -------------------------------------------------------------------------
    # 1. ENUM EXTENSIONS (PostgreSQL specific)
    # -------------------------------------------------------------------------
    if is_postgres:
        # Extend vendorstatus enum with V2 lifecycle states
        op.execute(sa.text("ALTER TYPE vendorstatus ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';"))
        op.execute(sa.text("ALTER TYPE vendorstatus ADD VALUE IF NOT EXISTS 'REJECTED';"))
        op.execute(sa.text("ALTER TYPE vendorstatus ADD VALUE IF NOT EXISTS 'REMOVED';"))

        # Extend orderstatus enum with terminal FAILED state
        op.execute(sa.text("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'FAILED';"))

    # -------------------------------------------------------------------------
    # 2. ALTER EXISTING TABLES
    # -------------------------------------------------------------------------

    # 2.1 addresses: Add optional latitude and longitude for routing
    op.add_column('addresses', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('addresses', sa.Column('longitude', sa.Float(), nullable=True))

    # 2.2 vendors: Add presentation, operating hours, and location
    op.add_column('vendors', sa.Column('logo_url', sa.String(length=500), nullable=True))
    op.add_column('vendors', sa.Column('banner_url', sa.String(length=500), nullable=True))
    op.add_column(
        'vendors',
        sa.Column(
            'operating_hours',
            postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), 'sqlite'),
            nullable=True
        )
    )
    op.add_column('vendors', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('vendors', sa.Column('longitude', sa.Float(), nullable=True))

    # 2.3 menu_items: Add customer prep notes and non-negative price check
    op.add_column('menu_items', sa.Column('preparation_notes', sa.Text(), nullable=True))
    op.create_check_constraint('ck_menu_items_price_cents', 'menu_items', 'price_cents >= 0')

    # 2.4 drivers: Add capacity ceiling check constraint (Layer 1 safety boundary)
    op.create_check_constraint(
        'ck_drivers_current_orders_count',
        'drivers',
        'current_orders_count >= 0 AND current_orders_count <= 3'
    )

    # 2.5 orders: Add pricing snapshots, handover PIN, cancellation/rejection reasons, checks
    op.add_column('orders', sa.Column('distance_km', sa.Float(), nullable=True))
    op.add_column('orders', sa.Column('distance_band_index', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('pricing_rule_version', sa.String(length=20), nullable=True))
    op.add_column('orders', sa.Column('cash_handover_pin', sa.String(length=64), nullable=True))
    op.add_column('orders', sa.Column('vendor_rejection_reason', sa.Text(), nullable=True))
    op.add_column('orders', sa.Column('cancellation_reason', sa.Text(), nullable=True))
    op.create_check_constraint('ck_orders_subtotal_cents', 'orders', 'subtotal_cents >= 0')
    op.create_check_constraint('ck_orders_delivery_fee_cents', 'orders', 'delivery_fee_cents >= 0')
    op.create_check_constraint('ck_orders_total_cents', 'orders', 'total_cents >= 0')
    op.create_check_constraint('ck_orders_distance_km', 'orders', 'distance_km IS NULL OR distance_km >= 0')

    # 2.6 order_status_history: Add actor traceability
    op.add_column('order_status_history', sa.Column('changed_by_user_id', sa.String(length=36), nullable=True))
    op.add_column('order_status_history', sa.Column('actor_role', sa.String(length=20), nullable=True))
    op.create_foreign_key(
        'fk_order_status_history_changed_by_user_id',
        'order_status_history',
        'profiles',
        ['changed_by_user_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_order_status_history_changed_by_user_id', 'order_status_history', ['changed_by_user_id'])

    # 2.7 deliveries: Add assignment timing, PIN verification, fault tracking, compensation
    op.add_column('deliveries', sa.Column('assigned_time', sa.DateTime(), nullable=True))
    op.add_column('deliveries', sa.Column('pin_verified', sa.Boolean(), nullable=True))
    op.add_column('deliveries', sa.Column('failure_reason', sa.String(length=50), nullable=True))
    op.add_column('deliveries', sa.Column('driver_at_fault', sa.Boolean(), nullable=True))
    op.add_column('deliveries', sa.Column('trip_compensation_cents', sa.Integer(), nullable=False, server_default='0'))
    op.create_check_constraint('ck_deliveries_trip_compensation_cents', 'deliveries', 'trip_compensation_cents >= 0')

    # 2.8 payments: Add EFT verification fields, cash handover reconciliation, and checks
    op.add_column('payments', sa.Column('payment_reference', sa.String(length=50), nullable=True))
    op.add_column('payments', sa.Column('payment_reflected', sa.Boolean(), nullable=True))
    op.add_column('payments', sa.Column('proof_required', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('payments', sa.Column('verified_by_user_id', sa.String(length=36), nullable=True))
    op.add_column('payments', sa.Column('verification_notes', sa.Text(), nullable=True))
    op.add_column('payments', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('payments', sa.Column('cash_tendered_cents', sa.Integer(), nullable=True))
    op.add_column('payments', sa.Column('change_returned_cents', sa.Integer(), nullable=True))
    op.add_column('payments', sa.Column('tip_cents', sa.Integer(), nullable=False, server_default='0'))
    op.create_foreign_key(
        'fk_payments_verified_by_user_id',
        'payments',
        'profiles',
        ['verified_by_user_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_payments_payment_reference', 'payments', ['payment_reference'], unique=True)
    op.create_index('ix_payments_verified_by_user_id', 'payments', ['verified_by_user_id'])
    op.create_check_constraint('ck_payments_amount_cents', 'payments', 'amount_cents >= 0')
    op.create_check_constraint('ck_payments_tip_cents', 'payments', 'tip_cents >= 0')
    op.create_check_constraint('ck_payments_cash_tendered_cents', 'payments', 'cash_tendered_cents IS NULL OR cash_tendered_cents >= 0')
    op.create_check_constraint('ck_payments_change_returned_cents', 'payments', 'change_returned_cents IS NULL OR change_returned_cents >= 0')

    # -------------------------------------------------------------------------
    # 3. CREATE NEW DOMAIN TABLES
    # -------------------------------------------------------------------------

    # 3.1 public_holidays (Operational Schedule Calendar)
    op.create_table(
        'public_holidays',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('holiday_date', sa.Date(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('is_closed', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('holiday_date', name='uq_public_holidays_holiday_date')
    )

    # 3.2 vendor_status_history (Vendor Governance & Lifecycle Audit)
    op.create_table(
        'vendor_status_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('vendor_id', sa.String(length=36), nullable=False),
        sa.Column('previous_status', sa.String(length=50), nullable=True),
        sa.Column('new_status', sa.String(length=50), nullable=False),
        sa.Column('reason_category', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('changed_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['changed_by_user_id'], ['profiles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_vendor_status_history_vendor_id', 'vendor_status_history', ['vendor_id'])
    op.create_index('ix_vendor_status_history_created_at', 'vendor_status_history', ['created_at'])

    # 3.3 vendor_monthly_billings (Vendor Platform Fee Ledger)
    op.create_table(
        'vendor_monthly_billings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('vendor_id', sa.String(length=36), nullable=False),
        sa.Column('invoice_number', sa.String(length=50), nullable=False),
        sa.Column('billing_period_start', sa.Date(), nullable=False),
        sa.Column('billing_period_end', sa.Date(), nullable=False),
        sa.Column('order_count', sa.Integer(), nullable=False),
        sa.Column('calculated_fee_cents', sa.Integer(), nullable=False),
        sa.Column(
            'status',
            sa.Enum('PENDING', 'ISSUED', 'PAID', 'OVERDUE', 'WAIVED', name='billing_status'),
            nullable=False,
            server_default='PENDING'
        ),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('payment_reference', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['profiles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number', name='uq_vendor_monthly_billings_invoice_number'),
        sa.UniqueConstraint('vendor_id', 'billing_period_start', 'billing_period_end', name='uq_vendor_billing_period'),
        sa.CheckConstraint('billing_period_end >= billing_period_start', name='ck_billing_period_dates'),
        sa.CheckConstraint('order_count >= 0', name='ck_billing_order_count'),
        sa.CheckConstraint('calculated_fee_cents >= 0', name='ck_billing_fee_cents')
    )
    op.create_index('ix_vendor_monthly_billings_vendor_id', 'vendor_monthly_billings', ['vendor_id'])
    op.create_index('ix_vendor_monthly_billings_status', 'vendor_monthly_billings', ['status'])

    # 3.4 driver_shifts (Driver Shift & Cash Custody)
    op.create_table(
        'driver_shifts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('driver_id', sa.String(length=36), nullable=False),
        sa.Column(
            'shift_status',
            sa.Enum('ACTIVE', 'COMPLETED', 'RECONCILED', name='driver_shift_status'),
            nullable=False,
            server_default='ACTIVE'
        ),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('cash_collected_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('cash_deposited_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('expected_deposit_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reconciliation_discrepancy_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reconciliation_notes', sa.Text(), nullable=True),
        sa.Column('reconciled_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('reconciled_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['reconciled_by_user_id'], ['profiles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('cash_collected_cents >= 0', name='ck_driver_shifts_cash_collected'),
        sa.CheckConstraint('cash_deposited_cents >= 0', name='ck_driver_shifts_cash_deposited'),
        sa.CheckConstraint('expected_deposit_cents >= 0', name='ck_driver_shifts_expected_deposit')
    )
    op.create_index('ix_driver_shifts_driver_id', 'driver_shifts', ['driver_id'])
    op.create_index('ix_driver_shifts_shift_status', 'driver_shifts', ['shift_status'])

    # Partial unique index ensuring at most ONE active shift per driver (PostgreSQL)
    if is_postgres:
        op.create_index(
            'uq_driver_active_shift',
            'driver_shifts',
            ['driver_id'],
            unique=True,
            postgresql_where=sa.text("shift_status = 'ACTIVE'")
        )
    else:
        op.create_index(
            'uq_driver_active_shift',
            'driver_shifts',
            ['driver_id'],
            unique=False
        )

    # 3.5 order_disputes (Order Quality & Conduct Disputes)
    op.create_table(
        'order_disputes',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('opened_by_user_id', sa.String(length=36), nullable=False),
        sa.Column(
            'dispute_type',
            sa.Enum(
                'MISSING_ITEMS',
                'FOOD_QUALITY',
                'DELIVERY_CONDUCT',
                'PACKAGING_DAMAGE',
                'EXTREME_DELAY',
                'OTHER',
                name='dispute_type'
            ),
            nullable=False
        ),
        sa.Column(
            'status',
            sa.Enum('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', name='dispute_status'),
            nullable=False,
            server_default='OPEN'
        ),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('resolution', sa.Text(), nullable=True),
        sa.Column('resolved_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('opened_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['opened_by_user_id'], ['profiles.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['resolved_by_user_id'], ['profiles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_order_disputes_order_id', 'order_disputes', ['order_id'])
    op.create_index('ix_order_disputes_opened_by_user_id', 'order_disputes', ['opened_by_user_id'])
    op.create_index('ix_order_disputes_status', 'order_disputes', ['status'])

    # 3.6 refund_requests (Customer Refund Claims, linked optionally to order_disputes)
    op.create_table(
        'refund_requests',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('customer_id', sa.String(length=36), nullable=False),
        sa.Column('dispute_id', sa.String(length=36), nullable=True),
        sa.Column('requested_amount_cents', sa.Integer(), nullable=False),
        sa.Column('approved_amount_cents', sa.Integer(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('evidence_url', sa.String(length=500), nullable=True),
        sa.Column(
            'status',
            sa.Enum('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSED', name='refund_status'),
            nullable=False,
            server_default='REQUESTED'
        ),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['profiles.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['dispute_id'], ['order_disputes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['reviewed_by_user_id'], ['profiles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('requested_amount_cents > 0', name='ck_refund_requests_requested_amount'),
        sa.CheckConstraint('approved_amount_cents IS NULL OR approved_amount_cents >= 0', name='ck_refund_requests_approved_amount')
    )
    op.create_index('ix_refund_requests_order_id', 'refund_requests', ['order_id'])
    op.create_index('ix_refund_requests_customer_id', 'refund_requests', ['customer_id'])
    op.create_index('ix_refund_requests_dispute_id', 'refund_requests', ['dispute_id'])
    op.create_index('ix_refund_requests_status', 'refund_requests', ['status'])

    # 3.7 ratings (Dual-Entity Customer Reviews)
    op.create_table(
        'ratings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('customer_id', sa.String(length=36), nullable=False),
        sa.Column('driver_id', sa.String(length=36), nullable=True),
        sa.Column('vendor_id', sa.String(length=36), nullable=False),
        sa.Column('driver_score', sa.Integer(), nullable=True),
        sa.Column('driver_feedback', sa.Text(), nullable=True),
        sa.Column('vendor_score', sa.Integer(), nullable=True),
        sa.Column('vendor_feedback', sa.Text(), nullable=True),
        sa.Column('driver_shielded', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['profiles.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id', name='uq_ratings_order_id'),
        sa.CheckConstraint('driver_score IS NULL OR driver_score >= 0', name='ck_ratings_driver_score'),
        sa.CheckConstraint('vendor_score IS NULL OR vendor_score >= 0', name='ck_ratings_vendor_score')
    )
    op.create_index('ix_ratings_customer_id', 'ratings', ['customer_id'])
    op.create_index('ix_ratings_driver_id', 'ratings', ['driver_id'])
    op.create_index('ix_ratings_vendor_id', 'ratings', ['vendor_id'])

    # 3.8 order_substitutions (Out-of-Stock Item Proposals)
    op.create_table(
        'order_substitutions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('original_item_id', sa.String(length=36), nullable=False),
        sa.Column('proposed_menu_item_id', sa.String(length=36), nullable=False),
        sa.Column(
            'status',
            sa.Enum('PROPOSED', 'ACCEPTED', 'REJECTED', name='substitution_status'),
            nullable=False,
            server_default='PROPOSED'
        ),
        sa.Column('price_difference_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('vendor_note', sa.Text(), nullable=True),
        sa.Column('customer_response_note', sa.Text(), nullable=True),
        sa.Column('proposed_at', sa.DateTime(), nullable=False),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['original_item_id'], ['order_items.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['proposed_menu_item_id'], ['menu_items.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_order_substitutions_order_id', 'order_substitutions', ['order_id'])
    op.create_index('ix_order_substitutions_original_item_id', 'order_substitutions', ['original_item_id'])
    op.create_index('ix_order_substitutions_proposed_menu_item_id', 'order_substitutions', ['proposed_menu_item_id'])

    # 3.9 customer_order_messages (In-App Support Thread)
    op.create_table(
        'customer_order_messages',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('sender_id', sa.String(length=36), nullable=False),
        sa.Column('sender_role', sa.String(length=20), nullable=False),
        sa.Column('message_text', sa.Text(), nullable=False),
        sa.Column('media_url', sa.String(length=500), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['sender_id'], ['profiles.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_customer_order_messages_order_id', 'customer_order_messages', ['order_id'])
    op.create_index('ix_customer_order_messages_sender_id', 'customer_order_messages', ['sender_id'])
    op.create_index('ix_customer_order_messages_created_at', 'customer_order_messages', ['created_at'])


def downgrade():
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'

    # -------------------------------------------------------------------------
    # 1. DROP NEW DOMAIN TABLES (in reverse dependency order)
    # -------------------------------------------------------------------------
    op.drop_table('customer_order_messages')
    op.drop_table('order_substitutions')
    op.drop_table('ratings')
    op.drop_table('refund_requests')
    op.drop_table('order_disputes')

    # Drop partial index then driver_shifts table
    if is_postgres:
        op.drop_index('uq_driver_active_shift', table_name='driver_shifts')
    op.drop_table('driver_shifts')

    op.drop_table('vendor_monthly_billings')
    op.drop_table('vendor_status_history')
    op.drop_table('public_holidays')

    # Drop new enum types on PostgreSQL
    if is_postgres:
        op.execute(sa.text("DROP TYPE IF EXISTS substitution_status;"))
        op.execute(sa.text("DROP TYPE IF EXISTS dispute_status;"))
        op.execute(sa.text("DROP TYPE IF EXISTS dispute_type;"))
        op.execute(sa.text("DROP TYPE IF EXISTS refund_status;"))
        op.execute(sa.text("DROP TYPE IF EXISTS driver_shift_status;"))
        op.execute(sa.text("DROP TYPE IF EXISTS billing_status;"))
        # Note: PostgreSQL does not support dropping individual values added to existing enums
        # (vendorstatus, orderstatus) without dropping and rebuilding the types.

    # -------------------------------------------------------------------------
    # 2. REVERT ALTERATIONS TO EXISTING TABLES
    # -------------------------------------------------------------------------

    # 2.1 Revert payments alterations
    op.drop_constraint('ck_payments_change_returned_cents', 'payments', type_='check')
    op.drop_constraint('ck_payments_cash_tendered_cents', 'payments', type_='check')
    op.drop_constraint('ck_payments_tip_cents', 'payments', type_='check')
    op.drop_constraint('ck_payments_amount_cents', 'payments', type_='check')
    op.drop_index('ix_payments_verified_by_user_id', table_name='payments')
    op.drop_index('ix_payments_payment_reference', table_name='payments')
    op.drop_constraint('fk_payments_verified_by_user_id', 'payments', type_='foreignkey')
    op.drop_column('payments', 'tip_cents')
    op.drop_column('payments', 'change_returned_cents')
    op.drop_column('payments', 'cash_tendered_cents')
    op.drop_column('payments', 'rejection_reason')
    op.drop_column('payments', 'verification_notes')
    op.drop_column('payments', 'verified_by_user_id')
    op.drop_column('payments', 'proof_required')
    op.drop_column('payments', 'payment_reflected')
    op.drop_column('payments', 'payment_reference')

    # 2.2 Revert deliveries alterations
    op.drop_constraint('ck_deliveries_trip_compensation_cents', 'deliveries', type_='check')
    op.drop_column('deliveries', 'trip_compensation_cents')
    op.drop_column('deliveries', 'driver_at_fault')
    op.drop_column('deliveries', 'failure_reason')
    op.drop_column('deliveries', 'pin_verified')
    op.drop_column('deliveries', 'assigned_time')

    # 2.3 Revert order_status_history alterations
    op.drop_index('ix_order_status_history_changed_by_user_id', table_name='order_status_history')
    op.drop_constraint('fk_order_status_history_changed_by_user_id', 'order_status_history', type_='foreignkey')
    op.drop_column('order_status_history', 'actor_role')
    op.drop_column('order_status_history', 'changed_by_user_id')

    # 2.4 Revert orders alterations
    op.drop_constraint('ck_orders_distance_km', 'orders', type_='check')
    op.drop_constraint('ck_orders_total_cents', 'orders', type_='check')
    op.drop_constraint('ck_orders_delivery_fee_cents', 'orders', type_='check')
    op.drop_constraint('ck_orders_subtotal_cents', 'orders', type_='check')
    op.drop_column('orders', 'cancellation_reason')
    op.drop_column('orders', 'vendor_rejection_reason')
    op.drop_column('orders', 'cash_handover_pin')
    op.drop_column('orders', 'pricing_rule_version')
    op.drop_column('orders', 'distance_band_index')
    op.drop_column('orders', 'distance_km')

    # 2.5 Revert drivers alterations
    op.drop_constraint('ck_drivers_current_orders_count', 'drivers', type_='check')

    # 2.6 Revert menu_items alterations
    op.drop_constraint('ck_menu_items_price_cents', 'menu_items', type_='check')
    op.drop_column('menu_items', 'preparation_notes')

    # 2.7 Revert vendors alterations
    op.drop_column('vendors', 'longitude')
    op.drop_column('vendors', 'latitude')
    op.drop_column('vendors', 'operating_hours')
    op.drop_column('vendors', 'banner_url')
    op.drop_column('vendors', 'logo_url')

    # 2.8 Revert addresses alterations
    op.drop_column('addresses', 'longitude')
    op.drop_column('addresses', 'latitude')
