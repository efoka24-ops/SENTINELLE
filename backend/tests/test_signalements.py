"""Tests for signalement escalation and decision workflows."""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Signalement, CitizenReport, User, AuditLog, Notification


class TestSignalementWorkflow:
    """Test the full signalement workflow: creation, escalation, and decision."""

    def test_create_signalement_on_citizen_report(self, client: TestClient, db: Session):
        """Test that submitting a citizen report creates a signalement."""
        # Submit a citizen report
        response = client.post(
            "/api/v1/public/citizen-reports",
            json={
                "threat_type": "child_safety",
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

        # Verify signalement was created
        sig = db.query(Signalement).filter_by(
            reference=data["signalement_reference"]
        ).first()
        assert sig is not None
        assert sig.status == "Nouveau"
        assert sig.citizen_report_id is not None
        assert sig.category == "child_safety"
        assert sig.gravity == "Modéré"

        # Verify audit log was created
        audit = db.query(AuditLog).filter_by(
            action="SIGNALEMENT_CREATED",
            target=data["signalement_reference"],
        ).first()
        assert audit is not None

    def test_escalate_signalement(
        self, client: TestClient, db: Session, users: dict, signalements: list,
        headers_for_role, auth_tokens,
    ):
        """Test escalation of a signalement by an analyst."""
        sig = signalements[0]  # Nouveau signalement assigned to analyst_jr
        analyst_jr_id = users["analyst_jr"].id

        # Create JWT token for analyst_jr
        analyst_jr_headers = {"Authorization": f"Bearer {auth_tokens['analyst_jr']}"}

        # Escalate the signalement
        response = client.post(
            f"/api/v1/signalements/{sig.id}/escalate",
            json={"reason": "Requires senior review due to complexity"},
            headers=analyst_jr_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Escalade"
        assert data["id"] == sig.id

        # Verify escalation in database
        db.refresh(db.get(Signalement, sig.id))
        sig_updated = db.get(Signalement, sig.id)
        assert sig_updated.status == "Escalade"
        assert sig_updated.escalated_to is not None

        # Verify audit log
        audit = db.query(AuditLog).filter_by(
            action="SIGNALEMENT_ESCALATED",
            target=sig.reference,
        ).first()
        assert audit is not None
        assert audit.user == users["analyst_jr"].name

        # Verify notification was created
        notif = db.query(Notification).filter_by(
            threat_type=sig.category,
        ).first()
        assert notif is not None

    def test_cannot_escalate_as_unauthorized_role(
        self, client: TestClient, db: Session, signalements: list, auth_tokens,
    ):
        """Test that only analysts can escalate."""
        sig = signalements[0]
        auditor_headers = {"Authorization": f"Bearer {auth_tokens['auditor']}"}

        response = client.post(
            f"/api/v1/signalements/{sig.id}/escalate",
            json={"reason": "Test escalation"},
            headers=auditor_headers,
        )
        assert response.status_code == 403

    def test_decide_signalement_validated(
        self, client: TestClient, db: Session, users: dict, signalements: list, auth_tokens,
    ):
        """Test decision on a signalement (Validé case)."""
        # Use signalement in Decision status or escalated one
        sig = signalements[1]  # Escalade status
        if sig.status != "Escalade" and sig.status != "Decision":
            sig.status = "Decision"
            db.commit()

        chief_headers = {"Authorization": f"Bearer {auth_tokens['chief']}"}

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Validé",
                "decision_reason": "Threat confirmed, requires intervention",
                "transmitted_to": "ANTIC",
            },
            headers=chief_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["decision"] == "Validé"
        assert data["status"] == "Transmitted"
        assert data["transmitted_to"] == "ANTIC"

        # Verify database update
        sig_updated = db.get(Signalement, sig.id)
        assert sig_updated.decision == "Validé"
        assert sig_updated.transmitted_to == "ANTIC"

        # Verify audit log
        audit = db.query(AuditLog).filter_by(
            action="SIGNALEMENT_DECIDED",
        ).first()
        assert audit is not None

    def test_decide_signalement_rejected(
        self, client: TestClient, db: Session, users: dict, signalements: list, auth_tokens,
    ):
        """Test decision on a signalement (Rejeté case)."""
        sig = signalements[3]  # Use Decision status signalement
        chief_headers = {"Authorization": f"Bearer {auth_tokens['chief']}"}

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Rejeté",
                "decision_reason": "False positive: does not meet criteria",
            },
            headers=chief_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["decision"] == "Rejeté"
        assert data["status"] == "Transmitted"

    def test_cannot_decide_as_unauthorized_role(
        self, client: TestClient, db: Session, signalements: list, auth_tokens,
    ):
        """Test that only chief+ can make decisions."""
        sig = signalements[1]
        analyst_jr_headers = {"Authorization": f"Bearer {auth_tokens['analyst_jr']}"}

        response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Validé",
                "decision_reason": "Test",
                "transmitted_to": "ANTIC",
            },
            headers=analyst_jr_headers,
        )
        assert response.status_code == 403

    def test_reassign_signalement(
        self, client: TestClient, db: Session, users: dict, signalements: list, auth_tokens,
    ):
        """Test reassignment of a signalement to another analyst."""
        sig = signalements[0]
        old_assigned = sig.assigned_to
        new_analyst_id = users["analyst_sr"].id

        chief_headers = {"Authorization": f"Bearer {auth_tokens['chief']}"}

        response = client.patch(
            f"/api/v1/signalements/{sig.id}/reassign",
            json={"assigned_to_id": new_analyst_id},
            headers=chief_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["assigned_to"] == new_analyst_id

        # Verify database
        sig_updated = db.get(Signalement, sig.id)
        assert sig_updated.assigned_to == new_analyst_id

        # Verify audit log
        audit = db.query(AuditLog).filter_by(
            action="SIGNALEMENT_REASSIGNED",
            target=sig.reference,
        ).first()
        assert audit is not None

    def test_get_signalements_assigned_to_me(
        self, client: TestClient, db: Session, users: dict, signalements: list, auth_tokens,
    ):
        """Test retrieving signalements assigned to current user."""
        analyst_jr_headers = {"Authorization": f"Bearer {auth_tokens['analyst_jr']}"}

        response = client.get(
            "/api/v1/signalements/assigned-to-me",
            headers=analyst_jr_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have signalements assigned to analyst_jr
        assert len(data) > 0
        for sig in data:
            assert sig["assigned_to"] == users["analyst_jr"].id

    def test_get_escalation_pending(
        self, client: TestClient, db: Session, users: dict, signalements: list, auth_tokens,
    ):
        """Test retrieving signalements pending decision."""
        chief_headers = {"Authorization": f"Bearer {auth_tokens['chief']}"}

        response = client.get(
            "/api/v1/signalements/escalation-pending",
            headers=chief_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned signalements should be in Decision or Escalade status
        for sig in data:
            assert sig["status"] in ["Decision", "Escalade"]

    def test_get_signalement_detail(
        self, client: TestClient, db: Session, users: dict, signalements: list, auth_tokens,
    ):
        """Test retrieving a specific signalement."""
        sig = signalements[0]
        analyst_jr_headers = {"Authorization": f"Bearer {auth_tokens['analyst_jr']}"}

        # Analyst can view their own signalements
        response = client.get(
            f"/api/v1/signalements/{sig.id}",
            headers=analyst_jr_headers,
        )
        # Note: Only get if assigned to this analyst
        if sig.assigned_to == users["analyst_jr"].id:
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == sig.id
        else:
            assert response.status_code == 403

    def test_signalement_full_workflow(
        self, client: TestClient, db: Session, users: dict, auth_tokens,
    ):
        """Test complete workflow: create report → create signalement → escalate → decide → transmit."""
        # 1. Create citizen report
        citizen_response = client.post(
            "/api/v1/public/citizen-reports",
            json={
                "threat_type": "child_safety",
                "url": "https://example.com/post",
                "description": "Full workflow test",
                "region": "National",
            },
        )
        assert citizen_response.status_code == 201
        sig_ref = citizen_response.json()["signalement_reference"]

        # Retrieve the created signalement
        sig = db.query(Signalement).filter_by(reference=sig_ref).first()
        assert sig is not None
        assert sig.status == "Nouveau"

        # 2. Escalate as analyst_jr
        analyst_jr_headers = {"Authorization": f"Bearer {auth_tokens['analyst_jr']}"}
        escalate_response = client.post(
            f"/api/v1/signalements/{sig.id}/escalate",
            json={"reason": "Needs senior review"},
            headers=analyst_jr_headers,
        )
        assert escalate_response.status_code == 200
        assert escalate_response.json()["status"] == "Escalade"

        # 3. Make decision as chief
        chief_headers = {"Authorization": f"Bearer {auth_tokens['chief']}"}
        decide_response = client.post(
            f"/api/v1/signalements/{sig.id}/decide",
            json={
                "decision": "Validé",
                "decision_reason": "Confirmed threat",
                "transmitted_to": "ANTIC",
            },
            headers=chief_headers,
        )
        assert decide_response.status_code == 200
        assert decide_response.json()["decision"] == "Validé"
        assert decide_response.json()["transmitted_to"] == "ANTIC"

        # 4. Verify final state
        final_sig = db.get(Signalement, sig.id)
        assert final_sig.status == "Transmitted"
        assert final_sig.decision == "Validé"
        assert final_sig.transmitted_to == "ANTIC"

        # 5. Verify audit trail
        audits = db.query(AuditLog).filter_by(target=sig_ref).all()
        actions = [a.action for a in audits]
        assert "SIGNALEMENT_CREATED" in actions
        assert "SIGNALEMENT_ESCALATED" in actions
        assert "SIGNALEMENT_DECIDED" in actions
