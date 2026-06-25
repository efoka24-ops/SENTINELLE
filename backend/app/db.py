"""Couche base de données (SQLAlchemy 2.0, SQLite par défaut)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

_is_sqlite = settings.DB_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if _is_sqlite else {}
# pool_pre_ping : évite les connexions Postgres mortes (Railway peut couper les idle).
engine = create_engine(
    settings.DB_URL,
    connect_args=connect_args,
    pool_pre_ping=not _is_sqlite,
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from . import models  # noqa: F401  (enregistre les tables)

    Base.metadata.create_all(bind=engine)
