from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.models.user import UserRole
import re

def role_required(*allowed_roles):
    """
    Decorator to restrict route access to specific user roles based on JWT claims.
    Usage:
        @role_required(UserRole.ADMIN)
        @role_required(UserRole.VENDOR, UserRole.ADMIN)
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")

            # Convert allowed roles to string values
            allowed_role_values = [
                r.value if isinstance(r, UserRole) else str(r)
                for r in allowed_roles
            ]

            if user_role not in allowed_role_values:
                return jsonify({
                    "error": "Forbidden: Insufficient role permissions",
                    "current_role": user_role,
                    "required_roles": allowed_role_values,
                    "status": 403
                }), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper

def admin_required(fn):
    """Decorator to require ADMIN role."""
    return role_required(UserRole.ADMIN)(fn)

def vendor_or_admin_required(fn):
    """Decorator to require VENDOR or ADMIN role."""
    return role_required(UserRole.VENDOR, UserRole.ADMIN)(fn)

def driver_or_admin_required(fn):
    """Decorator to require DRIVER or ADMIN role."""
    return role_required(UserRole.DRIVER, UserRole.ADMIN)(fn)

def validate_email_format(email: str) -> bool:
    """Validate email format using regex."""
    if not email or len(email) > 255:
        return False
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return bool(re.match(pattern, email.strip()))

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets minimum safety requirements."""
    if not password:
        return False, "Password is required"
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, ""
