"""Helper de journalisation d'audit (journal immuable append-only)."""
from sqlalchemy.orm import Session

from .models import AuditLog, User


def log(db: Session, action: str, target: str = "", user: User | None = None) -> None:
    entry = AuditLog(
        user=user.name if user else "Système",
        role=user.role if user else "",
        action=action,
        target=target,
    )
    db.add(entry)
    db.commit()
