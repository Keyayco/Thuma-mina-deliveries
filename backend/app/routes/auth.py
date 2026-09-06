from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User, UserRole
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new customer profile."""
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name")
    phone_number = data.get("phone_number")

    if not email or not password or not full_name:
        return jsonify({"error": "email, password, and full_name are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User with this email already exists"}), 409

    user = User(
        email=email,
        full_name=full_name,
        phone_number=phone_number,
        role=UserRole.CUSTOMER,
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id, additional_claims={"role": user.role.value})
    return jsonify({
        "message": "User registered successfully",
        "access_token": token,
        "user": user.to_dict(),
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate with email and password, returning a JWT access token."""
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=user.id, additional_claims={"role": user.role.value})
    return jsonify({
        "message": "Authentication successful",
        "access_token": token,
        "user": user.to_dict(),
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Return currently authenticated profile."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
