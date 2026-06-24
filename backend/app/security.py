"""Hachage de mot de passe (PBKDF2), JWT et dépendances d'autorisation."""
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import User
from .rbac import has_perm

oauth2 = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

_ITER = 120_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITER)
    return f"pbkdf2_sha256${_ITER}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iters, salt_hex, hash_hex = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iters))
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


def create_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_TTL_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def get_current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> User:
    cred_err = HTTPException(status.HTTP_401_UNAUTHORIZED, "Non authentifié")
    if not token:
        raise cred_err
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        user_id = int(payload["sub"])
    except Exception:
        raise cred_err
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise cred_err
    return user


def require(perm: str):
    """Dépendance : exige une permission RBAC."""
    def _dep(user: User = Depends(get_current_user)) -> User:
        if not has_perm(user.role, perm):
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Permission requise : {perm}")
        return user
    return _dep
