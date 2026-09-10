from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.vendor import Vendor, VendorStatus, VendorMember, VendorMemberRole
from app.models.menu import MenuCategory, MenuItem
from app.models.user import UserRole
from app.utils.decorators import role_required, vendor_or_admin_required
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import re

vendors_bp = Blueprint("vendors", __name__)

def slugify(text: str) -> str:
    """Convert text into URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)

def check_vendor_permission(vendor_id: str, user_id: str, user_role: str) -> bool:
    """Verify that user is either an ADMIN or a member of the specified vendor."""
    if user_role == UserRole.ADMIN.value:
        return True
    membership = VendorMember.query.filter_by(vendor_id=vendor_id, user_id=user_id).first()
    return membership is not None

@vendors_bp.route("", methods=["GET"])
def list_vendors():
    """List all active township food vendors and restaurants."""
    query = Vendor.query.filter_by(status=VendorStatus.ACTIVE)

    block = request.args.get("block")
    if block:
        query = query.filter(Vendor.township_block.ilike(f"%{block.strip()}%"))

    is_open = request.args.get("is_open")
    if is_open is not None:
        is_open_bool = is_open.lower() in ("true", "1")
        query = query.filter_by(is_open=is_open_bool)

    vendors = query.order_by(Vendor.is_open.desc(), Vendor.name.asc()).all()
    return jsonify({
        "count": len(vendors),
        "vendors": [v.to_dict() for v in vendors]
    }), 200

@vendors_bp.route("/<identifier>", methods=["GET"])
def get_vendor(identifier):
    """Get single vendor by ID or slug."""
    vendor = Vendor.query.filter((Vendor.id == identifier) | (Vendor.slug == identifier)).first()
    if not vendor:
        return jsonify({"error": "Vendor not found", "status": 404}), 404

    data = vendor.to_dict()
    data["categories"] = [c.to_dict() for c in vendor.categories]
    return jsonify({"vendor": data}), 200

@vendors_bp.route("/<identifier>/menu", methods=["GET"])
def get_vendor_menu(identifier):
    """Retrieve full categorized menu for an active vendor."""
    vendor = Vendor.query.filter((Vendor.id == identifier) | (Vendor.slug == identifier)).first()
    if not vendor:
        return jsonify({"error": "Vendor not found", "status": 404}), 404

    categories = MenuCategory.query.filter_by(vendor_id=vendor.id).order_by(MenuCategory.sort_order.asc()).all()
    
    result = []
    for cat in categories:
        cat_data = cat.to_dict()
        cat_data["items"] = [
            item.to_dict() for item in MenuItem.query.filter_by(
                vendor_id=vendor.id,
                category_id=cat.id,
            ).order_by(MenuItem.name.asc()).all()
        ]
        result.append(cat_data)

    # Include uncategorized items if any
    uncategorized = MenuItem.query.filter_by(vendor_id=vendor.id, category_id=None).all()
    if uncategorized:
        result.append({
            "id": None,
            "vendor_id": vendor.id,
            "name": "General",
            "sort_order": 999,
            "items": [item.to_dict() for item in uncategorized]
        })

    return jsonify({
        "vendor": {
            "id": vendor.id,
            "name": vendor.name,
            "is_open": vendor.is_open,
            "prep_time_minutes": vendor.prep_time_minutes,
        },
        "menu": result
    }), 200

@vendors_bp.route("", methods=["POST"])
@jwt_required()
@role_required(UserRole.ADMIN, UserRole.VENDOR)
def create_vendor():
    """Register a new vendor (Admin or Vendor)."""
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    township_block = (data.get("township_block") or "").strip()
    landmark_description = (data.get("landmark_description") or "").strip()

    if not name or not phone or not township_block or not landmark_description:
        return jsonify({
            "error": "name, phone, township_block, and landmark_description are required",
            "status": 400
        }), 400

    base_slug = slugify(name)
    slug = base_slug
    counter = 1
    while Vendor.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    vendor = Vendor(
        name=name,
        slug=slug,
        description=(data.get("description") or "").strip() or None,
        phone=phone,
        email=(data.get("email") or "").strip() or None,
        township_block=township_block,
        landmark_description=landmark_description,
        prep_time_minutes=int(data.get("prep_time_minutes", 25)),
        status=VendorStatus.ACTIVE,
        is_open=bool(data.get("is_open", True)),
    )
    db.session.add(vendor)
    db.session.flush()

    # Assign current user as owner member of the vendor
    membership = VendorMember(
        vendor_id=vendor.id,
        user_id=current_user_id,
        member_role=VendorMemberRole.OWNER,
    )
    db.session.add(membership)
    db.session.commit()

    return jsonify({
        "message": "Vendor created successfully",
        "vendor": vendor.to_dict()
    }), 201

@vendors_bp.route("/<vendor_id>/categories", methods=["POST"])
@jwt_required()
@vendor_or_admin_required
def create_category(vendor_id):
    """Add a menu category to a vendor."""
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    if not check_vendor_permission(vendor_id, current_user_id, claims.get("role")):
        return jsonify({"error": "Unauthorized to manage this vendor", "status": 403}), 403

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Category name is required", "status": 400}), 400

    sort_order = int(data.get("sort_order", 0))

    category = MenuCategory(
        vendor_id=vendor_id,
        name=name,
        sort_order=sort_order,
    )
    db.session.add(category)
    db.session.commit()

    return jsonify({
        "message": "Category created successfully",
        "category": category.to_dict(),
    }), 201

@vendors_bp.route("/<vendor_id>/items", methods=["POST"])
@jwt_required()
@vendor_or_admin_required
def create_menu_item(vendor_id):
    """Add a new item to vendor menu. Enforces price in positive integer ZAR cents."""
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    if not check_vendor_permission(vendor_id, current_user_id, claims.get("role")):
        return jsonify({"error": "Unauthorized to manage this vendor", "status": 403}), 403

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    price_cents = data.get("price_cents")

    if not name:
        return jsonify({"error": "Item name is required", "status": 400}), 400

    if price_cents is None or not isinstance(price_cents, int) or price_cents < 0:
        return jsonify({
            "error": "price_cents must be a positive integer (e.g., 6500 for R 65.00)",
            "status": 400
        }), 400

    item = MenuItem(
        vendor_id=vendor_id,
        category_id=data.get("category_id"),
        name=name,
        description=(data.get("description") or "").strip() or None,
        price_cents=price_cents,
        image_url=data.get("image_url"),
        is_available=bool(data.get("is_available", True)),
    )
    db.session.add(item)
    db.session.commit()

    return jsonify({
        "message": "Menu item created successfully",
        "item": item.to_dict(),
    }), 201

@vendors_bp.route("/<vendor_id>/items/<item_id>", methods=["PATCH"])
@jwt_required()
@vendor_or_admin_required
def update_menu_item(vendor_id, item_id):
    """Update menu item (price, availability, description)."""
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    if not check_vendor_permission(vendor_id, current_user_id, claims.get("role")):
        return jsonify({"error": "Unauthorized to manage this vendor", "status": 403}), 403

    item = MenuItem.query.filter_by(id=item_id, vendor_id=vendor_id).first()
    if not item:
        return jsonify({"error": "Menu item not found", "status": 404}), 404

    data = request.get_json() or {}

    if "name" in data:
        item.name = (data["name"] or "").strip()
    if "description" in data:
        item.description = (data["description"] or "").strip() or None
    if "price_cents" in data:
        p = data["price_cents"]
        if not isinstance(p, int) or p < 0:
            return jsonify({"error": "price_cents must be a non-negative integer", "status": 400}), 400
        item.price_cents = p
    if "is_available" in data:
        item.is_available = bool(data["is_available"])
    if "image_url" in data:
        item.image_url = data["image_url"]

    db.session.commit()
    return jsonify({
        "message": "Menu item updated successfully",
        "item": item.to_dict()
    }), 200

@vendors_bp.route("/<vendor_id>/status", methods=["PATCH"])
@jwt_required()
@vendor_or_admin_required
def update_vendor_status(vendor_id):
    """Toggle vendor open/closed status and preparation time."""
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    if not check_vendor_permission(vendor_id, current_user_id, claims.get("role")):
        return jsonify({"error": "Unauthorized to manage this vendor", "status": 403}), 403

    vendor = Vendor.query.get(vendor_id)
    if not vendor:
        return jsonify({"error": "Vendor not found", "status": 404}), 404

    data = request.get_json() or {}
    if "is_open" in data:
        vendor.is_open = bool(data["is_open"])
    if "prep_time_minutes" in data:
        vendor.prep_time_minutes = int(data["prep_time_minutes"])

    db.session.commit()
    return jsonify({
        "message": "Vendor status updated",
        "vendor": vendor.to_dict()
    }), 200
