"""Amorçage initial : comptes (un par rôle) + acteurs menaçants pré-chargés."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import ThreatActor, User
from .security import hash_password

SEED_USERS = [
    ("admin@sentinelle.cm", "Admin Système", "admin", "Direction SI", "admin123"),
    ("directeur@sentinelle.cm", "Le Directeur", "director", "Direction", "directeur123"),
    ("chef@sentinelle.cm", "Chef d'équipe", "chief", "Veille sociale", "chef123"),
    ("analyste.sr@sentinelle.cm", "Analyste K.D", "analyst_sr", "Veille sociale", "analyste123"),
    ("analyste.jr@sentinelle.cm", "Analyste junior", "analyst_jr", "Veille sociale", "junior123"),
    ("auditeur@sentinelle.cm", "Auditeur CEC", "auditor", "Comité d'Éthique", "audit123"),
]

SEED_ACTORS = [
    ("TA-0012", "Réseau Nord — recrutement", "Groupe armé non-étatique", "CRITICAL", "Telegram, Facebook", 23, 7, "2024-03-15", "2026-06-20"),
    ("TA-0027", "Cellule désinformation diaspora", "Réseau coordonné", "HIGH", "Facebook, X, LinkedIn", 41, 18, "2023-11-02", "2026-06-21"),
    ("TA-0033", "Faux comptes amplification", "Botnet local", "MEDIUM", "X, TikTok", 67, 120, "2025-01-20", "2026-06-19"),
    ("TA-0009", "Propagande NOSO", "Mouvement séparatiste", "HIGH", "YouTube, Telegram", 54, 31, "2022-08-11", "2026-06-18"),
]


def seed(db: Session) -> None:
    if not db.scalar(select(User).limit(1)):
        for email, name, role, dept, pwd in SEED_USERS:
            db.add(User(email=email, name=name, role=role, department=dept,
                        hashed_password=hash_password(pwd)))
        db.commit()
    if not db.scalar(select(ThreatActor).limit(1)):
        for code, name, typ, lvl, plats, inc, acc, first, last in SEED_ACTORS:
            db.add(ThreatActor(code=code, name=name, type=typ, level=lvl,
                               platforms=plats, incidents=inc, accounts=acc,
                               first_seen=first, last_seen=last))
        db.commit()
