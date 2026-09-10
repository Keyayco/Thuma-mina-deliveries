from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, migrate, cors, jwt

def create_app(config_name="development"):
    """Application factory for Thuma Mina Deliveries REST API."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})
    jwt.init_app(app)

    # JWT Error response formatters
    @jwt.unauthorized_loader
    def custom_unauthorized_response(err_str):
        return jsonify({
            "error": "Missing or malformed Authorization header (Bearer token required)",
            "details": err_str,
            "status": 401
        }), 401

    @jwt.invalid_token_loader
    def custom_invalid_token_response(err_str):
        return jsonify({
            "error": "Invalid authentication token",
            "details": err_str,
            "status": 401
        }), 401

    @jwt.expired_token_loader
    def custom_expired_token_response(jwt_header, jwt_payload):
        return jsonify({
            "error": "Authentication token has expired. Please log in again.",
            "status": 401
        }), 401

    # Register blueprints
    from app.routes.health import health_bp
    from app.routes.auth import auth_bp
    from app.routes.addresses import addresses_bp
    from app.routes.vendors import vendors_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(addresses_bp, url_prefix="/api/users/addresses")
    app.register_blueprint(vendors_bp, url_prefix="/api/vendors")

    # Global error handlers
    @app.errorhandler(400)
    def handle_bad_request(e):
        return jsonify({"error": "Bad request", "details": str(e), "status": 400}), 400

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"error": "Resource not found", "status": 404}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(e):
        return jsonify({"error": "Method not allowed for requested route", "status": 405}), 405

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({"error": "Internal server error", "status": 500}), 500

    return app
