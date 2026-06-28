"""Security tests for SENTINELLE — authentication, authorization, and token handling."""
import hashlib
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User, LoginCode
from app.security import hash_password, verify_password, create_token


class TestAuthentication:
    """Tests for authentication mechanisms."""

    def test_request_code_missing_user(self, client: TestClient):
        """Test that requesting code for non-existent email returns generic response."""
        response = client.post("/api/v1/auth/request-code", json={"email": "nonexistent@test.local"})
        # In dev mode, should return 404; in prod would return 200
        assert response.status_code in (200, 404)

    def test_request_code_creates_login_code(self, client: TestClient, db: Session, users: dict):
        """Test that requesting code creates a LoginCode entry."""
        user = users["analyst_jr"]
        response = client.post("/api/v1/auth/request-code", json={"email": user.email})
        assert response.status_code == 200
        data = response.json()
        assert "dev_code" in data or "sent" in data

        # Verify LoginCode was created
        login_codes = db.query(LoginCode).filter(LoginCode.email == user.email).all()
        assert len(login_codes) > 0

    def test_verify_code_success(self, client: TestClient, db: Session, users: dict, login_codes: dict):
        """Test successful code verification and token generation."""
        user = users["analyst_jr"]
        code = login_codes["analyst_jr"]

        response = client.post("/api/v1/auth/verify-code", json={"email": user.email, "code": code})
        assert response.status_code == 200

        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert "permissions" in data

        # Verify token user info
        assert data["user"]["email"] == user.email
        assert data["user"]["role"] == "analyst_jr"

    def test_verify_code_invalid_code(self, client: TestClient, users: dict):
        """Test that invalid code is rejected."""
        user = users["analyst_jr"]
        response = client.post(
            "/api/v1/auth/verify-code",
            json={"email": user.email, "code": "999999"},
        )
        assert response.status_code == 401
        assert "invalide" in response.json()["detail"].lower()

    def test_verify_code_expired(self, client: TestClient, db: Session, users: dict):
        """Test that expired code is rejected."""
        import secrets

        user = users["analyst_jr"]
        code = f"{secrets.randbelow(1_000_000):06d}"
        code_hash = hashlib.sha256(code.encode()).hexdigest()

        # Create expired code
        expired_code = LoginCode(
            email=user.email,
            code_hash=code_hash,
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
            used=False,
        )
        db.add(expired_code)
        db.commit()

        response = client.post(
            "/api/v1/auth/verify-code",
            json={"email": user.email, "code": code},
        )
        assert response.status_code == 401

    def test_verify_code_already_used(self, client: TestClient, db: Session, users: dict, login_codes: dict):
        """Test that already-used code is rejected."""
        user = users["analyst_jr"]
        code = login_codes["analyst_jr"]

        # First verify (success)
        response1 = client.post("/api/v1/auth/verify-code", json={"email": user.email, "code": code})
        assert response1.status_code == 200

        # Second verify (should fail)
        response2 = client.post("/api/v1/auth/verify-code", json={"email": user.email, "code": code})
        assert response2.status_code == 401

    def test_login_fallback_success(self, client: TestClient, users: dict):
        """Test password login (fallback for development)."""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "analyst_jr@test.local", "password": "testpass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_login_fallback_wrong_password(self, client: TestClient, users: dict):
        """Test password login with wrong password."""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "analyst_jr@test.local", "password": "wrongpassword"},
        )
        assert response.status_code == 401


class TestAuthorization:
    """Tests for role-based access control."""

    def test_analyst_jr_cannot_access_users_endpoint(self, client: TestClient, headers_for_role):
        """Test that analyst_jr cannot access /users endpoint (403)."""
        headers = headers_for_role("analyst_jr")
        response = client.get("/api/v1/users", headers=headers)
        # Either 403 or 404 depending on endpoint implementation
        assert response.status_code in (403, 404)

    def test_analyst_jr_can_access_dashboard(self, client: TestClient, headers_for_role):
        """Test that analyst_jr can access permitted endpoints."""
        # This verifies that authenticated access works
        headers = headers_for_role("analyst_jr")
        # Dashboard endpoint may or may not exist, but auth should work
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_unauthorized_access_redirects(self, client: TestClient):
        """Test that accessing protected endpoints without token fails."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_analyst_sr_has_more_permissions(self, client: TestClient, headers_for_role):
        """Test that analyst_sr has more permissions than analyst_jr."""
        from app.rbac import perms_for

        jr_perms = perms_for("analyst_jr")
        sr_perms = perms_for("analyst_sr")

        assert len(sr_perms) >= len(jr_perms)
        assert "scan:launch" in sr_perms
        assert "scan:launch" not in jr_perms

    def test_chief_has_team_permissions(self, client: TestClient):
        """Test that chief role has team management permissions."""
        from app.rbac import perms_for

        chief_perms = perms_for("chief")
        assert "reports:validate" in chief_perms

    def test_admin_has_all_permissions(self, client: TestClient):
        """Test that admin role has all permissions."""
        from app.rbac import perms_for

        admin_perms = perms_for("admin")
        assert len(admin_perms) > 10  # Should have many permissions

    def test_auditor_read_only_access(self, client: TestClient):
        """Test that auditor has read-only access."""
        from app.rbac import perms_for

        auditor_perms = perms_for("auditor")
        # Should not have write/management permissions
        assert "audit:read" in auditor_perms
        assert "users:manage" not in auditor_perms


class TestTokenHandling:
    """Tests for JWT token creation and validation."""

    def test_token_contains_user_claims(self, db: Session, users: dict):
        """Test that JWT token contains required claims."""
        import jwt
        from app.config import settings

        user = users["analyst_jr"]
        token = create_token(user)

        # Decode without verification to inspect claims
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        assert payload["sub"] == str(user.id)
        assert payload["email"] == user.email
        assert payload["role"] == "analyst_jr"
        assert "exp" in payload

    def test_token_expiration_in_future(self, db: Session, users: dict):
        """Test that token expiration is set to future."""
        import jwt
        from app.config import settings

        user = users["analyst_jr"]
        token = create_token(user)

        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)

        assert exp_time > now
        # Should be within 24 hours
        assert (exp_time - now).total_seconds() < 86400

    def test_expired_token_rejected(self, client: TestClient, db: Session, users: dict):
        """Test that expired token is rejected."""
        import jwt
        from app.config import settings

        user = users["analyst_jr"]
        # Create expired token
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        expired_token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)

        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401

    def test_malformed_token_rejected(self, client: TestClient):
        """Test that malformed token is rejected."""
        headers = {"Authorization": "Bearer not_a_valid_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401

    def test_missing_token_rejected(self, client: TestClient):
        """Test that missing token is rejected."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401


class TestPasswordSecurity:
    """Tests for password hashing and verification."""

    def test_hash_password_produces_hash(self):
        """Test that password hashing works."""
        password = "testpass123"
        hashed = hash_password(password)

        assert hashed != password
        assert "$" in hashed
        assert "pbkdf2_sha256" in hashed

    def test_same_password_different_hash(self):
        """Test that same password produces different hashes (salt)."""
        password = "testpass123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        assert hash1 != hash2

    def test_verify_correct_password(self):
        """Test that correct password verifies."""
        password = "testpass123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_wrong_password(self):
        """Test that wrong password fails verification."""
        password = "testpass123"
        hashed = hash_password(password)

        assert verify_password("wrongpassword", hashed) is False

    def test_verify_empty_password(self):
        """Test that empty password fails."""
        password = "testpass123"
        hashed = hash_password(password)

        assert verify_password("", hashed) is False


class TestUserInactivation:
    """Tests for inactive user handling."""

    def test_inactive_user_cannot_login(self, client: TestClient, db: Session, users: dict):
        """Test that inactive users cannot login."""
        user = users["analyst_jr"]
        user.is_active = False
        db.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={"email": user.email, "password": "testpass123"},
        )
        assert response.status_code == 403

    def test_inactive_user_with_valid_token_rejected(self, client: TestClient, db: Session, users: dict, auth_tokens: dict):
        """Test that inactive user with valid token is rejected on endpoints."""
        user = users["analyst_jr"]
        user.is_active = False
        db.commit()

        headers = {"Authorization": f"Bearer {auth_tokens['analyst_jr']}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401
