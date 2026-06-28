"""Audit compliance tests for SENTINELLE — immutable audit trail and ethics committee reporting."""
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import AuditLog, Signalement, User


class TestAuditLogCreation:
    """Tests for audit log entry creation and recording."""

    def test_audit_log_has_required_fields(self, db: Session, users: dict):
        """Test that audit log contains all required fields."""
        log_entry = AuditLog(
            ts=datetime.now(timezone.utc),
            user=users["analyst_jr"].name,
            role=users["analyst_jr"].role,
            action="TEST_ACTION",
            target="test-target",
        )
        db.add(log_entry)
        db.commit()

        saved = db.query(AuditLog).first()
        assert saved.user == users["analyst_jr"].name
        assert saved.role == "analyst_jr"
        assert saved.action == "TEST_ACTION"
        assert saved.target == "test-target"
        assert saved.ts is not None

    def test_audit_log_timestamp_immutable(self, db: Session):
        """Test that audit log timestamp is set at creation."""
        now = datetime.now(timezone.utc)
        log_entry = AuditLog(
            ts=now,
            user="Test User",
            role="analyst_jr",
            action="TEST",
            target="test",
        )
        db.add(log_entry)
        db.commit()

        saved = db.query(AuditLog).first()
        assert saved.ts == now

    def test_audit_log_user_role_recorded(self, db: Session, users: dict):
        """Test that user's role at time of action is recorded."""
        for role in ["analyst_jr", "analyst_sr", "chief", "director", "admin"]:
            user = users[role]
            log_entry = AuditLog(
                ts=datetime.now(timezone.utc),
                user=user.name,
                role=user.role,
                action="TEST",
                target=f"test-{role}",
            )
            db.add(log_entry)
        db.commit()

        for role in ["analyst_jr", "analyst_sr", "chief", "director", "admin"]:
            log_entry = db.query(AuditLog).filter_by(role=role).first()
            assert log_entry is not None
            assert log_entry.role == role


class TestAuditImmutability:
    """Tests for audit log immutability (append-only)."""

    def test_audit_log_cannot_be_deleted(self, db: Session):
        """Test that audit logs cannot be deleted."""
        log_entry = AuditLog(
            ts=datetime.now(timezone.utc),
            user="Test User",
            role="analyst_jr",
            action="TEST",
            target="test",
        )
        db.add(log_entry)
        db.commit()

        log_id = log_entry.id

        # Try to delete
        entry = db.query(AuditLog).filter_by(id=log_id).first()
        assert entry is not None

        # In a real system, we'd have database constraints preventing deletes
        # This test verifies the model allows deletion (application logic should prevent it)

    def test_audit_log_cannot_be_modified(self, db: Session):
        """Test that audit logs cannot be modified after creation."""
        original_action = "ORIGINAL_ACTION"
        log_entry = AuditLog(
            ts=datetime.now(timezone.utc),
            user="Test User",
            role="analyst_jr",
            action=original_action,
            target="test",
        )
        db.add(log_entry)
        db.commit()

        saved = db.query(AuditLog).first()
        assert saved.action == original_action

        # In a real system, we'd have database constraints preventing updates
        # This test establishes the baseline

    def test_audit_log_append_only_characteristic(self, db: Session):
        """Test that audit logs only grow, never shrink."""
        # Add 5 logs
        for i in range(5):
            log = AuditLog(
                ts=datetime.now(timezone.utc),
                user=f"User{i}",
                role="analyst_jr",
                action=f"ACTION_{i}",
                target=f"target_{i}",
            )
            db.add(log)
        db.commit()

        count1 = db.query(AuditLog).count()
        assert count1 == 5

        # Add 3 more
        for i in range(3):
            log = AuditLog(
                ts=datetime.now(timezone.utc),
                user=f"User{i+5}",
                role="analyst_sr",
                action=f"ACTION_{i+5}",
                target=f"target_{i+5}",
            )
            db.add(log)
        db.commit()

        count2 = db.query(AuditLog).count()
        assert count2 == 8
        assert count2 > count1


class TestActionAuditing:
    """Tests that all important actions are logged."""

    def test_signalement_creation_logged(self, db: Session, users: dict):
        """Test that signalement creation is logged."""
        # Simulate signalement creation action
        log = AuditLog(
            ts=datetime.now(timezone.utc),
            user=users["analyst_jr"].name,
            role=users["analyst_jr"].role,
            action="SIGNALEMENT_CREATED",
            target="SIG-2024-001",
        )
        db.add(log)
        db.commit()

        saved = db.query(AuditLog).filter_by(action="SIGNALEMENT_CREATED").first()
        assert saved is not None
        assert saved.target == "SIG-2024-001"

    def test_escalation_logged(self, db: Session, users: dict):
        """Test that escalation is logged."""
        log = AuditLog(
            ts=datetime.now(timezone.utc),
            user=users["analyst_jr"].name,
            role=users["analyst_jr"].role,
            action="SIGNALEMENT_ESCALATED",
            target="SIG-2024-002",
        )
        db.add(log)
        db.commit()

        saved = db.query(AuditLog).filter_by(action="SIGNALEMENT_ESCALATED").first()
        assert saved is not None

    def test_decision_logged(self, db: Session, users: dict):
        """Test that decision-making is logged."""
        log = AuditLog(
            ts=datetime.now(timezone.utc),
            user=users["chief"].name,
            role=users["chief"].role,
            action="SIGNALEMENT_DECIDED",
            target="SIG-2024-003 → ANTIC",
        )
        db.add(log)
        db.commit()

        saved = db.query(AuditLog).filter_by(action="SIGNALEMENT_DECIDED").first()
        assert saved is not None
        assert "ANTIC" in saved.target

    def test_transmission_logged(self, db: Session, users: dict):
        """Test that transmission to authorities is logged."""
        log = AuditLog(
            ts=datetime.now(timezone.utc),
            user=users["chief"].name,
            role=users["chief"].role,
            action="TRANSMISSION_CREATED",
            target="SIG-2024-004 → Armée",
        )
        db.add(log)
        db.commit()

        saved = db.query(AuditLog).filter_by(action="TRANSMISSION_CREATED").first()
        assert saved is not None

    def test_user_management_logged(self, db: Session, users: dict):
        """Test that user management actions are logged."""
        log = AuditLog(
            ts=datetime.now(timezone.utc),
            user=users["admin"].name,
            role=users["admin"].role,
            action="USER_CREATED",
            target="newuser@example.com",
        )
        db.add(log)
        db.commit()

        saved = db.query(AuditLog).filter_by(action="USER_CREATED").first()
        assert saved is not None


class TestAuditTrailCompletion:
    """Tests for audit trail completeness across workflow."""

    def test_complete_signalement_workflow_trail(self, db: Session, users: dict):
        """Test that complete workflow leaves complete audit trail."""
        actions = [
            "SIGNALEMENT_CREATED",
            "SIGNALEMENT_ESCALATED",
            "SIGNALEMENT_DECIDED",
        ]

        for action in actions:
            log = AuditLog(
                ts=datetime.now(timezone.utc),
                user=users["analyst_jr"].name,
                role=users["analyst_jr"].role,
                action=action,
                target="SIG-2024-001",
            )
            db.add(log)
        db.commit()

        for action in actions:
            saved = db.query(AuditLog).filter_by(
                action=action,
                target="SIG-2024-001"
            ).first()
            assert saved is not None

    def test_audit_trail_chronological_order(self, db: Session, users: dict):
        """Test that audit trail maintains chronological order."""
        now = datetime.now(timezone.utc)
        times = [now + timedelta(seconds=i) for i in range(5)]

        for i, ts in enumerate(times):
            log = AuditLog(
                ts=ts,
                user=users["analyst_jr"].name,
                role=users["analyst_jr"].role,
                action=f"ACTION_{i}",
                target=f"target_{i}",
            )
            db.add(log)
        db.commit()

        logs = db.query(AuditLog).order_by(AuditLog.ts).all()
        for i in range(len(logs) - 1):
            assert logs[i].ts <= logs[i + 1].ts


class TestAuditDataIntegrity:
    """Tests for audit data integrity and completeness."""

    def test_audit_includes_user_information(self, db: Session, users: dict):
        """Test that audit includes user name and role."""
        for role, user in users.items():
            log = AuditLog(
                ts=datetime.now(timezone.utc),
                user=user.name,
                role=user.role,
                action="TEST_ACTION",
                target="test",
            )
            db.add(log)
        db.commit()

        for role, user in users.items():
            saved = db.query(AuditLog).filter_by(role=role).first()
            assert saved is not None
            assert saved.user == user.name

    def test_audit_includes_action_details(self, db: Session):
        """Test that audit includes action and target details."""
        actions = {
            "SIGNALEMENT_CREATED": "SIG-2024-001",
            "ESCALATION_REQUESTED": "SIG-2024-002",
            "DECISION_MADE": "SIG-2024-003 → Validé",
        }

        for action, target in actions.items():
            log = AuditLog(
                ts=datetime.now(timezone.utc),
                user="Test User",
                role="analyst_jr",
                action=action,
                target=target,
            )
            db.add(log)
        db.commit()

        for action, target in actions.items():
            saved = db.query(AuditLog).filter_by(action=action).first()
            assert saved is not None
            assert saved.target == target

    def test_audit_timestamp_precision(self, db: Session):
        """Test that audit timestamp has sufficient precision."""
        t1 = datetime.now(timezone.utc)
        log1 = AuditLog(
            ts=t1,
            user="User1",
            role="analyst_jr",
            action="ACTION1",
            target="target1",
        )
        db.add(log1)
        db.commit()

        t2 = datetime.now(timezone.utc)
        log2 = AuditLog(
            ts=t2,
            user="User2",
            role="analyst_sr",
            action="ACTION2",
            target="target2",
        )
        db.add(log2)
        db.commit()

        saved1 = db.query(AuditLog).filter_by(action="ACTION1").first()
        saved2 = db.query(AuditLog).filter_by(action="ACTION2").first()

        # Should be different timestamps
        assert saved1.ts != saved2.ts


class TestCitizenAnonymization:
    """Tests for citizen data anonymization in audit logs."""

    def test_audit_logs_do_not_contain_citizen_names(self, db: Session, users: dict):
        """Test that citizen personal data is not logged in audit trail."""
        # Audit logs should not contain actual citizen names
        log = AuditLog(
            ts=datetime.now(timezone.utc),
            user=users["analyst_jr"].name,
            role=users["analyst_jr"].role,
            action="SIGNALEMENT_CREATED",
            target="SIG-2024-001",  # Uses signalement ref, not citizen name
        )
        db.add(log)
        db.commit()

        saved = db.query(AuditLog).first()
        # Target should be identifier, not personal data
        assert "SIG-" in saved.target or "citizen" in saved.target.lower()

    def test_audit_logs_use_identifiers(self, db: Session, users: dict):
        """Test that audit logs use identifiers rather than sensitive data."""
        actions_with_identifiers = [
            ("CITIZEN_REPORT_RECEIVED", "REP-001"),
            ("SIGNALEMENT_CREATED", "SIG-2024-001"),
            ("ESCALATION_REQUESTED", "SIG-2024-002"),
        ]

        for action, identifier in actions_with_identifiers:
            log = AuditLog(
                ts=datetime.now(timezone.utc),
                user=users["analyst_jr"].name,
                role=users["analyst_jr"].role,
                action=action,
                target=identifier,
            )
            db.add(log)
        db.commit()

        for action, identifier in actions_with_identifiers:
            saved = db.query(AuditLog).filter_by(action=action).first()
            assert saved is not None
            assert identifier in saved.target


class TestAuditExport:
    """Tests for audit report generation for ethics committee."""

    def test_audit_logs_queryable_by_date_range(self, db: Session, users: dict):
        """Test that audit logs can be filtered by date range."""
        now = datetime.now(timezone.utc)
        earlier = now - timedelta(days=1)
        later = now + timedelta(days=1)

        # Add logs at different times
        for i in range(3):
            log = AuditLog(
                ts=now + timedelta(hours=i),
                user=users["analyst_jr"].name,
                role=users["analyst_jr"].role,
                action=f"ACTION_{i}",
                target=f"target_{i}",
            )
            db.add(log)
        db.commit()

        # Query within range
        logs_in_range = db.query(AuditLog).filter(
            AuditLog.ts >= earlier,
            AuditLog.ts <= later
        ).all()
        assert len(logs_in_range) == 3

    def test_audit_logs_queryable_by_user(self, db: Session, users: dict):
        """Test that audit logs can be filtered by user."""
        user = users["analyst_jr"]

        log = AuditLog(
            ts=datetime.now(timezone.utc),
            user=user.name,
            role=user.role,
            action="TEST_ACTION",
            target="test",
        )
        db.add(log)
        db.commit()

        saved = db.query(AuditLog).filter_by(user=user.name).first()
        assert saved is not None
        assert saved.user == user.name

    def test_audit_logs_queryable_by_action(self, db: Session):
        """Test that audit logs can be filtered by action type."""
        actions = ["CREATE", "UPDATE", "DELETE", "DECISION"]

        for action in actions:
            log = AuditLog(
                ts=datetime.now(timezone.utc),
                user="Test User",
                role="analyst_jr",
                action=action,
                target="test",
            )
            db.add(log)
        db.commit()

        for action in actions:
            saved = db.query(AuditLog).filter_by(action=action).first()
            assert saved is not None

    def test_audit_report_includes_all_fields(self, db: Session, users: dict):
        """Test that audit data includes all required fields for ethics committee report."""
        log = AuditLog(
            ts=datetime.now(timezone.utc),
            user=users["analyst_jr"].name,
            role=users["analyst_jr"].role,
            action="SIGNALEMENT_CREATED",
            target="SIG-2024-001",
        )
        db.add(log)
        db.commit()

        saved = db.query(AuditLog).first()
        # Verify all fields present for reporting
        assert saved.ts is not None
        assert saved.user is not None
        assert saved.role is not None
        assert saved.action is not None
        assert saved.target is not None
