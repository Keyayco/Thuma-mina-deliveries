from app.extensions import db
from datetime import datetime
import uuid
import enum

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    EFT = "eft"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class Payment(db.Model):
    """Payment record supporting COD and manual EFT/PFTS verification."""
    __tablename__ = "payments"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    amount_cents = db.Column(db.Integer, nullable=False)
    method = db.Column(db.Enum(PaymentMethod, name="paymentmethod"), default=PaymentMethod.CASH, nullable=False)
    status = db.Column(db.Enum(PaymentStatus, name="paymentstatus"), default=PaymentStatus.PENDING, nullable=False)
    proof_of_payment_url = db.Column(db.String(500), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    order = db.relationship("Order", back_populates="payment")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "amount_cents": self.amount_cents,
            "method": self.method.value if hasattr(self.method, "value") else str(self.method),
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
        }
