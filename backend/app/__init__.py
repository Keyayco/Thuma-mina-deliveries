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

    # Register blueprints
    from app.routes.health import health_bp
    from app.routes.auth import auth_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # Global error handlers
    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"error": "Resource not found", "status": 404}), 404

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({"error": "Internal server error", "status": 500}), 500

    return app
