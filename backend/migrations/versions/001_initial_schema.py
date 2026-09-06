"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-05 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 1. Profiles (Users) table
    op.create_table(
        'profiles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('role', sa.Enum('CUSTOMER', 'VENDOR', 'DRIVER', 'ADMIN', name='userrole'), nullable=False, server_default='CUSTOMER'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_profiles_email', 'profiles', ['email'], unique=True)

    # 2. Addresses table
    op.create_table(
        'addresses',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('label', sa.String(length=50), nullable=True),
        sa.Column('township_block', sa.String(length=50), nullable=False),
        sa.Column('landmark_description', sa.Text(), nullable=False),
        sa.Column('street_address', sa.String(length=255), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_addresses_user_id', 'addresses', ['user_id'])

    # 3. Vendors table
    op.create_table(
        'vendors',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('township_block', sa.String(length=50), nullable=False),
        sa.Column('landmark_description', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'ACTIVE', 'SUSPENDED', name='vendorstatus'), nullable=False, server_default='ACTIVE'),
        sa.Column('prep_time_minutes', sa.Integer(), nullable=False, server_default='25'),
        sa.Column('is_open', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_vendors_slug', 'vendors', ['slug'], unique=True)

    # 4. Vendor Members table
    op.create_table(
        'vendor_members',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('vendor_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('member_role', sa.Enum('OWNER', 'MANAGER', 'STAFF', name='vendormemberrole'), nullable=False, server_default='STAFF'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_vendor_members_vendor_id', 'vendor_members', ['vendor_id'])
    op.create_index('ix_vendor_members_user_id', 'vendor_members', ['user_id'])

    # 5. Menu Categories table
    op.create_table(
        'menu_categories',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('vendor_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_menu_categories_vendor_id', 'menu_categories', ['vendor_id'])

    # 6. Menu Items table
    op.create_table(
        'menu_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('vendor_id', sa.String(length=36), nullable=False),
        sa.Column('category_id', sa.String(length=36), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_cents', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['menu_categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_menu_items_vendor_id', 'menu_items', ['vendor_id'])

    # 7. Drivers table
    op.create_table(
        'drivers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('vehicle_type', sa.Enum('MOTORBIKE', 'BICYCLE', 'CAR', name='vehicletype'), nullable=False, server_default='MOTORBIKE'),
        sa.Column('license_plate', sa.String(length=50), nullable=True),
        sa.Column('is_online', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('current_orders_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # 8. Orders table (Enforces ONE ORDER = ONE VENDOR)
    op.create_table(
        'orders',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_number', sa.String(length=50), nullable=False),
        sa.Column('customer_id', sa.String(length=36), nullable=False),
        sa.Column('vendor_id', sa.String(length=36), nullable=False),
        sa.Column('delivery_address_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED', name='orderstatus'), nullable=False, server_default='PENDING'),
        sa.Column('subtotal_cents', sa.Integer(), nullable=False),
        sa.Column('delivery_fee_cents', sa.Integer(), nullable=False, server_default='2000'),
        sa.Column('total_cents', sa.Integer(), nullable=False),
        sa.Column('customer_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['profiles.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['delivery_address_id'], ['addresses.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_orders_order_number', 'orders', ['order_number'], unique=True)
    op.create_index('ix_orders_customer_id', 'orders', ['customer_id'])
    op.create_index('ix_orders_vendor_id', 'orders', ['vendor_id'])
    op.create_index('ix_orders_status', 'orders', ['status'])

    # 9. Order Items table
    op.create_table(
        'order_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('menu_item_id', sa.String(length=36), nullable=False),
        sa.Column('item_name', sa.String(length=255), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('unit_price_cents', sa.Integer(), nullable=False),
        sa.Column('total_price_cents', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_order_items_order_id', 'order_items', ['order_id'])

    # 10. Order Status History table
    op.create_table(
        'order_status_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_order_status_history_order_id', 'order_status_history', ['order_id'])

    # 11. Deliveries table
    op.create_table(
        'deliveries',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('driver_id', sa.String(length=36), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED', name='deliverystatus'), nullable=False, server_default='PENDING'),
        sa.Column('pickup_time', sa.DateTime(), nullable=True),
        sa.Column('delivered_time', sa.DateTime(), nullable=True),
        sa.Column('delivery_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id')
    )

    # 12. Payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('method', sa.Enum('CASH', 'EFT', name='paymentmethod'), nullable=False, server_default='CASH'),
        sa.Column('status', sa.Enum('PENDING', 'COMPLETED', 'FAILED', name='paymentstatus'), nullable=False, server_default='PENDING'),
        sa.Column('proof_of_payment_url', sa.String(length=500), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id')
    )

def downgrade():
    op.drop_table('payments')
    op.drop_table('deliveries')
    op.drop_table('order_status_history')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('drivers')
    op.drop_table('menu_items')
    op.drop_table('menu_categories')
    op.drop_table('vendor_members')
    op.drop_table('vendors')
    op.drop_table('addresses')
    op.drop_table('profiles')
