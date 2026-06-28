"""Service de notifications pour les signalements.

Gère les notifications liées à l'escalade, aux SLA à risque, aux décisions nécessaires
et aux transmissions auprès des autorités.
"""
from datetime import datetime, timezone, timedelta
from pathlib import Path
from sqlalchemy.orm import Session

from .. import mailer
from ..models import Notification, Signalement, User


TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


def notify_escalation(db: Session, signalement: Signalement, escalated_to_user: User, analyst_name: str = "Analyste") -> None:
    """Notifie que un signalement a été escaladé.

    Args:
        db: Session SQLAlchemy
        signalement: Le signalement escaladé
        escalated_to_user: L'utilisateur qui reçoit l'escalade (supervisor/director)
        analyst_name: Nom de l'analyste qui a escaladé
    """
    subject = f"[SENTINELLE] Escalade signalement #{signalement.reference}"
    message = (
        f"Signalement {signalement.reference} escaladé pour décision. "
        f"Catégorie : {signalement.category}, Gravité : {signalement.gravity}."
    )

    # Try to load and populate template
    email_body = _load_template_escalation(signalement, escalated_to_user.role, analyst_name)

    # Create notification record
    n = Notification(
        channel="email" if "@" in escalated_to_user.email else "internal",
        target=escalated_to_user.email,
        level=_gravity_to_level(signalement.gravity),
        notification_type="ESCALATION",
        message=message,
        sent_by="Système",
        status="created",
        signalement_ref=signalement.reference,
    )
    db.add(n)
    db.commit()

    # Send email if SMTP configured and target is email
    if n.channel == "email" and mailer.is_configured():
        ok, detail = mailer.send([escalated_to_user.email], subject, email_body)
        n.status = "sent" if ok else "error"
        db.commit()


def notify_sla_at_risk(db: Session, signalement: Signalement) -> None:
    """Notifie que un signalement approche de sa limite SLA (< 6h restantes).

    Args:
        db: Session SQLAlchemy
        signalement: Le signalement concerné
    """
    time_remaining = _sla_remaining_hours(signalement)
    subject = f"[SENTINELLE] Alerte SLA signalement #{signalement.reference}"
    message = (
        f"Signalement {signalement.reference} en risque SLA. "
        f"Moins de {time_remaining} heures avant dépassement du délai."
    )

    # Load template
    email_body = _load_template_sla_warning(signalement, time_remaining)

    # Notifier l'analyste assigné si présent
    if signalement.assigned_to:
        assigned_user = db.get(User, signalement.assigned_to)
        if assigned_user:
            n = Notification(
                channel="email" if "@" in assigned_user.email else "internal",
                target=assigned_user.email,
                level="HIGH",
                notification_type="SLA_WARNING",
                message=message,
                sent_by="Système",
                status="created",
                signalement_ref=signalement.reference,
            )
            db.add(n)
            db.commit()

            if n.channel == "email" and mailer.is_configured():
                ok, detail = mailer.send([assigned_user.email], subject, email_body)
                n.status = "sent" if ok else "error"
                db.commit()

    # Also notify chief/director
    chiefs = db.query(User).filter(User.role.in_(["chief", "director"]), User.is_active == True).all()
    for chief in chiefs:
        n = Notification(
            channel="email" if "@" in chief.email else "internal",
            target=chief.email,
            level="HIGH",
            notification_type="SLA_WARNING",
            message=message,
            sent_by="Système",
            status="created",
            signalement_ref=signalement.reference,
        )
        db.add(n)
        db.commit()

        if n.channel == "email" and mailer.is_configured():
            ok, detail = mailer.send([chief.email], subject, email_body)
            n.status = "sent" if ok else "error"
            db.commit()


def notify_decision_needed(db: Session, signalement: Signalement, chief_user: User) -> None:
    """Notifie qu'une décision est requise pour un signalement.

    Args:
        db: Session SQLAlchemy
        signalement: Le signalement escaladé en attente de décision
        chief_user: Le chef/directeur qui doit décider
    """
    subject = f"[SENTINELLE] Décision requise signalement #{signalement.reference}"
    message = (
        f"Signalement {signalement.reference} en attente de décision. "
        f"Catégorie : {signalement.category}, Gravité : {signalement.gravity}. "
        f"Notes : {signalement.notes[:100] if signalement.notes else '(aucune)'}."
    )

    email_body = message  # Simple text body for decision notification

    n = Notification(
        channel="email" if "@" in chief_user.email else "internal",
        target=chief_user.email,
        level=_gravity_to_level(signalement.gravity),
        notification_type="DECISION_NEEDED",
        message=message,
        sent_by="Système",
        status="created",
        signalement_ref=signalement.reference,
    )
    db.add(n)
    db.commit()

    if n.channel == "email" and mailer.is_configured():
        ok, detail = mailer.send([chief_user.email], subject, email_body)
        n.status = "sent" if ok else "error"
        db.commit()


def notify_transmitted(db: Session, signalement: Signalement, authority: str, decision_reason: str = "") -> None:
    """Notifie que un signalement a été transmis à une autorité.

    Args:
        db: Session SQLAlchemy
        signalement: Le signalement transmis
        authority: L'autorité destinataire (ANTIC, Armée, Parquet, etc.)
        decision_reason: Raison de la transmission
    """
    subject = f"[SENTINELLE] Transmission signalement #{signalement.reference}"
    message = (
        f"Signalement {signalement.reference} transmis à {authority}. "
        f"Catégorie : {signalement.category}, Décision : {signalement.decision}."
    )

    # Load template
    email_body = _load_template_transmission(signalement, authority, decision_reason)

    # Notifier l'analyste original
    if signalement.assigned_to:
        assigned_user = db.get(User, signalement.assigned_to)
        if assigned_user:
            n = Notification(
                channel="email" if "@" in assigned_user.email else "internal",
                target=assigned_user.email,
                level="INFO",
                notification_type="TRANSMISSION",
                message=message,
                sent_by="Système",
                status="created",
                signalement_ref=signalement.reference,
            )
            db.add(n)
            db.commit()

            if n.channel == "email" and mailer.is_configured():
                ok, detail = mailer.send([assigned_user.email], subject, email_body)
                n.status = "sent" if ok else "error"
                db.commit()

    # Notifier tous les chefs/directeurs
    chiefs = db.query(User).filter(User.role.in_(["chief", "director"]), User.is_active == True).all()
    for chief in chiefs:
        n = Notification(
            channel="email" if "@" in chief.email else "internal",
            target=chief.email,
            level="INFO",
            notification_type="TRANSMISSION",
            message=message,
            sent_by="Système",
            status="created",
            signalement_ref=signalement.reference,
        )
        db.add(n)
        db.commit()

        if n.channel == "email" and mailer.is_configured():
            ok, detail = mailer.send([chief.email], subject, email_body)
            n.status = "sent" if ok else "error"
            db.commit()


def _gravity_to_level(gravity: str) -> str:
    """Convertit la gravité du signalement en level de notification."""
    mapping = {
        "Critique": "CRITICAL",
        "Grave": "HIGH",
        "Modéré": "MEDIUM",
        "Faible": "LOW",
    }
    return mapping.get(gravity, "MEDIUM")


def _sla_remaining_hours(signalement: Signalement) -> int:
    """Retourne le nombre d'heures restantes avant dépassement du SLA (24h)."""
    created_diff = datetime.now(timezone.utc) - signalement.created_at
    hours_elapsed = created_diff.total_seconds() / 3600
    return max(0, int(24 - hours_elapsed))


def _load_template_escalation(signalement: Signalement, escalated_role: str, analyst_name: str) -> str:
    """Charge et remplit le template d'escalade."""
    template_path = TEMPLATES_DIR / "escalation.txt"
    if not template_path.exists():
        # Fallback text
        return (
            f"Signalement {signalement.reference} a été escaladé à {escalated_role} par {analyst_name}.\n"
            f"Catégorie : {signalement.category}\n"
            f"Gravité : {signalement.gravity}\n"
            f"Notes : {signalement.notes}\n"
        )

    template = template_path.read_text(encoding="utf-8")
    sla_deadline = (signalement.created_at + timedelta(hours=24)).strftime("%d/%m/%Y %H:%M")
    created_at = signalement.created_at.strftime("%d/%m/%Y %H:%M")

    return template.format(
        reference=signalement.reference,
        escalated_role=escalated_role,
        analyst_name=analyst_name,
        timestamp=datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M"),
        category=signalement.category,
        gravity=signalement.gravity,
        reason=signalement.notes[:200] or "(Raison non spécifiée)",
        created_at=created_at,
        sla_remaining=_sla_remaining_hours(signalement),
        sla_deadline=sla_deadline,
        notes=signalement.notes or "(Aucune note)",
    )


def _load_template_sla_warning(signalement: Signalement, time_remaining: int) -> str:
    """Charge et remplit le template d'alerte SLA."""
    template_path = TEMPLATES_DIR / "sla_warning.txt"
    if not template_path.exists():
        return (
            f"Signalement {signalement.reference} en alerte SLA.\n"
            f"Temps restant : {time_remaining}h\n"
            f"Catégorie : {signalement.category}\n"
            f"Gravité : {signalement.gravity}\n"
        )

    template = template_path.read_text(encoding="utf-8")
    sla_deadline = (signalement.created_at + timedelta(hours=24)).strftime("%d/%m/%Y %H:%M")

    return template.format(
        reference=signalement.reference,
        time_remaining=f"{time_remaining}h {int((time_remaining % 1) * 60)}min",
        sla_deadline=sla_deadline,
        category=signalement.category,
        gravity=signalement.gravity,
        status=signalement.status,
        assigned_to="(Non assigné)" if not signalement.assigned_to else "(Assigné)",
    )


def _load_template_transmission(signalement: Signalement, authority: str, decision_reason: str) -> str:
    """Charge et remplit le template de transmission."""
    template_path = TEMPLATES_DIR / "transmission_confirm.txt"
    if not template_path.exists():
        return (
            f"Signalement {signalement.reference} transmis à {authority}.\n"
            f"Catégorie : {signalement.category}\n"
            f"Gravité : {signalement.gravity}\n"
            f"Décision : {signalement.decision}\n"
            f"Raison : {decision_reason}\n"
        )

    template = template_path.read_text(encoding="utf-8")

    return template.format(
        reference=signalement.reference,
        authority=authority,
        timestamp=datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M"),
        category=signalement.category,
        gravity=signalement.gravity,
        decision=signalement.decision or "(Non spécifiée)",
        decision_reason=decision_reason or signalement.decision_reason or "(Aucune raison)",
    )
