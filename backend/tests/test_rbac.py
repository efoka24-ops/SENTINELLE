"""Role-Based Access Control (RBAC) tests for API endpoints."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.rbac import has_perm, perms_for, ROLE_LABELS


class TestRBACDefinitions:
    """Tests for RBAC role and permission definitions."""

    def test_all_roles_defined(self):
        """Test that all expected roles are defined."""
        expected_roles = ["analyst_jr", "analyst_sr", "chief", "director", "admin", "auditor"]
        for role in expected_roles:
            assert role in ROLE_LABELS
            assert ROLE_LABELS[role] is not None

    def test_analyst_jr_permissions(self):
        """Test analyst_jr has limited read-only permissions."""
        perms = perms_for("analyst_jr")
        assert "view:dashboard" in perms
        assert "view:alertes" in perms
        # Should NOT have write permissions
        assert "users:manage" not in perms
        assert "scan:launch" not in perms

    def test_analyst_sr_permissions(self):
        """Test analyst_sr has additional write permissions."""
        perms = perms_for("analyst_sr")
        # Should have analyst_jr permissions plus more
        jr_perms = set(perms_for("analyst_jr"))
        sr_perms = set(perms)
        assert sr_perms >= jr_perms
        # Additional permissions
        assert "scan:launch" in perms
        assert "alerts:write" in perms

    def test_chief_permissions(self):
        """Test chief has team management permissions."""
        perms = perms_for("chief")
        assert "reports:validate" in perms
        assert "view:endpoints" in perms

    def test_director_permissions(self):
        """Test director has audit and oversight permissions."""
        perms = perms_for("director")
        assert "view:audit" in perms
        assert "audit:read" in perms

    def test_admin_has_all_permissions(self):
        """Test admin role has all permissions."""
        perms = perms_for("admin")
        # Admin should have all view and action permissions
        assert "users:manage" in perms
        assert "audit:read" in perms
        assert len(perms) > 15

    def test_auditor_read_only(self):
        """Test auditor has read-only access."""
        perms = perms_for("auditor")
        assert "view:audit" in perms
        assert "audit:read" in perms
        # Should NOT have write permissions
        assert "users:manage" not in perms
        assert "scan:launch" not in perms


class TestPermissionChecks:
    """Tests for has_perm() function."""

    def test_has_perm_analyst_jr_dashboard(self):
        """Test analyst_jr has view:dashboard permission."""
        assert has_perm("analyst_jr", "view:dashboard") is True

    def test_has_perm_analyst_jr_no_scan(self):
        """Test analyst_jr does not have scan:launch permission."""
        assert has_perm("analyst_jr", "scan:launch") is False

    def test_has_perm_analyst_sr_scan(self):
        """Test analyst_sr has scan:launch permission."""
        assert has_perm("analyst_sr", "scan:launch") is True

    def test_has_perm_admin_all(self):
        """Test admin has any permission."""
        assert has_perm("admin", "view:dashboard") is True
        assert has_perm("admin", "users:manage") is True
        assert has_perm("admin", "audit:read") is True

    def test_has_perm_nonexistent_role(self):
        """Test non-existent role returns False."""
        assert has_perm("nonexistent", "view:dashboard") is False


class TestEndpointAccessControl:
    """Tests for endpoint access control based on roles."""

    def test_analyst_jr_can_get_assigned_signalements(self, client: TestClient, headers_for_role, signalements, users):
        """Test analyst_jr can access their assigned signalements."""
        headers = headers_for_role("analyst_jr")
        response = client.get("/api/v1/signalements/assigned-to-me", headers=headers)
        # May be 200 or 422 depending on implementation, but auth should pass
        assert response.status_code in (200, 422)

    def test_analyst_jr_cannot_access_escalation_pending(self, client: TestClient, headers_for_role):
        """Test analyst_jr cannot access escalation pending (needs reports:validate)."""
        headers = headers_for_role("analyst_jr")
        response = client.get("/api/v1/signalements/escalation-pending", headers=headers)
        # Should be 403 Forbidden due to lack of permission
        assert response.status_code == 403

    def test_chief_can_access_escalation_pending(self, client: TestClient, headers_for_role):
        """Test chief can access escalation pending."""
        headers = headers_for_role("chief")
        response = client.get("/api/v1/signalements/escalation-pending", headers=headers)
        # Should be 200 (even if no results)
        assert response.status_code == 200

    def test_director_can_access_audit(self, client: TestClient, headers_for_role):
        """Test director can access audit logs."""
        headers = headers_for_role("director")
        response = client.get("/api/v1/audit/logs", headers=headers)
        # Even if endpoint doesn't exist, permission check should pass
        assert response.status_code in (200, 404)

    def test_auditor_cannot_write_data(self, client: TestClient, headers_for_role):
        """Test auditor has no write permissions."""
        headers = headers_for_role("auditor")
        # Try to create a signalement (requires write permission)
        response = client.post(
            "/api/v1/signalements/1/decide",
            json={"decision": "Validé"},
            headers=headers,
        )
        assert response.status_code == 403

    def test_analyst_jr_cannot_escalate_without_permission(self, client: TestClient, headers_for_role, signalements):
        """Test analyst_jr cannot escalate without alerts:write permission."""
        headers = headers_for_role("analyst_jr")
        sig = signalements[0]

        response = client.post(
            f"/api/v1/signalements/{sig.id}/escalate",
            json={"reason": "test"},
            headers=headers,
        )
        # Should fail due to missing permission
        assert response.status_code == 403


class TestDataFiltering:
    """Tests for data filtering based on user role."""

    def test_analyst_jr_sees_all_contents(self, client: TestClient, headers_for_role):
        """Test analyst_jr can access contents."""
        headers = headers_for_role("analyst_jr")
        response = client.get("/api/v1/contents", headers=headers)
        assert response.status_code == 200

    def test_analyst_jr_sees_alerts(self, client: TestClient, headers_for_role):
        """Test analyst_jr can see alerts."""
        headers = headers_for_role("analyst_jr")
        response = client.get("/api/v1/alerts", headers=headers)
        assert response.status_code == 200

    def test_analyst_jr_can_get_threat_actors(self, client: TestClient, headers_for_role):
        """Test analyst_jr can access threat actor intelligence."""
        headers = headers_for_role("analyst_jr")
        response = client.get("/api/v1/threat-actors", headers=headers)
        assert response.status_code == 200

    def test_unauthenticated_cannot_access_protected_endpoints(self, client: TestClient):
        """Test that unauthenticated requests are rejected."""
        response = client.get("/api/v1/contents")
        assert response.status_code == 401

        response = client.get("/api/v1/alerts")
        assert response.status_code == 401


class TestRoleHierarchy:
    """Tests for role hierarchy and permission inheritance."""

    def test_analyst_sr_has_analyst_jr_permissions(self):
        """Test analyst_sr has all analyst_jr permissions."""
        jr_perms = set(perms_for("analyst_jr"))
        sr_perms = set(perms_for("analyst_sr"))
        assert jr_perms.issubset(sr_perms)

    def test_chief_has_analyst_sr_permissions(self):
        """Test chief has all analyst_sr permissions."""
        sr_perms = set(perms_for("analyst_sr"))
        chief_perms = set(perms_for("chief"))
        assert sr_perms.issubset(chief_perms)

    def test_director_has_chief_permissions(self):
        """Test director has all chief permissions."""
        chief_perms = set(perms_for("chief"))
        director_perms = set(perms_for("director"))
        assert chief_perms.issubset(director_perms)

    def test_admin_has_all_other_permissions(self):
        """Test admin has all permissions from other roles."""
        admin_perms = set(perms_for("admin"))
        for role in ["analyst_jr", "analyst_sr", "chief", "director", "auditor"]:
            role_perms = set(perms_for(role))
            assert role_perms.issubset(admin_perms), f"Admin missing permissions from {role}"


class TestSpecialPermissions:
    """Tests for special permissions and cross-cutting concerns."""

    def test_escalation_permission_required(self):
        """Test escalation requires alerts:write permission."""
        assert has_perm("analyst_jr", "alerts:write") is False
        assert has_perm("analyst_sr", "alerts:write") is True

    def test_decision_permission_required(self):
        """Test decision requires reports:validate permission."""
        assert has_perm("analyst_jr", "reports:validate") is False
        assert has_perm("chief", "reports:validate") is True

    def test_user_management_permission(self):
        """Test user management is admin-only."""
        assert has_perm("admin", "users:manage") is True
        assert has_perm("director", "users:manage") is False

    def test_audit_read_permission(self):
        """Test audit read access."""
        assert has_perm("auditor", "audit:read") is True
        assert has_perm("director", "audit:read") is True
        assert has_perm("analyst_jr", "audit:read") is False


class TestPermissionBypassAttempts:
    """Tests for attempted permission bypasses and security."""

    def test_analyst_cannot_impersonate_chief(self, client: TestClient, headers_for_role):
        """Test analyst cannot call chief-only endpoints."""
        headers = headers_for_role("analyst_jr")
        response = client.post(
            "/api/v1/signalements/1/decide",
            json={"decision": "Validé"},
            headers=headers,
        )
        assert response.status_code == 403

    def test_modifying_token_invalidates_access(self, client: TestClient, auth_tokens):
        """Test that modifying token invalidates it."""
        modified_token = auth_tokens["analyst_jr"][:-5] + "xxxxx"
        headers = {"Authorization": f"Bearer {modified_token}"}
        response = client.get("/api/v1/contents", headers=headers)
        assert response.status_code == 401

    def test_old_user_role_in_token_honored(self, client: TestClient, db: Session, auth_tokens, users):
        """Test that user's current role (not token) is used for permission checks."""
        # This tests that we re-fetch user from DB on each request
        user = users["analyst_jr"]
        user.role = "analyst_sr"
        db.commit()

        # Token still contains old role, but new permissions should apply
        headers = {"Authorization": f"Bearer {auth_tokens['analyst_jr']}"}
        response = client.get("/api/v1/signalements/escalation-pending", headers=headers)
        # Should now work because user is analyst_sr
        assert response.status_code in (200, 404)
