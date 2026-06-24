"""Lancement et suivi des scans de réseaux sociaux."""
import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..audit import log
from ..collectors.registry import REGISTRY, available_platforms
from ..db import get_db
from ..models import ScanJob, User
from ..schemas import ScanIn, ScanOut
from ..security import get_current_user, require
from ..services.scan import run_scan

router = APIRouter(tags=["scans"])

# Présets d'objectif : injectent des mots-clés ciblés dans le scan.
OBJECTIVE_PRESETS = {
    "child_safety": ["mineure dispo", "collégienne", "tu as quel âge", "photo privée",
                     "garde le secret", "🔞", "petite jeune"],
    "trafficking": ["escort", "tarif nuit", "service complet", "rdv discret",
                    "placement filles", "gain facile", "🔞", "💋"],
    "terrorism": ["jihad", "recrutement", "combattants", "attentat"],
    "hate_speech": ["à mort", "éliminer", "sale tribu", "vermine"],
}


@router.get("/scans/platforms")
def platforms(_: User = Depends(get_current_user)):
    """Sources de collecte disponibles + état (live/démo selon clés API)."""
    return available_platforms()


@router.post("/scans", response_model=ScanOut, status_code=201)
async def launch(body: ScanIn, db: Session = Depends(get_db),
                 user: User = Depends(require("scan:launch"))):
    valid = [p for p in body.platforms if p in REGISTRY]
    if not valid:
        raise HTTPException(400, "Aucune plateforme valide sélectionnée")
    kws = [k.strip() for k in (body.keywords or []) if k.strip()]
    if body.objective and body.objective in OBJECTIVE_PRESETS:
        kws = list(dict.fromkeys(kws + OBJECTIVE_PRESETS[body.objective]))
    targets = [t.strip() for t in (body.targets or []) if t.strip()]
    job = ScanJob(platforms=valid, keywords=kws, region=body.region or "National",
                  requested_by=user.name, status="pending")
    db.add(job)
    db.commit()
    db.refresh(job)
    detail = f"{', '.join(valid)} · {job.region}" + (f" · mots-clés: {', '.join(kws)}" if kws else "")
    if targets:
        detail += f" · cibles: {len(targets)}"
    log(db, "SCAN_LAUNCHED", detail, user)
    asyncio.create_task(run_scan(job.id, max(5, min(body.limit, 100)), targets))
    return job


@router.get("/scans", response_model=list[ScanOut])
def list_scans(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(ScanJob).order_by(ScanJob.started_at.desc()).limit(30)).all()


@router.get("/scans/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    job = db.get(ScanJob, scan_id)
    if not job:
        raise HTTPException(404, "Scan introuvable")
    return job
