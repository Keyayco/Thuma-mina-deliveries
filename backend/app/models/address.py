from app.extensions import db
from datetime import datetime
import uuid

class Address(db.Model):
    """Customer and vendor delivery address entity."""
    __tablename__ = "addresses"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    label = db.Column(db.String(50), nullable=True, default="Home")
    township_block = db.Column(db.String(50), nullable=False)  # e.g., Block L, Block BB
    landmark_description = db.Column(db.Text, nullable=False)  # Required for Soshanguve navigation
    street_address = db.Column(db.String(255), nullable=True)
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="addresses")
    orders = db.relationship("Order", back_populates="delivery_address")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "label": self.label,
            "township_block": self.township_block,
            "landmark_description": self.landmark_description,
            "street_address": self.street_address,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
