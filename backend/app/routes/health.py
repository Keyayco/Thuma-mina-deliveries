from flask import Blueprint, jsonify
from app.extensions import db
from sqlalchemy import text

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    """Diagnostic health check verifying API and Neon PostgreSQL connectivity."""
    db_connected = False
    db_error = None
    try:
        # Ping the database engine
        db.session.execute(text("SELECT 1"))
        db_connected = True
    except Exception as e:
        db_error = str(e)

    status_code = 200 if db_connected else 503
    return jsonify({
        "status": "healthy" if db_connected else "degraded",
        "service": "thuma-mina-backend",
        "region": "eu-central-1 (Frankfurt)",
        "database": {
            "provider": "Neon PostgreSQL",
            "connected": db_connected,
            "error": db_error,
        }
    }), status_code
