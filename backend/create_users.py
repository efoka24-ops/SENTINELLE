#!/usr/bin/env python3
"""Script pour créer les comptes utilisateurs en production."""

import os
import sys
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.models import User
from app.security import hash_password

# Configuration de la base de données
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/sentinelle"
)

USERS_TO_CREATE = [
    {
        "email": "admin@sentinelle.cm",
        "name": "Admin Système",
        "role": "admin",
        "department": "Direction SI",
        "password": "admin123"
    },
    {
        "email": "directeur@sentinelle.cm",
        "name": "Le Directeur",
        "role": "director",
        "department": "Direction",
        "password": "directeur123"
    },
    {
        "email": "chef@sentinelle.cm",
        "name": "Chef d'équipe",
        "role": "chief",
        "department": "Veille numérique",
        "password": "chef123"
    },
    {
        "email": "analyste.sr@sentinelle.cm",
        "name": "Analyste Senior (K.D)",
        "role": "analyst_sr",
        "department": "Veille numérique",
        "password": "analyste123"
    },
    {
        "email": "analyste.jr@sentinelle.cm",
        "name": "Analyste Junior",
        "role": "analyst_jr",
        "department": "Veille numérique",
        "password": "junior123"
    },
    {
        "email": "auditeur@sentinelle.cm",
        "name": "Auditeur CEC",
        "role": "auditor",
        "department": "Comité d'Éthique",
        "password": "audit123"
    },
]


def create_users():
    """Crée les comptes utilisateurs en base de données."""
    engine = create_engine(DATABASE_URL)

    with Session(engine) as db:
        created_count = 0
        skipped_count = 0

        for user_data in USERS_TO_CREATE:
            # Vérifier si l'utilisateur existe déjà
            existing = db.scalar(
                select(User).where(User.email == user_data["email"])
            )

            if existing:
                print(f"⏭️  {user_data['email']} existe déjà")
                skipped_count += 1
                continue

            # Créer le nouvel utilisateur
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                role=user_data["role"],
                department=user_data["department"],
                hashed_password=hash_password(user_data["password"]),
                is_active=True
            )
            db.add(user)
            print(f"✅ {user_data['email']} ({user_data['role']}) créé")
            created_count += 1

        # Valider les changements
        if created_count > 0:
            db.commit()
            print(f"\n✓ {created_count} utilisateur(s) créé(s)")

        if skipped_count > 0:
            print(f"⏭️  {skipped_count} utilisateur(s) déjà existant(s)")

        if created_count == 0 and skipped_count == 0:
            print("❌ Aucun utilisateur à créer")
            return 1

        return 0


if __name__ == "__main__":
    try:
        exit_code = create_users()
        sys.exit(exit_code)
    except Exception as e:
        print(f"❌ Erreur: {e}")
        sys.exit(1)
