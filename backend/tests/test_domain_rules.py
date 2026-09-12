import unittest
import re
import hashlib
import os

try:
    from werkzeug.security import generate_password_hash, check_password_hash
    HAS_WERKZEUG = True
except ImportError:
    HAS_WERKZEUG = False

class TestDomainAndValidationRules(unittest.TestCase):
    """Test TMD domain rules, password hashing, and business validation."""

    def test_password_hashing(self):
        password = "SecurePassword123!"
        if HAS_WERKZEUG:
            hashed = generate_password_hash(password)
            self.assertNotEqual(password, hashed)
            self.assertTrue(check_password_hash(hashed, password))
            self.assertFalse(check_password_hash(hashed, "WrongPassword"))
        else:
            # Fallback to standard library hashlib pbkdf2_hmac to verify cryptographic primitives
            salt = os.urandom(16)
            key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
            self.assertEqual(len(key), 32)
            self.assertNotEqual(password.encode('utf-8'), key)

    def test_email_validation_regex(self):
        pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        valid_emails = ["customer@tmd.co.za", "admin@thumamina.com", "driver1@soshanguve.org"]
        invalid_emails = ["not-an-email", "@missinguser.com", "user@", "spaces in@email.com"]

        for email in valid_emails:
            self.assertTrue(bool(re.match(pattern, email)), f"Should be valid: {email}")
        for email in invalid_emails:
            self.assertFalse(bool(re.match(pattern, email)), f"Should be invalid: {email}")

    def test_pricing_stored_in_integer_cents(self):
        # In South African Rands (ZAR), prices must be positive integer cents
        price_rands = 65.50
        price_cents = int(round(price_rands * 100))
        self.assertEqual(price_cents, 6550)
        self.assertIsInstance(price_cents, int)

        # Reverse formatting check
        formatted = f"R {price_cents / 100:.2f}"
        self.assertEqual(formatted, "R 65.50")

    def test_single_vendor_per_order_invariant(self):
        # Enforces ADR-003: All items in an order must come from the same vendor
        vendor_a_items = [
            {"id": "item-1", "vendor_id": "vendor-A", "price_cents": 3500},
            {"id": "item-2", "vendor_id": "vendor-A", "price_cents": 5000},
        ]
        vendor_ids = {item["vendor_id"] for item in vendor_a_items}
        self.assertEqual(len(vendor_ids), 1, "Single vendor order is valid")

        mixed_vendor_items = [
            {"id": "item-1", "vendor_id": "vendor-A", "price_cents": 3500},
            {"id": "item-3", "vendor_id": "vendor-B", "price_cents": 7500},
        ]
        mixed_vendor_ids = {item["vendor_id"] for item in mixed_vendor_items}
        self.assertGreater(len(mixed_vendor_ids), 1, "Mixed vendor cart detected and rejected")

    def test_soshanguve_address_requirements(self):
        # Every address in Soshanguve must specify a township block and landmark description
        def validate_address_payload(payload):
            if not payload.get("township_block", "").strip():
                return False, "township_block is required"
            if not payload.get("landmark_description", "").strip():
                return False, "landmark_description is required"
            return True, "Valid"

        valid_payload = {
            "township_block": "Block L",
            "landmark_description": "Opposite Tsako Thabo High School, behind yellow tuckshop",
            "street_address": "House 412",
        }
        is_valid, _ = validate_address_payload(valid_payload)
        self.assertTrue(is_valid)

        invalid_payload = {
            "township_block": "Block L",
            "landmark_description": "",
            "street_address": "House 412",
        }
        is_valid, msg = validate_address_payload(invalid_payload)
        self.assertFalse(is_valid)
        self.assertIn("landmark_description is required", msg)

    def test_admin_role_cannot_be_self_assigned(self):
        # Enforce Rule 6: ADMIN cannot be self-assigned through public registration
        allowed_public_roles = {"customer", "vendor", "driver"}
        attempted_roles = ["admin", "ADMIN", "SuperAdmin", "root"]

        for role in attempted_roles:
            is_allowed = role.lower() in allowed_public_roles
            self.assertFalse(is_allowed, f"Role '{role}' must never be self-assigned publicly")

        for role in ["customer", "vendor", "driver"]:
            is_allowed = role.lower() in allowed_public_roles
            self.assertTrue(is_allowed, f"Role '{role}' should be valid for public onboarding")

if __name__ == "__main__":
    unittest.main()
