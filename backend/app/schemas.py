"""Schémas Pydantic (entrées/sorties API)."""
from datetime import datetime
from pydantic import BaseModel


class LoginIn(BaseModel):
    email: str
    password: str
    otp: str | None = None  # 2FA (démo : accepté tel quel)


class RequestCodeIn(BaseModel):
    email: str


class VerifyCodeIn(BaseModel):
    email: str
    code: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    department: str
    is_active: bool

    class Config:
        from_attributes = True


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    permissions: list[str]


class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str = "analyst_jr"
    department: str = ""


class UserUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    department: str | None = None
    password: str | None = None


class ScanIn(BaseModel):
    platforms: list[str]
    region: str = "National"
    keywords: list[str] = []
    targets: list[str] = []  # cibles publiques (URLs/comptes) pour collecte réelle Apify
    objective: str = ""  # "" | child_safety | trafficking | ...
    limit: int = 40


class AlertPatch(BaseModel):
    status: str | None = None
    assigned: str | None = None


class ManualAlertIn(BaseModel):
    level: str = "HIGH"
    threat_type: str = ""
    title: str
    platform: str = ""
    region: str = "National"
    place: str = ""
    score: float = 0.7


class NotifyIn(BaseModel):
    content_id: int | None = None
    channel: str = "email"
    target: str = ""
    level: str = "HIGH"
    platform: str = ""
    author: str = ""
    post_url: str = ""
    evidence_text: str = ""
    evidence_time: str = ""
    threat_type: str = ""


class ReportGenIn(BaseModel):
    title: str = "Synthèse SENTINELLE"
    type: str = "Synthèse"
    recipients: list[str] = []
    email: bool = False
    schedule: str = ""  # cron éventuel (ex: "0 6 * * *")


class ScanOut(BaseModel):
    id: int
    status: str
    platforms: list[str]
    region: str
    requested_by: str
    collected: int
    threats: int
    alerts: int
    error: str
    started_at: datetime
    finished_at: datetime | None

    class Config:
        from_attributes = True


class ContentOut(BaseModel):
    id: int
    platform: str
    author: str
    text: str
    lang: str
    region: str
    city: str
    threat_category: str
    threat_subcategory: str
    threat_score: float
    sentiment: str
    source_url: str
    collected_at: datetime

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    number: str
    level: str
    threat_type: str
    title: str
    platform: str
    region: str
    place: str
    score: float
    status: str
    assigned: str
    created_at: datetime

    class Config:
        from_attributes = True


class CitizenIn(BaseModel):
    threat_type: str
    url: str | None = ""
    description: str | None = ""
    region: str | None = ""


class SignalementOut(BaseModel):
    id: int
    reference: str
    status: str
    citizen_report_id: int | None
    alert_id: int | None
    assigned_to: int | None
    escalated_to: int | None
    category: str
    gravity: str
    decision: str | None
    decision_reason: str
    transmitted_to: str | None
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SignalementEscalateIn(BaseModel):
    reason: str


class SignalementDecideIn(BaseModel):
    decision: str  # Validé|Rejeté|Escalade
    decision_reason: str
    transmitted_to: str | None = None


class SignalementReassignIn(BaseModel):
    assigned_to_id: int
