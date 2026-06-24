"""Authentification, profil et gestion des utilisateurs (RBAC).

Connexion par CODE À USAGE UNIQUE envoyé par e-mail :
  1. POST /auth/request-code {email}  → la plateforme identifie le compte et
     envoie un code (PROD) ou le renvoie directement (DEV).
  2. POST /auth/verify-code {email, code} → délivre le jeton JWT.

La connexion par mot de passe (/auth/login) est conservée comme repli de
DÉVELOPPEMENT uniquement.
"""
import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..audit import log
from .. import mailer
from ..config import settings
from ..db import get_db
from ..models import LoginCode, User
from ..rbac import ROLE_LABELS, perms_for
from ..schemas import LoginIn, LoginOut, RequestCodeIn, UserCreate, UserOut, VerifyCodeIn
from ..security import create_token, get_current_user, hash_password, require, verify_password

router = APIRouter(tags=["auth"])


@router.post("/auth/request-code")
def request_code(body: RequestCodeIn, db: Session = Depends(get_db)):
    """Génère un code de connexion et l'envoie par e-mail (ou le renvoie en DEV)."""
    email = body.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not user.is_active:
        # En production : réponse générique (anti-énumération de comptes).
        if settings.AUTH_DEV_MODE:
            raise HTTPException(404, "Aucun compte actif pour cet e-mail")
        return {"sent": True, "dev_mode": False}

    code = f"{secrets.randbelow(1_000_000):06d}"
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    for old in db.scalars(select(LoginCode).where(LoginCode.email == email, LoginCode.used == False)).all():  # noqa: E712
        old.used = True
    db.add(LoginCode(email=email, code_hash=code_hash,
                     expires_at=datetime.utcnow() + timedelta(minutes=settings.LOGIN_CODE_TTL_MIN)))
    db.commit()
    log(db, "AUTH_CODE_REQUESTED", email, user)

    if settings.AUTH_DEV_MODE:
        # --- DÉVELOPPEMENT : envoi e-mail désactivé, code renvoyé pour les tests ---
        return {"sent": False, "dev_mode": True, "dev_code": code, "name": user.name}

    # --- PRODUCTION : envoi réel du code par e-mail ---
    body_txt = (
        f"Bonjour {user.name},\n\n"
        f"Votre code de connexion SENTINELLE (usage unique) : {code}\n"
        f"Valable {settings.LOGIN_CODE_TTL_MIN} minutes. Ne le communiquez à personne.\n\n"
        f"SENTINELLE — CNVNAM"
    )
    ok, detail = mailer.send([email], "Votre code de connexion SENTINELLE", body_txt)
    return {"sent": ok, "dev_mode": False, "detail": detail}


@router.post("/auth/verify-code", response_model=LoginOut)
def verify_code(body: VerifyCodeIn, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    code_hash = hashlib.sha256(body.code.strip().encode()).hexdigest()
    lc = db.scalar(
        select(LoginCode)
        .where(LoginCode.email == email, LoginCode.used == False, LoginCode.code_hash == code_hash)  # noqa: E712
        .order_by(LoginCode.created_at.desc())
    )
    if not lc or lc.expires_at < datetime.utcnow():
        log(db, "AUTH_CODE_FAILURE", email)
        raise HTTPException(401, "Code invalide ou expiré")
    user = db.scalar(select(User).where(User.email == email))
    if not user or not user.is_active:
        raise HTTPException(403, "Compte indisponible")
    lc.used = True
    db.commit()
    token = create_token(user)
    log(db, "AUTH_LOGIN_SUCCESS", f"{email} (code)", user)
    return LoginOut(access_token=token, user=UserOut.model_validate(user),
                    permissions=perms_for(user.role))


# --- Repli DÉVELOPPEMENT : connexion par mot de passe (désactiver en production) ---
@router.post("/auth/login", response_model=LoginOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower().strip()))
    if not user or not verify_password(body.password, user.hashed_password):
        log(db, "AUTH_LOGIN_FAILURE", body.email)
        raise HTTPException(401, "Identifiants incorrects")
    if not user.is_active:
        raise HTTPException(403, "Compte désactivé")
    token = create_token(user)
    log(db, "AUTH_LOGIN_SUCCESS", user.email, user)
    return LoginOut(access_token=token, user=UserOut.model_validate(user),
                    permissions=perms_for(user.role))


@router.get("/auth/me", response_model=LoginOut)
def me(user: User = Depends(get_current_user)):
    return LoginOut(access_token="", user=UserOut.model_validate(user),
                    permissions=perms_for(user.role))


@router.get("/meta/roles")
def roles():
    return [{"key": k, "label": v} for k, v in ROLE_LABELS.items()]


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require("users:manage"))):
    return db.scalars(select(User).order_by(User.created_at.desc())).all()


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db),
                actor: User = Depends(require("users:manage"))):
    if body.role not in ROLE_LABELS:
        raise HTTPException(400, "Rôle inconnu")
    if db.scalar(select(User).where(User.email == body.email.lower().strip())):
        raise HTTPException(409, "Email déjà utilisé")
    user = User(email=body.email.lower().strip(), name=body.name, role=body.role,
                department=body.department, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    log(db, "USER_CREATED", f"{user.email} ({user.role})", actor)
    return user


@router.patch("/users/{user_id}/status", response_model=UserOut)
def set_status(user_id: int, active: bool, db: Session = Depends(get_db),
               actor: User = Depends(require("users:manage"))):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    user.is_active = active
    db.commit()
    db.refresh(user)
    log(db, "USER_DEACTIVATED" if not active else "USER_REACTIVATED", user.email, actor)
    return user
