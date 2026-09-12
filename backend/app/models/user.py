from app.extensions import db
from datetime import datetime
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    VENDOR = "vendor"
    DRIVER = "driver"
    ADMIN = "admin"

class User(db.Model):
    """User profile entity matching 'profiles' table."""
    __tablename__ = "profiles"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    role = db.Column(db.Enum(UserRole, name="userrole"), default=UserRole.CUSTOMER, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    addresses = db.relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = db.relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")
    driver_profile = db.relationship("Driver", back_populates="user", uselist=False)
    vendor_memberships = db.relationship("VendorMember", back_populates="user")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone_number": self.phone_number,
            "role": self.role.value if hasattr(self.role, "value") else str(self.role),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
