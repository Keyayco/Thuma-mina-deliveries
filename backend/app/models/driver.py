from app.extensions import db
from datetime import datetime
import uuid
import enum

class VehicleType(str, enum.Enum):
    MOTORBIKE = "motorbike"
    BICYCLE = "bicycle"
    CAR = "car"

class Driver(db.Model):
    """Driver profile for delivery fulfillment."""
    __tablename__ = "drivers"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    vehicle_type = db.Column(db.Enum(VehicleType), default=VehicleType.MOTORBIKE, nullable=False)
    license_plate = db.Column(db.String(50), nullable=True)
    is_online = db.Column(db.Boolean, default=False, nullable=False)
    current_orders_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="driver_profile")
    deliveries = db.relationship("Delivery", back_populates="driver")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "vehicle_type": self.vehicle_type.value if hasattr(self.vehicle_type, "value") else str(self.vehicle_type),
            "license_plate": self.license_plate,
            "is_online": self.is_online,
            "current_orders_count": self.current_orders_count,
        }
