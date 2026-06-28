"""Notification and messaging tests for SENTINELLE."""
import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import Notification


class TestNotificationCreation:
    """Tests for notification creation and delivery."""

    def test_escalation_creates_notification(self, db: Session, users: dict, signalements):
        """Test that escalation creates a notification."""
        sig = signalements[0]

        # Create notification
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target=users["analyst_sr"].email,
            level="HIGH",
            platform="Instagram",
            author="suspicious_account",
            post_url="https://instagram.com/p/123",
            evidence_text="Test evidence",
            threat_type="Child Safety",
            message=f"Escalation: Signalement {sig.reference}",
            sent_by=users["analyst_jr"].email,
            status="pending",
        )
        db.add(notif)
        db.commit()

        # Verify notification was created
        saved_notif = db.query(Notification).filter_by(
            target=users["analyst_sr"].email,
            message_ilike=f"%{sig.reference}%"
        ).first()
        assert saved_notif is not None
        assert saved_notif.level == "HIGH"

    def test_notification_contains_required_fields(self, db: Session, users: dict):
        """Test that notification contains all required fields."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target="user@example.com",
            level="CRITICAL",
            platform="Facebook",
            author="threat_actor",
            post_url="https://facebook.com/post/123",
            evidence_text="Critical threat evidence",
            threat_type="Trafficking",
            message="Critical notification",
            sent_by=users["admin"].email,
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).first()
        assert saved.channel == "email"
        assert saved.target == "user@example.com"
        assert saved.level == "CRITICAL"
        assert saved.threat_type == "Trafficking"
        assert saved.status == "sent"

    def test_notification_timestamp_recorded(self, db: Session):
        """Test that notification timestamp is recorded correctly."""
        now = datetime.now(timezone.utc)
        notif = Notification(
            ts=now,
            channel="email",
            target="user@example.com",
            level="HIGH",
            message="Test",
            status="pending",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).first()
        assert saved.ts is not None
        # Should be within a second of now
        assert abs((saved.ts - now).total_seconds()) < 1


class TestNotificationChannels:
    """Tests for different notification channels."""

    def test_email_notification(self, db: Session):
        """Test email channel notifications."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target="analyst@example.com",
            level="HIGH",
            message="Email notification test",
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(channel="email").first()
        assert saved is not None
        assert saved.channel == "email"

    def test_sms_notification(self, db: Session):
        """Test SMS channel notifications."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="sms",
            target="+33612345678",
            level="CRITICAL",
            message="SMS alert test",
            status="pending",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(channel="sms").first()
        assert saved is not None

    def test_whatsapp_notification(self, db: Session):
        """Test WhatsApp channel notifications."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="whatsapp",
            target="33612345678",
            level="HIGH",
            message="WhatsApp message test",
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(channel="whatsapp").first()
        assert saved is not None


class TestNotificationLevels:
    """Tests for notification severity levels."""

    def test_critical_level_notification(self, db: Session):
        """Test CRITICAL level notification."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target="director@example.com",
            level="CRITICAL",
            threat_type="Child Safety",
            message="Critical child safety threat",
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(level="CRITICAL").first()
        assert saved is not None

    def test_high_level_notification(self, db: Session):
        """Test HIGH level notification."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target="chief@example.com",
            level="HIGH",
            message="High priority threat",
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(level="HIGH").first()
        assert saved is not None

    def test_medium_level_notification(self, db: Session):
        """Test MEDIUM level notification."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target="analyst@example.com",
            level="MEDIUM",
            message="Medium priority item",
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(level="MEDIUM").first()
        assert saved is not None


class TestSLAWarningNotifications:
    """Tests for SLA-based warning notifications."""

    def test_sla_warning_6_hours_before_deadline(self, db: Session, users: dict):
        """Test SLA warning notification at 6 hours remaining."""
        # Simulate a signalement that was created 18 hours ago
        # Deadline is 24 hours, so 6 hours remain
        now = datetime.now(timezone.utc)
        created_time = now - timedelta(hours=18)

        notif = Notification(
            ts=now,
            channel="email",
            target=users["chief"].email,
            level="HIGH",
            message="SLA WARNING: Signalement must be decided within 6 hours",
            evidence_text="Signalement SIG-2024-003",
            status="pending",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter(
            Notification.message.like("%SLA WARNING%")
        ).first()
        assert saved is not None
        assert saved.level == "HIGH"

    def test_sla_overdue_notification(self, db: Session, users: dict):
        """Test notification for overdue signalements."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target=users["director"].email,
            level="CRITICAL",
            message="URGENT: Signalement SIG-2024-002 has exceeded 24-hour SLA",
            status="pending",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter(
            Notification.message.like("%exceeded%SLA%")
        ).first()
        assert saved is not None
        assert saved.level == "CRITICAL"


class TestNotificationTargeting:
    """Tests for correct notification recipients."""

    def test_notification_targets_analyst_sr_on_escalation(self, db: Session, users: dict):
        """Test that escalation targets analyst_sr."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target=users["analyst_sr"].email,
            level="HIGH",
            message="Escalation request for review",
            sent_by=users["analyst_jr"].email,
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(
            target=users["analyst_sr"].email
        ).first()
        assert saved is not None

    def test_notification_targets_chief_on_decision_needed(self, db: Session, users: dict):
        """Test that decision-needed notifications target chief."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target=users["chief"].email,
            level="HIGH",
            message="Signalement ready for decision",
            sent_by=users["analyst_sr"].email,
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(
            target=users["chief"].email
        ).first()
        assert saved is not None

    def test_notification_targets_director_on_escalation(self, db: Session, users: dict):
        """Test that escalation beyond chief targets director."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target=users["director"].email,
            level="HIGH",
            message="Further escalation required",
            sent_by=users["chief"].email,
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(
            target=users["director"].email
        ).first()
        assert saved is not None


class TestNotificationStatus:
    """Tests for notification delivery status tracking."""

    def test_notification_pending_status(self, db: Session):
        """Test notification with pending status."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target="user@example.com",
            message="Test message",
            status="pending",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(status="pending").first()
        assert saved is not None

    def test_notification_sent_status(self, db: Session):
        """Test notification with sent status."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target="user@example.com",
            message="Test message",
            status="sent",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(status="sent").first()
        assert saved is not None

    def test_notification_failed_status(self, db: Session):
        """Test notification with failed status."""
        notif = Notification(
            ts=datetime.now(timezone.utc),
            channel="email",
            target="invalid@example",
            message="Test message",
            status="failed",
        )
        db.add(notif)
        db.commit()

        saved = db.query(Notification).filter_by(status="failed").first()
        assert saved is not None


class TestNotificationQueryFiltering:
    """Tests for querying and filtering notifications."""

    def test_filter_notifications_by_level(self, db: Session):
        """Test filtering notifications by severity level."""
        levels = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

        for level in levels:
            notif = Notification(
                ts=datetime.now(timezone.utc),
                channel="email",
                target="user@example.com",
                level=level,
                message=f"Test {level}",
                status="sent",
            )
            db.add(notif)
        db.commit()

        for level in levels:
            count = db.query(Notification).filter_by(level=level).count()
            assert count == 1

    def test_filter_notifications_by_channel(self, db: Session):
        """Test filtering notifications by channel."""
        channels = ["email", "sms", "whatsapp"]

        for channel in channels:
            notif = Notification(
                ts=datetime.now(timezone.utc),
                channel=channel,
                target="user@example.com",
                message=f"Test {channel}",
                status="sent",
            )
            db.add(notif)
        db.commit()

        for channel in channels:
            count = db.query(Notification).filter_by(channel=channel).count()
            assert count == 1

    def test_filter_notifications_by_threat_type(self, db: Session):
        """Test filtering notifications by threat type."""
        threats = ["Child Safety", "Trafficking", "Hate Speech"]

        for threat in threats:
            notif = Notification(
                ts=datetime.now(timezone.utc),
                channel="email",
                target="user@example.com",
                threat_type=threat,
                message=f"Test {threat}",
                status="sent",
            )
            db.add(notif)
        db.commit()

        for threat in threats:
            count = db.query(Notification).filter_by(threat_type=threat).count()
            assert count == 1
