"""Workflow tests for SENTINELLE — citizen reports, escalation, decision-making, and SLA tracking."""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import Signalement, AuditLog, Notification, CitizenReport


class TestCitizenReportWorkflow:
    """Tests for citizen report submission and signalement creation."""

    def test_citizen_report_submission(self, client: TestClient, db: Session):
        """Test submitting a citizen report creates signalement."""
        response = client.post(
            "/api/v1/public/citizen-reports",
            json={
                "threat_type": "Child Safety",
                "url": "https://example.com/post",
                "description": "Suspicious content involving minors",
                "region": "National",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "reference" in data
        assert "signalement_reference" in data
        assert data["status"] == "received"

        # Verify citizen report was created
        report = db.query(CitizenReport).filter_by(reference=data["reference"]).first()
        assert report is not None
        assert report.threat_type == "Child Safety"
        assert report.status == "Nouveau"

    def test_citizen_report_creates_signalement(self, client: TestClient, db: Session, users: dict):
        """Test that citizen report automatically creates signalement."""
        response = client.post(
            "/api/v1/public/citizen-reports",
            json={
                "threat_type": "Trafficking",
                "url": "https://example.com/trafficking",
                "description": "Human trafficking network",
                "region": "National",
            },
        )
        assert response.status_code == 201
        data = response.json()

        # Verify signalement was created
        sig = db.query(Signalement).filter_by(reference=data["signalement_reference"]).first()
        assert sig is not None
        assert sig.status == "Nouveau"
        assert sig.category == "Trafficking"
        # Should be auto-assigned to least-loaded analyst_jr
        assert sig.assigned_to is not None

    def test_citizen_report_auto_assigned_to_analyst(self, client: TestClient, db: Session, users: dict):
        """Test that signalement is assigned to least-loaded analyst_jr."""
        response = client.post(
            "/api/v1/public/citizen-reports",
            json={
                "threat_type": "Hate Speech",
                "url": "https://example.com/hate",
                "description": "Hate speech content",
                "region": "National",
            },
        )
        assert response.status_code == 201
        data = response.json()

        sig = db.query(Signalement).filter_by(reference=data["signalement_reference"]).first()
        assert sig.assigned_to == users["analyst_jr"].id

    def test_citizen_report_audit_logged(self, client: TestClient, db: Session):
        """Test that signalement creation is logged in audit trail."""
        response = client.post(
            "/api/v1/public/citizen-reports",
            json={
                "threat_type": "Child Safety",
                "url": "https://example.com/post",
                "description": "Test report",
                "region": "National",
            },
        )
        assert response.status_code == 201
        data = response.json()

        # Check audit log
        log = db.query(AuditLog).filter(
            AuditLog.action == "SIGNALEMENT_CREATED",
            AuditLog.target == data["signalement_reference"],
        ).first()
        assert log is not None


class TestEscalationWorkflow:
    """Tests for signalement escalation."""

    def test_analyst_jr_can_escalate(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that analyst_jr can escalate signalement."""
        sig = signalements[0]  # Nouveau state
        headers = headers_for_role("analyst_jr")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/escalate",
            json={"reason": "Requires senior review"},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Escalade"
        assert data["escalated_to"] is not None

    def test_analyst_sr_can_escalate(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that analyst_sr can escalate signalement."""
        sig = signalements[0]
        headers = headers_for_role("analyst_sr")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/escalate",
            json={"reason": "Requires chief decision"},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Escalade"

    def test_chief_cannot_escalate(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that chief cannot use escalate endpoint."""
        sig = signalements[0]
        headers = headers_for_role("chief")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/escalate",
            json={"reason": "Request escalation"},
            headers=headers,
        )
        assert response.status_code == 403

    def test_escalation_creates_notification(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that escalation creates notification for target."""
        sig = signalements[0]
        headers = headers_for_role("analyst_jr")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/escalate",
            json={"reason": "Requires review"},
            headers=headers,
        )
        assert response.status_code == 200

        # Check notification was created
        notif = db.query(Notification).filter(
            Notification.level == "HIGH",
        ).first()
        assert notif is not None

    def test_escalation_audit_logged(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that escalation is logged."""
        sig = signalements[0]
        headers = headers_for_role("analyst_jr")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/escalate",
            json={"reason": "Senior review required"},
            headers=headers,
        )
        assert response.status_code == 200

        log = db.query(AuditLog).filter(
            AuditLog.action == "SIGNALEMENT_ESCALATED",
            AuditLog.target == sig.reference,
        ).first()
        assert log is not None
        assert log.user == users["analyst_jr"].name


class TestDecisionWorkflow:
    """Tests for signalement decision-making."""

    def test_chief_can_decide_validated(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that chief can make validation decision."""
        sig = signalements[1]  # Escalade state
        headers = headers_for_role("chief")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Validé",
                "decision_reason": "Confirmed threat, forwarding to ANTIC",
                "transmitted_to": "ANTIC",
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["decision"] == "Validé"
        assert data["status"] == "Transmitted"
        assert data["transmitted_to"] == "ANTIC"

    def test_chief_can_decide_rejected(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that chief can reject signalement."""
        sig = signalements[0]
        headers = headers_for_role("chief")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Rejeté",
                "decision_reason": "False positive, does not meet threat criteria",
            },
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["decision"] == "Rejeté"

    def test_director_can_decide(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that director can also make decisions."""
        sig = signalements[0]
        headers = headers_for_role("director")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Validé",
                "decision_reason": "Critical threat",
                "transmitted_to": "Armée",
            },
            headers=headers,
        )
        assert response.status_code == 200

    def test_analyst_jr_cannot_decide(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that analyst_jr cannot make decisions."""
        sig = signalements[0]
        headers = headers_for_role("analyst_jr")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Validé",
                "decision_reason": "My decision",
            },
            headers=headers,
        )
        assert response.status_code == 403

    def test_invalid_decision_rejected(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that invalid decision is rejected."""
        sig = signalements[0]
        headers = headers_for_role("chief")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "InvalidChoice",
                "decision_reason": "Invalid",
            },
            headers=headers,
        )
        assert response.status_code == 400

    def test_decision_audit_logged(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that decision is logged."""
        sig = signalements[0]
        headers = headers_for_role("chief")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Validé",
                "decision_reason": "Confirmed threat",
                "transmitted_to": "ANTIC",
            },
            headers=headers,
        )
        assert response.status_code == 200

        log = db.query(AuditLog).filter(
            AuditLog.action == "SIGNALEMENT_DECIDED",
            AuditLog.target.like(f"%{sig.reference}%"),
        ).first()
        assert log is not None


class TestTransmissionWorkflow:
    """Tests for transmission to authorities."""

    def test_validated_signalement_transmitted(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that validated signalement is transmitted to authority."""
        sig = signalements[0]
        headers = headers_for_role("chief")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Validé",
                "decision_reason": "Forward to authorities",
                "transmitted_to": "ANTIC",
            },
            headers=headers,
        )
        assert response.status_code == 200

        # Verify transmission
        updated_sig = db.get(Signalement, sig.id)
        assert updated_sig.status == "Transmitted"
        assert updated_sig.transmitted_to == "ANTIC"

    def test_rejected_signalement_not_transmitted(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that rejected signalement is not transmitted."""
        sig = signalements[0]
        headers = headers_for_role("chief")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Rejeté",
                "decision_reason": "False positive",
            },
            headers=headers,
        )
        assert response.status_code == 200

        updated_sig = db.get(Signalement, sig.id)
        assert updated_sig.transmitted_to is None

    def test_transmission_notification_created(self, client: TestClient, db: Session, users: dict, headers_for_role, signalements):
        """Test that transmission creates notification."""
        sig = signalements[0]
        headers = headers_for_role("chief")

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Validé",
                "decision_reason": "To ANTIC",
                "transmitted_to": "ANTIC",
            },
            headers=headers,
        )
        assert response.status_code == 200

        # Should create notification
        notif = db.query(Notification).first()
        assert notif is not None


class TestSLATracking:
    """Tests for SLA compliance and deadline tracking."""

    def test_sla_deadline_24_hours(self, client: TestClient, db: Session):
        """Test that SLA deadline is 24 hours from creation."""
        now = datetime.now(timezone.utc)
        sig = Signalement(
            reference="SIG-SLA-001",
            status="Nouveau",
            category="Test",
            gravity="Modéré",
            created_at=now,
            updated_at=now,
        )
        db.add(sig)
        db.commit()

        sla_deadline = sig.created_at + timedelta(hours=24)
        assert sla_deadline > now
        assert (sla_deadline - now).total_seconds() < 86400 + 60

    def test_sla_warning_notification_at_6_hours(self, client: TestClient, db: Session, users: dict):
        """Test that SLA warning is triggered at 6 hours."""
        # Create signalement 18 hours ago
        now = datetime.now(timezone.utc)
        sig = Signalement(
            reference="SIG-SLA-002",
            status="Nouveau",
            category="Test",
            gravity="Modéré",
            assigned_to=users["analyst_jr"].id,
            created_at=now - timedelta(hours=18),
            updated_at=now - timedelta(hours=18),
        )
        db.add(sig)
        db.commit()

        # Should be 6 hours until deadline
        hours_remaining = (sig.created_at + timedelta(hours=24) - now).total_seconds() / 3600
        assert hours_remaining < 6
        assert hours_remaining > 5

    def test_sla_exceeded_after_24_hours(self, client: TestClient, db: Session):
        """Test that signalement is overdue after 24 hours."""
        now = datetime.now(timezone.utc)
        sig = Signalement(
            reference="SIG-SLA-003",
            status="Nouveau",
            category="Test",
            gravity="Modéré",
            created_at=now - timedelta(hours=25),
            updated_at=now - timedelta(hours=25),
        )
        db.add(sig)
        db.commit()

        sla_deadline = sig.created_at + timedelta(hours=24)
        assert now > sla_deadline
