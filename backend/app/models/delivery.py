from app.extensions import db
from datetime import datetime
import uuid
import enum

class DeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    FAILED = "failed"

class Delivery(db.Model):
    """Delivery assignment and milestone tracking for the 2-bike fleet."""
    __tablename__ = "deliveries"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    driver_id = db.Column(db.String(36), db.ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True, index=True)
    status = db.Column(db.Enum(DeliveryStatus), default=DeliveryStatus.PENDING, nullable=False)
    pickup_time = db.Column(db.DateTime, nullable=True)
    delivered_time = db.Column(db.DateTime, nullable=True)
    delivery_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    order = db.relationship("Order", back_populates="delivery")
    driver = db.relationship("Driver", back_populates="deliveries")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "driver_id": self.driver_id,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "pickup_time": self.pickup_time.isoformat() if self.pickup_time else None,
            "delivered_time": self.delivered_time.isoformat() if self.delivered_time else None,
        }
