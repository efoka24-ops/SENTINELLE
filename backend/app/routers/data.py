"""Lecture des données : contenus, alertes, carte, renseignement, signalements,
rapports, audit, et statistiques de synthèse."""
import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from fastapi import HTTPException, Query, Response

from ..audit import log
from .. import mailer
from ..pdf import render as render_pdf
from ..models import (
    Alert, AuditLog, CitizenReport, Content, Notification, Report, ThreatActor, User,
)
from ..nlp.classifier import CATEGORY_LABELS
from ..nlp.gazetteer import REGIONS
from ..config import settings
from ..db import get_db
from ..schemas import AlertOut, AlertPatch, CitizenIn, ContentOut, ManualAlertIn, NotifyIn, ReportGenIn
from ..security import get_current_user, require

router = APIRouter(tags=["data"])

LEVEL_BY_SCORE = [(0.85, "CRITICAL"), (0.75, "HIGH"), (0.6, "MEDIUM"), (0.45, "LOW")]


def _level(score: float) -> str:
    for thr, lvl in LEVEL_BY_SCORE:
        if score >= thr:
            return lvl
    return "INFO"


# ---------- Contenus ----------
@router.get("/contents", response_model=list[ContentOut])
def contents(platform: str | None = None, category: str | None = None,
             region: str | None = None, scan_id: int | None = None,
             q: str | None = None, limit: int = 80,
             db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    stmt = select(Content).order_by(Content.collected_at.desc())
    if platform:
        stmt = stmt.where(Content.platform == platform)
    if category:
        stmt = stmt.where(Content.threat_category == category)
    if region:
        stmt = stmt.where(Content.region == region)
    if scan_id:
        stmt = stmt.where(Content.scan_id == scan_id)
    if q:
        stmt = stmt.where(Content.text.ilike(f"%{q}%"))
    return db.scalars(stmt.limit(min(limit, 300))).all()


# ---------- Alertes ----------
@router.get("/alerts", response_model=list[AlertOut])
def alerts(level: str | None = None, status: str | None = None, limit: int = 100,
           db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    stmt = select(Alert).order_by(Alert.created_at.desc())
    if level:
        stmt = stmt.where(Alert.level == level)
    if status:
        stmt = stmt.where(Alert.status == status)
    return db.scalars(stmt.limit(min(limit, 300))).all()


@router.get("/alerts/summary")
def alerts_summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.execute(
        select(Alert.level, func.count()).where(Alert.status != "Clôturé").group_by(Alert.level)
    ).all()
    out = {lvl: 0 for lvl in ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]}
    for lvl, n in rows:
        out[lvl] = n
    return out


# ---------- Carte / heatmap ----------
@router.get("/map/heatmap")
def heatmap(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    out = []
    for region in REGIONS:
        rows = db.execute(
            select(Content.threat_category, Content.threat_score)
            .where(Content.region == region, Content.threat_category != "neutral")
        ).all()
        count = len(rows)
        score = max((r[1] for r in rows), default=0.0)
        cats: dict[str, int] = {}
        for cat, _s in rows:
            cats[cat] = cats.get(cat, 0) + 1
        dominant = max(cats, key=cats.get) if cats else None
        out.append({
            "region": region, "risk_score": round(score, 3),
            "threat_level": _level(score), "threat_count": count,
            "dominant_threat": dominant,
        })
    return out


# ---------- CIB (comportements coordonnés inauthentiques) ----------
@router.get("/intel/cib")
def cib(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from ..services.cib import detect_cib
    return detect_cib(db)


# ---------- Renseignement ----------
@router.get("/threat-actors")
def threat_actors(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.scalars(select(ThreatActor)).all()
    return [{
        "code": a.code, "name": a.name, "type": a.type, "level": a.level,
        "platforms": a.platforms, "incidents": a.incidents, "accounts": a.accounts,
        "first": a.first_seen, "last": a.last_seen,
    } for a in rows]


# ---------- Signalements citoyens ----------
@router.post("/public/citizen-reports", status_code=201)
def submit_report(body: CitizenIn, db: Session = Depends(get_db)):
    ref = f"SGN-2026-{random.randint(10000, 99999)}"
    rep = CitizenReport(reference=ref, threat_type=body.threat_type,
                        url=body.url or "", description=body.description or "",
                        region=body.region or "", status="Nouveau")
    db.add(rep)
    db.commit()
    return {"reference": ref, "status": "received"}


@router.get("/citizen-reports")
def citizen_reports(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.scalars(select(CitizenReport).order_by(CitizenReport.submitted_at.desc()).limit(100)).all()
    return [{
        "ref": r.reference, "type": r.threat_type, "region": r.region or "—",
        "status": r.status, "time": r.submitted_at,
    } for r in rows]


# ---------- Rapport quotidien (synthèse calculée) ----------
@router.get("/reports/daily")
def daily_report(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total = db.scalar(select(func.count()).select_from(Content)) or 0
    threats = db.scalar(select(func.count()).select_from(Content).where(Content.threat_category != "neutral")) or 0
    alerts_n = db.scalar(select(func.count()).select_from(Alert)) or 0
    top = db.scalars(select(Alert).order_by(Alert.score.desc()).limit(5)).all()
    return {
        "generated_at": datetime.now(timezone.utc),
        "figures": {"analyzed": total, "threats": threats, "alerts": alerts_n},
        "top_threats": [
            {"title": a.title[:80], "platform": a.platform, "place": a.place,
             "score": a.score, "level": a.level} for a in top
        ],
        "categories": {CATEGORY_LABELS.get(c, c): n for c, n in db.execute(
            select(Content.threat_category, func.count())
            .where(Content.threat_category != "neutral")
            .group_by(Content.threat_category)).all()},
    }


# ---------- Audit ----------
@router.get("/audit/logs")
def audit_logs(db: Session = Depends(get_db), _: User = Depends(require("audit:read"))):
    rows = db.scalars(select(AuditLog).order_by(AuditLog.ts.desc()).limit(200)).all()
    return [{"time": r.ts, "user": r.user, "role": r.role,
             "action": r.action, "target": r.target} for r in rows]


# ---------- Détail d'un contenu (dossier de preuve) ----------
@router.get("/contents/{content_id}", response_model=ContentOut)
def content_detail(content_id: int, db: Session = Depends(get_db),
                   _: User = Depends(get_current_user)):
    c = db.get(Content, content_id)
    if not c:
        raise HTTPException(404, "Contenu introuvable")
    return c


# ---------- Notification avec preuve à l'appui ----------
@router.post("/notify")
def notify(body: NotifyIn, db: Session = Depends(get_db),
           user: User = Depends(require("alerts:write"))):
    author = body.author
    if body.content_id:
        c = db.get(Content, body.content_id)
        if c:
            author = author or c.author
            body.platform = body.platform or c.platform
            body.post_url = body.post_url or c.source_url
            body.evidence_text = body.evidence_text or c.text
            body.threat_type = body.threat_type or c.threat_category
            body.evidence_time = body.evidence_time or c.collected_at.strftime("%d/%m/%Y %H:%M")

    label = CATEGORY_LABELS.get(body.threat_type, body.threat_type)
    message = (
        f"SENTINELLE — ALERTE {body.level}\n"
        f"Type : {label}\n"
        f"Réseau social : {body.platform}\n"
        f"Auteur / compte : {author}\n"
        f"Date/heure : {body.evidence_time}\n"
        f"Lien du post : {body.post_url or '(non disponible)'}\n"
        f"Discours (preuve) : « {body.evidence_text[:400]} »\n"
        f"Capture : pièce jointe générée par le moteur SENTINELLE."
    )
    status = "queued"
    detail = ""
    if body.channel == "email" and "@" in (body.target or "") and mailer.is_configured():
        ok, detail = mailer.send([body.target], f"[SENTINELLE] Alerte {body.level} — {label}", message)
        status = "sent" if ok else "error"

    n = Notification(
        channel=body.channel, target=body.target, level=body.level,
        platform=body.platform, author=author, post_url=body.post_url,
        evidence_text=body.evidence_text[:1000], evidence_time=body.evidence_time,
        threat_type=body.threat_type, message=message, sent_by=user.name, status=status,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    log(db, "NOTIFICATION_SENT", f"{body.channel} → {body.target or 'autorité'} · {author}", user)
    return {"id": n.id, "status": n.status, "channel": n.channel, "message": message,
            "email_active": mailer.is_configured(), "detail": detail}


@router.get("/notifications")
def notifications(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.scalars(select(Notification).order_by(Notification.ts.desc()).limit(100)).all()
    return [{
        "id": r.id, "ts": r.ts, "channel": r.channel, "target": r.target,
        "level": r.level, "platform": r.platform, "author": r.author,
        "threat_type": r.threat_type, "status": r.status,
    } for r in rows]


def _email_configured() -> bool:
    return bool(getattr(settings, "SMTP_HOST", ""))


# ---------- Génération de rapport (synthèse / PDF / planifiable) ----------
@router.post("/reports/generate")
def generate_report(body: ReportGenIn, db: Session = Depends(get_db),
                    user: User = Depends(require("reports:generate"))):
    total = db.scalar(select(func.count()).select_from(Content)) or 0
    threats = db.scalar(select(func.count()).select_from(Content).where(Content.threat_category != "neutral")) or 0
    alerts_n = db.scalar(select(func.count()).select_from(Alert)) or 0
    top = db.scalars(select(Alert).order_by(Alert.score.desc()).limit(8)).all()
    cats = db.execute(
        select(Content.threat_category, func.count())
        .where(Content.threat_category != "neutral")
        .group_by(Content.threat_category).order_by(func.count().desc())).all()

    when = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M")
    lines = [
        f"# {body.title}",
        f"_Type : {body.type} · Généré le {when} par {user.name}_",
        "", "## Chiffres clés",
        f"- Contenus analysés : **{total}**",
        f"- Menaces détectées : **{threats}**",
        f"- Alertes émises : **{alerts_n}**",
        "", "## Répartition par catégorie",
    ]
    lines += [f"- {CATEGORY_LABELS.get(c, c)} : {n}" for c, n in cats] or ["- (aucune)"]
    lines += ["", "## Top menaces"]
    lines += [
        f"{i+1}. [{a.level}] {a.score:.2f} — {a.threat_type} — {a.platform} — {a.place} — « {a.title[:80]} »"
        for i, a in enumerate(top)
    ] or ["(aucune alerte)"]
    if body.recipients:
        lines += ["", f"_Destinataires : {', '.join(body.recipients)}_"]
    if body.schedule:
        lines += [f"_Planification : {body.schedule}_"]
    body_md = "\n".join(lines)

    n_reports = db.scalar(select(func.count()).select_from(Report)) or 0
    number = f"RPT-2026-{n_reports + 90:04d}"

    emailed = False
    detail = ""
    if body.email and body.recipients and mailer.is_configured():
        pdf_bytes = render_pdf(body.title, body_md.split("\n"), subtitle=f"{body.type} · {number} · {when}")
        ok, detail = mailer.send(body.recipients, f"[SENTINELLE] {body.title}",
                                 "Rapport SENTINELLE en pièce jointe (PDF). Document confidentiel.",
                                 attachment=(f"{number}.pdf", pdf_bytes))
        emailed = ok

    rep = Report(number=number, type=body.type, title=body.title, body_md=body_md,
                 recipients=body.recipients, emailed=emailed,
                 schedule=body.schedule, created_by=user.name)
    db.add(rep)
    db.commit()
    log(db, "REPORT_GENERATED", number + (" · e-mail envoyé" if emailed else ""), user)
    return {
        "number": number, "title": body.title, "body_md": body_md,
        "emailed": emailed, "email_active": mailer.is_configured(),
        "scheduled": bool(body.schedule), "detail": detail,
    }


# ---------- PDF d'un rapport ----------
@router.get("/reports/{number}/pdf")
def report_pdf(number: str, db: Session = Depends(get_db),
               _: User = Depends(get_current_user)):
    rep = db.scalar(select(Report).where(Report.number == number))
    if not rep:
        raise HTTPException(404, "Rapport introuvable")
    data = render_pdf(rep.title, rep.body_md.split("\n"), subtitle=f"{rep.type} · {rep.number}")
    return Response(content=data, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{number}.pdf"'})


# ---------- Auteurs signalés (par catégorie) ----------
@router.get("/intel/flagged-authors")
def flagged_authors(category: str | None = None, db: Session = Depends(get_db),
                    _: User = Depends(get_current_user)):
    stmt = (select(Content.author, Content.platform, func.count(), func.max(Content.threat_score))
            .where(Content.threat_category != "neutral", Content.author != ""))
    if category:
        stmt = stmt.where(Content.threat_category == category)
    rows = db.execute(stmt.group_by(Content.author, Content.platform)
                      .order_by(func.max(Content.threat_score).desc()).limit(60)).all()
    return [{"author": a, "platform": p, "posts": n, "max_score": round(s, 3)}
            for a, p, n, s in rows]


# ---------- Dossier détaillé par utilisateur ----------
def _build_user_dossier(db: Session, author: str) -> dict:
    posts = db.scalars(
        select(Content).where(Content.author == author).order_by(Content.threat_score.desc())
    ).all()
    flagged = [p for p in posts if p.threat_category != "neutral"]
    cats: dict[str, int] = {}
    for p in flagged:
        cats[p.threat_category] = cats.get(p.threat_category, 0) + 1
    return {
        "author": author,
        "total_posts": len(posts),
        "flagged_posts": len(flagged),
        "platforms": sorted({p.platform for p in posts}),
        "max_score": round(max((p.threat_score for p in flagged), default=0.0), 3),
        "categories": {CATEGORY_LABELS.get(c, c): n for c, n in cats.items()},
        "evidence": [{
            "platform": p.platform, "category": CATEGORY_LABELS.get(p.threat_category, p.threat_category),
            "subcategory": p.threat_subcategory, "score": p.threat_score,
            "region": p.region, "time": p.collected_at.strftime("%d/%m/%Y %H:%M"),
            "url": p.source_url, "text": p.text[:300],
        } for p in flagged[:50]],
    }


@router.get("/intel/user-dossier")
def user_dossier(author: str = Query(...), db: Session = Depends(get_db),
                 _: User = Depends(get_current_user)):
    return _build_user_dossier(db, author)


@router.get("/intel/user-dossier/pdf")
def user_dossier_pdf(author: str = Query(...), db: Session = Depends(get_db),
                     user: User = Depends(get_current_user)):
    d = _build_user_dossier(db, author)
    lines = [
        f"# Dossier utilisateur — {author}",
        f"Plateformes : {', '.join(d['platforms'])}",
        f"Posts analysés : {d['total_posts']} · signalés : {d['flagged_posts']} · score max : {d['max_score']}",
        "", "## Répartition par catégorie",
    ]
    lines += [f"- {c} : {n}" for c, n in d["categories"].items()] or ["- (aucune)"]
    lines += ["", "## Preuves (posts signalés)"]
    for i, e in enumerate(d["evidence"], 1):
        lines += [
            f"{i}. [{e['category']}] score {e['score']:.2f} — {e['platform']} — {e['time']} — {e['region']}",
            f"   Lien : {e['url'] or '(capturé par le moteur)'}",
            f"   Discours : « {e['text']} »",
        ]
    log(db, "USER_DOSSIER_GENERATED", author, user)
    data = render_pdf(f"Dossier — {author}", lines, subtitle="Document confidentiel · usage autorités")
    return Response(content=data, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="dossier-{author[:30]}.pdf"'})


# ---------- Gestion des alertes (depuis la plateforme) ----------
@router.patch("/alerts/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: int, body: AlertPatch, db: Session = Depends(get_db),
                 user: User = Depends(require("alerts:ack"))):
    a = db.get(Alert, alert_id)
    if not a:
        raise HTTPException(404, "Alerte introuvable")
    if body.status:
        a.status = body.status
    if body.assigned is not None:
        a.assigned = body.assigned
    db.commit()
    db.refresh(a)
    log(db, "ALERT_UPDATED", f"#{a.number} → {a.status}", user)
    return a


@router.post("/alerts", response_model=AlertOut, status_code=201)
def create_alert(body: ManualAlertIn, db: Session = Depends(get_db),
                 user: User = Depends(require("alerts:write"))):
    from datetime import datetime as _dt
    n = db.scalar(select(func.count()).select_from(Alert)) or 0
    a = Alert(number=f"{_dt.utcnow():%Y-%m-%d}-{n + 1:04d}", level=body.level,
              threat_type=body.threat_type, title=body.title, platform=body.platform,
              region=body.region, place=body.place or body.region, score=body.score,
              status="Ouvert", assigned=user.name)
    db.add(a)
    db.commit()
    db.refresh(a)
    log(db, "ALERT_MANUAL_CREATED", f"#{a.number}", user)
    return a


# ---------- Test SMTP ----------
@router.get("/system/smtp-test")
def smtp_test(_: User = Depends(require("users:manage"))):
    ok, detail = mailer.test_connection()
    return {"configured": mailer.is_configured(), "ok": ok, "detail": detail,
            "host": settings.SMTP_HOST, "from": settings.SMTP_FROM}


@router.get("/reports")
def list_reports(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.scalars(select(Report).order_by(Report.created_at.desc()).limit(50)).all()
    return [{"number": r.number, "type": r.type, "title": r.title,
             "recipients": r.recipients, "emailed": r.emailed,
             "schedule": r.schedule, "at": r.created_at} for r in rows]


# ---------- Synthèse dashboard ----------
@router.get("/stats/overview")
def overview(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total = db.scalar(select(func.count()).select_from(Content)) or 0
    threats = db.scalar(select(func.count()).select_from(Content).where(Content.threat_category != "neutral")) or 0
    alerts_n = db.scalar(select(func.count()).select_from(Alert)) or 0
    by_platform = [{"platform": p, "count": n} for p, n in db.execute(
        select(Content.platform, func.count()).group_by(Content.platform)
        .order_by(func.count().desc())).all()]
    by_category = [{"category": CATEGORY_LABELS.get(c, c), "key": c, "count": n} for c, n in db.execute(
        select(Content.threat_category, func.count())
        .where(Content.threat_category != "neutral")
        .group_by(Content.threat_category).order_by(func.count().desc())).all()]
    return {"analyzed": total, "threats": threats, "alerts": alerts_n,
            "by_platform": by_platform, "by_category": by_category}
