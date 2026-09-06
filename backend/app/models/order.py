from app.extensions import db
from datetime import datetime
import uuid
import enum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class Order(db.Model):
    """Customer order entity. Enforces ONE ORDER = ONE VENDOR business invariant."""
    __tablename__ = "orders"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.String(36), db.ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False, index=True)
    vendor_id = db.Column(db.String(36), db.ForeignKey("vendors.id", ondelete="RESTRICT"), nullable=False, index=True)
    delivery_address_id = db.Column(db.String(36), db.ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False)
    status = db.Column(db.Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    subtotal_cents = db.Column(db.Integer, nullable=False)
    delivery_fee_cents = db.Column(db.Integer, default=2000, nullable=False)  # Standard R20.00
    total_cents = db.Column(db.Integer, nullable=False)
    customer_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = db.relationship("User", back_populates="orders", foreign_keys=[customer_id])
    vendor = db.relationship("Vendor", back_populates="orders")
    delivery_address = db.relationship("Address", back_populates="orders")
    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = db.relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    delivery = db.relationship("Delivery", back_populates="order", uselist=False, cascade="all, delete-orphan")
    payment = db.relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "customer_id": self.customer_id,
            "vendor_id": self.vendor_id,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "subtotal_cents": self.subtotal_cents,
            "delivery_fee_cents": self.delivery_fee_cents,
            "total_cents": self.total_cents,
            "customer_notes": self.customer_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class OrderItem(db.Model):
    """Line item in an order."""
    __tablename__ = "order_items"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    menu_item_id = db.Column(db.String(36), db.ForeignKey("menu_items.id", ondelete="RESTRICT"), nullable=False)
    item_name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    unit_price_cents = db.Column(db.Integer, nullable=False)
    total_price_cents = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text, nullable=True)

    order = db.relationship("Order", back_populates="items")
    menu_item = db.relationship("MenuItem", back_populates="order_items")
