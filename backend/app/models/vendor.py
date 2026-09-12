from app.extensions import db
from datetime import datetime
import uuid
import enum

class VendorStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"

class VendorMemberRole(str, enum.Enum):
    OWNER = "owner"
    MANAGER = "manager"
    STAFF = "staff"

class Vendor(db.Model):
    """Registered vendor / restaurant entity."""
    __tablename__ = "vendors"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    township_block = db.Column(db.String(50), nullable=False)
    landmark_description = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum(VendorStatus, name="vendorstatus"), default=VendorStatus.ACTIVE, nullable=False)
    prep_time_minutes = db.Column(db.Integer, default=25, nullable=False)
    is_open = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    members = db.relationship("VendorMember", back_populates="vendor", cascade="all, delete-orphan")
    categories = db.relationship("MenuCategory", back_populates="vendor", cascade="all, delete-orphan")
    items = db.relationship("MenuItem", back_populates="vendor", cascade="all, delete-orphan")
    orders = db.relationship("Order", back_populates="vendor")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "phone": self.phone,
            "email": self.email,
            "township_block": self.township_block,
            "landmark_description": self.landmark_description,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "prep_time_minutes": self.prep_time_minutes,
            "is_open": self.is_open,
        }

class VendorMember(db.Model):
    """Mapping between users and vendors for role authorization."""
    __tablename__ = "vendor_members"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = db.Column(db.String(36), db.ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    member_role = db.Column(db.Enum(VendorMemberRole, name="vendormemberrole"), default=VendorMemberRole.STAFF, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    vendor = db.relationship("Vendor", back_populates="members")
    user = db.relationship("User", back_populates="vendor_memberships")
