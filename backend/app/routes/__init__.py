from app.routes.health import health_bp
from app.routes.auth import auth_bp
from app.routes.addresses import addresses_bp
from app.routes.vendors import vendors_bp

__all__ = ["health_bp", "auth_bp", "addresses_bp", "vendors_bp"]
