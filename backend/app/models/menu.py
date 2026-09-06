from app.extensions import db
from datetime import datetime
import uuid

class MenuCategory(db.Model):
    """Menu category belonging to a single vendor."""
    __tablename__ = "menu_categories"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = db.Column(db.String(36), db.ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    vendor = db.relationship("Vendor", back_populates="categories")
    items = db.relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "vendor_id": self.vendor_id,
            "name": self.name,
            "sort_order": self.sort_order,
        }

class MenuItem(db.Model):
    """Menu item product belonging to a vendor and category."""
    __tablename__ = "menu_items"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = db.Column(db.String(36), db.ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = db.Column(db.String(36), db.ForeignKey("menu_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price_cents = db.Column(db.Integer, nullable=False)  # Stored in integer ZAR cents (e.g., 6500 = R 65.00)
    image_url = db.Column(db.String(500), nullable=True)
    is_available = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    vendor = db.relationship("Vendor", back_populates="items")
    category = db.relationship("MenuCategory", back_populates="items")
    order_items = db.relationship("OrderItem", back_populates="menu_item")

    def to_dict(self):
        return {
            "id": self.id,
            "vendor_id": self.vendor_id,
            "category_id": self.category_id,
            "name": self.name,
            "description": self.description,
            "price_cents": self.price_cents,
            "image_url": self.image_url,
            "is_available": self.is_available,
        }
