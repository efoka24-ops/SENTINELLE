"""Test data fixtures for SENTINELLE tests."""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models import (
    User, Signalement, Alert, CitizenReport, AuditLog,
    Notification, LoginCode
)
from app.security import hash_password


def create_test_users(db: Session) -> dict[str, User]:
    """Create test users with different roles."""
    users_data = [
        {
            "email": "analyst_jr@test.local",
            "name": "Junior Analyst",
            "role": "analyst_jr",
            "department": "Analysis",
        },
        {
            "email": "analyst_sr@test.local",
            "name": "Senior Analyst",
            "role": "analyst_sr",
            "department": "Analysis",
        },
        {
            "email": "chief@test.local",
            "name": "Team Chief",
            "role": "chief",
            "department": "Operations",
        },
        {
            "email": "director@test.local",
            "name": "Operations Director",
            "role": "director",
            "department": "Direction",
        },
        {
            "email": "admin@test.local",
            "name": "System Administrator",
            "role": "admin",
            "department": "IT",
        },
        {
            "email": "auditor@test.local",
            "name": "Ethics Auditor",
            "role": "auditor",
            "department": "Compliance",
        },
    ]

    users = {}
    for data in users_data:
        user = User(
            email=data["email"],
            name=data["name"],
            role=data["role"],
            department=data["department"],
            hashed_password=hash_password("testpass123"),
            is_active=True,
        )
        db.add(user)
        users[data["role"]] = user

    db.commit()
    return users


def create_test_citizen_reports(db: Session) -> list[CitizenReport]:
    """Create test citizen reports at different stages."""
    reports = [
        CitizenReport(
            reference="REPORT-001",
            threat_type="Child Safety",
            url="https://example.com/post1",
            description="Suspicious content involving minors",
            region="National",
            status="Nouveau",
            ai_prescore=0.85,
        ),
        CitizenReport(
            reference="REPORT-002",
            threat_type="Trafficking",
            url="https://example.com/post2",
            description="Suspected human trafficking network",
            region="National",
            status="Nouveau",
            ai_prescore=0.72,
        ),
        CitizenReport(
            reference="REPORT-003",
            threat_type="Hate Speech",
            url="https://example.com/post3",
            description="Hate speech targeting specific group",
            region="National",
            status="Nouveau",
            ai_prescore=0.65,
        ),
    ]
    for report in reports:
        db.add(report)
    db.commit()
    return reports


def create_test_alerts(db: Session) -> list[Alert]:
    """Create test alerts with various threat levels."""
    alerts = [
        Alert(
            number="ALERT-2024-001",
            level="CRITICAL",
            threat_type="Child Safety",
            title="High-severity child safety threat detected",
            platform="Instagram",
            region="National",
            place="Online",
            score=0.95,
            status="Ouvert",
        ),
        Alert(
            number="ALERT-2024-002",
            level="HIGH",
            threat_type="Trafficking",
            title="Potential human trafficking network",
            platform="Facebook",
            region="National",
            place="Online",
            score=0.82,
            status="Ouvert",
        ),
        Alert(
            number="ALERT-2024-003",
            level="MEDIUM",
            threat_type="Hate Speech",
            title="Moderate-level hate speech content",
            platform="Twitter",
            region="National",
            place="Online",
            score=0.55,
            status="Ouvert",
        ),
        Alert(
            number="ALERT-2024-004",
            level="LOW",
            threat_type="Misinformation",
            title="Low-priority misinformation",
            platform="TikTok",
            region="National",
            place="Online",
            score=0.32,
            status="Ouvert",
        ),
    ]
    for alert in alerts:
        db.add(alert)
    db.commit()
    return alerts


def create_test_signalements(
    db: Session,
    users: dict[str, User],
    citizen_reports: list[CitizenReport],
    alerts: list[Alert],
) -> list[Signalement]:
    """Create test signalements at different workflow stages."""
    now = datetime.now(timezone.utc)

    signalements = [
        # Newly created signalement (Nouveau)
        Signalement(
            reference="SIG-2024-001",
            status="Nouveau",
            citizen_report_id=citizen_reports[0].id,
            category="Child Safety",
            gravity="Critique",
            assigned_to=users["analyst_jr"].id,
            created_at=now,
            updated_at=now,
        ),
        # Escalated to analyst_sr (Escalade)
        Signalement(
            reference="SIG-2024-002",
            status="Escalade",
            alert_id=alerts[1].id,
            category="Trafficking",
            gravity="Grave",
            assigned_to=users["analyst_jr"].id,
            escalated_to=users["analyst_sr"].id,
            created_at=now - timedelta(hours=12),
            updated_at=now - timedelta(hours=6),
        ),
        # Waiting for decision (Analyse)
        Signalement(
            reference="SIG-2024-003",
            status="Analyse",
            citizen_report_id=citizen_reports[1].id,
            category="Trafficking",
            gravity="Grave",
            assigned_to=users["analyst_sr"].id,
            notes="Verified threat, awaiting chief decision",
            created_at=now - timedelta(hours=18),
            updated_at=now - timedelta(hours=2),
        ),
        # Decision made but not transmitted (Decision)
        Signalement(
            reference="SIG-2024-004",
            status="Decision",
            alert_id=alerts[0].id,
            category="Child Safety",
            gravity="Critique",
            assigned_to=users["analyst_sr"].id,
            decision="Validé",
            decision_reason="Confirmed illegal content, requires immediate intervention",
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(hours=1),
        ),
        # Transmitted to authority (Transmitted)
        Signalement(
            reference="SIG-2024-005",
            status="Transmitted",
            citizen_report_id=citizen_reports[2].id,
            category="Hate Speech",
            gravity="Modéré",
            assigned_to=users["chief"].id,
            decision="Validé",
            decision_reason="Hate speech confirmed, referred to relevant authority",
            transmitted_to="Armée",
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(hours=0.5),
        ),
        # Rejected signalement
        Signalement(
            reference="SIG-2024-006",
            status="Decision",
            alert_id=alerts[3].id,
            category="Misinformation",
            gravity="Faible",
            assigned_to=users["analyst_jr"].id,
            decision="Rejeté",
            decision_reason="False positive: content does not meet threat criteria",
            created_at=now - timedelta(days=3),
            updated_at=now - timedelta(days=2),
        ),
    ]

    for sig in signalements:
        db.add(sig)
    db.commit()
    return signalements


def create_test_login_codes(db: Session, users: dict[str, User]) -> dict[str, str]:
    """Create test login codes for OTP testing."""
    import hashlib
    from datetime import datetime, timedelta

    codes = {}
    for role, user in users.items():
        code = "123456"
        code_hash = hashlib.sha256(code.encode()).hexdigest()

        login_code = LoginCode(
            email=user.email,
            code_hash=code_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            used=False,
        )
        db.add(login_code)
        codes[role] = code

    db.commit()
    return codes


def create_audit_logs(db: Session, users: dict[str, User]) -> list[AuditLog]:
    """Create sample audit log entries."""
    now = datetime.now(timezone.utc)

    logs = [
        AuditLog(
            ts=now - timedelta(hours=2),
            user=users["analyst_jr"].name,
            role="analyst_jr",
            action="SIGNALEMENT_CREATED",
            target="SIG-2024-001",
        ),
        AuditLog(
            ts=now - timedelta(hours=1.5),
            user=users["analyst_jr"].name,
            role="analyst_jr",
            action="ESCALATION_REQUESTED",
            target="SIG-2024-002",
        ),
        AuditLog(
            ts=now - timedelta(hours=1),
            user=users["analyst_sr"].name,
            role="analyst_sr",
            action="SIGNALEMENT_UPDATED",
            target="SIG-2024-002",
        ),
        AuditLog(
            ts=now - timedelta(minutes=30),
            user=users["chief"].name,
            role="chief",
            action="DECISION_MADE",
            target="SIG-2024-004",
        ),
        AuditLog(
            ts=now - timedelta(minutes=15),
            user=users["admin"].name,
            role="admin",
            action="USER_CREATED",
            target="analyst_jr@test.local",
        ),
    ]

    for log in logs:
        db.add(log)
    db.commit()
    return logs


def create_notifications(db: Session, users: dict[str, User]) -> list[Notification]:
    """Create test notifications."""
    now = datetime.now(timezone.utc)

    notifications = [
        Notification(
            ts=now - timedelta(hours=2),
            channel="email",
            target=users["analyst_sr"].email,
            level="HIGH",
            platform="Instagram",
            author="suspicious_account",
            post_url="https://instagram.com/p/123",
            evidence_text="Suspicious content involving minors",
            threat_type="Child Safety",
            message="Escalation request: Signalement SIG-2024-002 requires immediate review",
            sent_by=users["analyst_jr"].email,
            status="sent",
        ),
        Notification(
            ts=now - timedelta(hours=6),
            channel="email",
            target=users["chief"].email,
            level="CRITICAL",
            platform="Facebook",
            author="trafficking_network",
            post_url="https://facebook.com/post/456",
            evidence_text="Human trafficking network detected",
            threat_type="Trafficking",
            message="Signalement SIG-2024-004 ready for decision",
            sent_by=users["analyst_sr"].email,
            status="sent",
        ),
        Notification(
            ts=now - timedelta(hours=12),
            channel="email",
            target=users["director"].email,
            level="HIGH",
            platform="Twitter",
            evidence_text="SLA warning: Signalement SIG-2024-003 approaching 24-hour deadline",
            threat_type="Trafficking",
            message="6-hour warning: Decision required for SIG-2024-003",
            sent_by="system",
            status="sent",
        ),
    ]

    for notif in notifications:
        db.add(notif)
    db.commit()
    return notifications
