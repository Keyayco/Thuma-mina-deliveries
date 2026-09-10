from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.address import Address
from flask_jwt_extended import jwt_required, get_jwt_identity

addresses_bp = Blueprint("addresses", __name__)

@addresses_bp.route("", methods=["GET"])
@jwt_required()
def list_addresses():
    """List all delivery addresses for currently authenticated user."""
    current_user_id = get_jwt_identity()
    addresses = Address.query.filter_by(user_id=current_user_id).order_by(Address.is_default.desc(), Address.created_at.desc()).all()
    return jsonify({
        "addresses": [addr.to_dict() for addr in addresses]
    }), 200

@addresses_bp.route("", methods=["POST"])
@jwt_required()
def create_address():
    """Create a new delivery address with township block and mandatory landmark description."""
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}

    township_block = (data.get("township_block") or "").strip()
    landmark_description = (data.get("landmark_description") or "").strip()
    label = (data.get("label") or "Home").strip()
    street_address = (data.get("street_address") or "").strip() or None
    is_default = bool(data.get("is_default", False))

    if not township_block:
        return jsonify({"error": "township_block is required (e.g., 'Block L', 'Block BB')", "status": 400}), 400

    if not landmark_description:
        return jsonify({
            "error": "landmark_description is required for Soshanguve delivery navigation (e.g., 'Opposite community clinic, yellow gate')",
            "status": 400
        }), 400

    # If first address or marked default, unset other defaults
    existing_count = Address.query.filter_by(user_id=current_user_id).count()
    if existing_count == 0:
        is_default = True
    elif is_default:
        Address.query.filter_by(user_id=current_user_id).update({"is_default": False})

    address = Address(
        user_id=current_user_id,
        label=label,
        township_block=township_block,
        landmark_description=landmark_description,
        street_address=street_address,
        is_default=is_default,
    )

    db.session.add(address)
    db.session.commit()

    return jsonify({
        "message": "Delivery address saved successfully",
        "address": address.to_dict(),
    }), 201

@addresses_bp.route("/<address_id>", methods=["PUT"])
@jwt_required()
def update_address(address_id):
    """Update an existing delivery address."""
    current_user_id = get_jwt_identity()
    address = Address.query.filter_by(id=address_id, user_id=current_user_id).first()
    if not address:
        return jsonify({"error": "Address not found or unauthorized", "status": 404}), 404

    data = request.get_json() or {}

    if "township_block" in data:
        block = (data.get("township_block") or "").strip()
        if not block:
            return jsonify({"error": "township_block cannot be empty", "status": 400}), 400
        address.township_block = block

    if "landmark_description" in data:
        landmark = (data.get("landmark_description") or "").strip()
        if not landmark:
            return jsonify({"error": "landmark_description cannot be empty", "status": 400}), 400
        address.landmark_description = landmark

    if "label" in data:
        address.label = (data.get("label") or "Home").strip()

    if "street_address" in data:
        address.street_address = (data.get("street_address") or "").strip() or None

    if "is_default" in data and bool(data.get("is_default")):
        Address.query.filter_by(user_id=current_user_id).update({"is_default": False})
        address.is_default = True

    db.session.commit()

    return jsonify({
        "message": "Address updated successfully",
        "address": address.to_dict(),
    }), 200

@addresses_bp.route("/<address_id>", methods=["DELETE"])
@jwt_required()
def delete_address(address_id):
    """Delete a delivery address."""
    current_user_id = get_jwt_identity()
    address = Address.query.filter_by(id=address_id, user_id=current_user_id).first()
    if not address:
        return jsonify({"error": "Address not found or unauthorized", "status": 404}), 404

    was_default = address.is_default
    db.session.delete(address)
    db.session.commit()

    # If the deleted address was default, promote the newest remaining address to default
    if was_default:
        next_default = Address.query.filter_by(user_id=current_user_id).order_by(Address.created_at.desc()).first()
        if next_default:
            next_default.is_default = True
            db.session.commit()

    return jsonify({"message": "Address deleted successfully"}), 200

@addresses_bp.route("/<address_id>/default", methods=["PATCH"])
@jwt_required()
def set_default_address(address_id):
    """Set specified address as user's default delivery address."""
    current_user_id = get_jwt_identity()
    address = Address.query.filter_by(id=address_id, user_id=current_user_id).first()
    if not address:
        return jsonify({"error": "Address not found or unauthorized", "status": 404}), 404

    Address.query.filter_by(user_id=current_user_id).update({"is_default": False})
    address.is_default = True
    db.session.commit()

    return jsonify({
        "message": "Default delivery address updated",
        "address": address.to_dict(),
    }), 200
