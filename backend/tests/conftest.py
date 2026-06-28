"""Pytest configuration and shared fixtures for SENTINELLE tests."""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from fastapi.testclient import TestClient

# Set test environment
os.environ["SENTINELLE_DB_URL"] = "sqlite:///:memory:"
os.environ["SENTINELLE_AUTH_DEV_MODE"] = "true"

from app.db import Base
from app.main import app
from app.models import User
from tests.fixtures import (
    create_test_users,
    create_test_citizen_reports,
    create_test_alerts,
    create_test_signalements,
    create_test_login_codes,
    create_audit_logs,
    create_notifications,
)


@pytest.fixture(scope="session")
def db_engine():
    """Create in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        future=True,
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture(scope="function")
def db(db_engine):
    """Provide a fresh database session for each test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection, autoflush=False, autocommit=False)(
        bind=connection
    )

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    """Provide a FastAPI test client with test database."""
    def override_get_db():
        yield db

    from app.db import get_db
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def users(db: Session) -> dict[str, User]:
    """Create test users with different roles."""
    return create_test_users(db)


@pytest.fixture(scope="function")
def citizen_reports(db: Session):
    """Create test citizen reports."""
    return create_test_citizen_reports(db)


@pytest.fixture(scope="function")
def alerts(db: Session):
    """Create test alerts."""
    return create_test_alerts(db)


@pytest.fixture(scope="function")
def signalements(db: Session, users: dict, citizen_reports, alerts):
    """Create test signalements at different stages."""
    return create_test_signalements(db, users, citizen_reports, alerts)


@pytest.fixture(scope="function")
def login_codes(db: Session, users: dict) -> dict[str, str]:
    """Create test login codes for OTP testing."""
    return create_test_login_codes(db, users)


@pytest.fixture(scope="function")
def audit_logs(db: Session, users: dict):
    """Create sample audit logs."""
    return create_audit_logs(db, users)


@pytest.fixture(scope="function")
def notifications(db: Session, users: dict):
    """Create sample notifications."""
    return create_notifications(db, users)


@pytest.fixture(scope="function")
def auth_tokens(client: TestClient, users: dict, login_codes: dict) -> dict[str, str]:
    """Generate JWT tokens for each test user role."""
    from app.security import create_token

    tokens = {}
    for role, user in users.items():
        token = create_token(user)
        tokens[role] = token

    return tokens


@pytest.fixture(scope="function")
def headers_for_role(auth_tokens: dict) -> callable:
    """Return a function to get authorization headers for a specific role."""
    def _get_headers(role: str) -> dict:
        return {"Authorization": f"Bearer {auth_tokens[role]}"}

    return _get_headers
