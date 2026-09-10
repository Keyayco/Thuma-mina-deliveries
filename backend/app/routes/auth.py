from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User, UserRole
from app.models.driver import Driver
from app.utils.decorators import validate_email_format, validate_password_strength
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user profile with role assignment."""
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or "").strip()
    phone_number = (data.get("phone_number") or "").strip() or None
    role_str = (data.get("role") or "customer").strip().lower()

    if not email or not password or not full_name:
        return jsonify({
            "error": "email, password, and full_name are required",
            "status": 400
        }), 400

    if not validate_email_format(email):
        return jsonify({
            "error": "Invalid email address format",
            "status": 400
        }), 400

    is_valid_pw, pw_error = validate_password_strength(password)
    if not is_valid_pw:
        return jsonify({
            "error": pw_error,
            "status": 400
        }), 400

    # Role validation
    try:
        assigned_role = UserRole(role_str)
    except ValueError:
        return jsonify({
            "error": f"Invalid role '{role_str}'. Valid roles: customer, vendor, driver, admin",
            "status": 400
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            "error": "A user with this email address already exists",
            "status": 409
        }), 409

    user = User(
        email=email,
        full_name=full_name,
        phone_number=phone_number,
        role=assigned_role,
    )
    user.set_password(password)

    db.session.add(user)
    db.session.flush()

    # If registered as a driver, initialize driver record
    if assigned_role == UserRole.DRIVER:
        driver_entry = Driver(
            user_id=user.id,
            is_online=False,
            current_orders_count=0,
        )
        db.session.add(driver_entry)

    db.session.commit()

    token = create_access_token(
        identity=user.id,
        additional_claims={"role": user.role.value, "email": user.email}
    )

    return jsonify({
        "message": "User registered successfully",
        "access_token": token,
        "token_type": "Bearer",
        "user": user.to_dict(),
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate with email and password, returning a signed JWT access token."""
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({
            "error": "email and password are required",
            "status": 400
        }), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({
            "error": "Invalid email or password",
            "status": 401
        }), 401

    token = create_access_token(
        identity=user.id,
        additional_claims={"role": user.role.value, "email": user.email}
    )

    return jsonify({
        "message": "Authentication successful",
        "access_token": token,
        "token_type": "Bearer",
        "user": user.to_dict(),
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Return currently authenticated profile along with role-specific details."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found", "status": 404}), 404

    user_data = user.to_dict()
    
    # Append default addresses
    user_data["addresses"] = [addr.to_dict() for addr in user.addresses]

    # Append driver info if applicable
    if user.role == UserRole.DRIVER and user.driver_profile:
        user_data["driver_profile"] = user.driver_profile.to_dict()

    # Append vendor memberships if applicable
    if user.role == UserRole.VENDOR and user.vendor_memberships:
        user_data["vendor_memberships"] = [
            {
                "vendor_id": m.vendor_id,
                "vendor_name": m.vendor.name if m.vendor else None,
                "role": m.member_role.value if hasattr(m.member_role, "value") else str(m.member_role),
            }
            for m in user.vendor_memberships
        ]

    return jsonify({"user": user_data}), 200

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update profile information (full_name, phone_number)."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found", "status": 404}), 404

    data = request.get_json() or {}
    if "full_name" in data:
        name = (data.get("full_name") or "").strip()
        if not name:
            return jsonify({"error": "full_name cannot be empty", "status": 400}), 400
        user.full_name = name

    if "phone_number" in data:
        user.phone_number = (data.get("phone_number") or "").strip() or None

    db.session.commit()
    return jsonify({
        "message": "Profile updated successfully",
        "user": user.to_dict()
    }), 200

@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    """Verify current password and update to new password."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found", "status": 404}), 404

    data = request.get_json() or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not current_password or not new_password:
        return jsonify({
            "error": "current_password and new_password are required",
            "status": 400
        }), 400

    if not user.check_password(current_password):
        return jsonify({
            "error": "Incorrect current password",
            "status": 401
        }), 401

    is_valid_pw, pw_error = validate_password_strength(new_password)
    if not is_valid_pw:
        return jsonify({
            "error": pw_error,
            "status": 400
        }), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password changed successfully"}), 200

@auth_bp.route("/verify", methods=["POST"])
@jwt_required()
def verify_token():
    """Verify that current access token is valid and return claims."""
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    return jsonify({
        "valid": True,
        "user_id": current_user_id,
        "role": claims.get("role"),
        "email": claims.get("email"),
    }), 200
