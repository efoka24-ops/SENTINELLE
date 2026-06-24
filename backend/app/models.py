"""Modèles ORM SENTINELLE."""
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="analyst_jr")
    department: Mapped[str] = mapped_column(String(80), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class ScanJob(Base):
    __tablename__ = "scan_jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|running|done|error
    platforms: Mapped[list] = mapped_column(JSON, default=list)
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    region: Mapped[str] = mapped_column(String(60), default="National")
    requested_by: Mapped[str] = mapped_column(String(120), default="")
    collected: Mapped[int] = mapped_column(Integer, default=0)
    threats: Mapped[int] = mapped_column(Integer, default=0)
    alerts: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str] = mapped_column(Text, default="")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Content(Base):
    __tablename__ = "contents"
    id: Mapped[int] = mapped_column(primary_key=True)
    scan_id: Mapped[int | None] = mapped_column(ForeignKey("scan_jobs.id"), nullable=True)
    platform: Mapped[str] = mapped_column(String(30), index=True)
    source_id: Mapped[str] = mapped_column(String(500), default="")
    source_url: Mapped[str] = mapped_column(Text, default="")
    author: Mapped[str] = mapped_column(String(255), default="")
    text: Mapped[str] = mapped_column(Text, default="")
    lang: Mapped[str] = mapped_column(String(10), default="fr")
    region: Mapped[str] = mapped_column(String(60), default="Unknown", index=True)
    city: Mapped[str] = mapped_column(String(80), default="")
    threat_category: Mapped[str] = mapped_column(String(40), default="neutral", index=True)
    threat_subcategory: Mapped[str] = mapped_column(String(60), default="")
    threat_score: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment: Mapped[str] = mapped_column(String(20), default="neutral")
    status: Mapped[str] = mapped_column(String(20), default="analyzed")
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(40), index=True)
    level: Mapped[str] = mapped_column(String(10), default="LOW")
    threat_type: Mapped[str] = mapped_column(String(40), default="")
    title: Mapped[str] = mapped_column(String(500), default="")
    content_id: Mapped[int | None] = mapped_column(ForeignKey("contents.id"), nullable=True)
    platform: Mapped[str] = mapped_column(String(30), default="")
    region: Mapped[str] = mapped_column(String(60), default="Unknown")
    place: Mapped[str] = mapped_column(String(120), default="")
    score: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="Ouvert")
    assigned: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class ThreatActor(Base):
    __tablename__ = "threat_actors"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(80), default="")
    level: Mapped[str] = mapped_column(String(10), default="MEDIUM")
    platforms: Mapped[str] = mapped_column(String(255), default="")
    incidents: Mapped[int] = mapped_column(Integer, default=0)
    accounts: Mapped[int] = mapped_column(Integer, default=0)
    first_seen: Mapped[str] = mapped_column(String(20), default="")
    last_seen: Mapped[str] = mapped_column(String(20), default="")


class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    threat_type: Mapped[str] = mapped_column(String(40), default="")
    url: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    region: Mapped[str] = mapped_column(String(60), default="")
    status: Mapped[str] = mapped_column(String(20), default="Nouveau")
    ai_prescore: Mapped[float] = mapped_column(Float, default=0.0)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime, default=now)
    channel: Mapped[str] = mapped_column(String(20), default="email")  # email|sms|whatsapp
    target: Mapped[str] = mapped_column(String(200), default="")
    level: Mapped[str] = mapped_column(String(10), default="HIGH")
    platform: Mapped[str] = mapped_column(String(30), default="")
    author: Mapped[str] = mapped_column(String(255), default="")
    post_url: Mapped[str] = mapped_column(Text, default="")
    evidence_text: Mapped[str] = mapped_column(Text, default="")
    evidence_time: Mapped[str] = mapped_column(String(40), default="")
    threat_type: Mapped[str] = mapped_column(String(40), default="")
    message: Mapped[str] = mapped_column(Text, default="")
    sent_by: Mapped[str] = mapped_column(String(120), default="")
    status: Mapped[str] = mapped_column(String(20), default="sent")


class Report(Base):
    __tablename__ = "reports"
    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(40), index=True)
    type: Mapped[str] = mapped_column(String(20), default="Synthèse")
    title: Mapped[str] = mapped_column(String(300), default="")
    body_md: Mapped[str] = mapped_column(Text, default="")
    recipients: Mapped[list] = mapped_column(JSON, default=list)
    emailed: Mapped[bool] = mapped_column(Boolean, default=False)
    schedule: Mapped[str] = mapped_column(String(40), default="")  # cron éventuel
    created_by: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class LoginCode(Base):
    __tablename__ = "login_codes"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    code_hash: Mapped[str] = mapped_column(String(80))
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime, default=now)
    user: Mapped[str] = mapped_column(String(120), default="Système")
    role: Mapped[str] = mapped_column(String(30), default="")
    action: Mapped[str] = mapped_column(String(80), default="")
    target: Mapped[str] = mapped_column(String(255), default="")
