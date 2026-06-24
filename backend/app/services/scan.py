"""Service d'orchestration de scan : collecte → NLP → géoloc → stockage → alertes."""
from datetime import datetime, timezone

from ..collectors.registry import REGISTRY
from ..db import SessionLocal
from ..models import Alert, Content, ScanJob
from ..nlp.classifier import THRESHOLDS, classify
from ..nlp.gazetteer import geolocate
from ..ws import manager


def level_for(score: float) -> str:
    if score >= 0.85:
        return "CRITICAL"
    if score >= 0.75:
        return "HIGH"
    if score >= 0.60:
        return "MEDIUM"
    if score >= 0.45:
        return "LOW"
    return "INFO"


async def run_scan(scan_id: int, limit: int = 40, targets: list[str] | None = None) -> None:
    db = SessionLocal()
    job = db.get(ScanJob, scan_id)
    if job is None:
        db.close()
        return
    job.status = "running"
    db.commit()
    await manager.broadcast("scan_update", _job_dict(job))

    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        for platform in job.platforms:
            collector = REGISTRY.get(platform)
            if collector is None:
                continue
            items = await collector.collect(job.region, limit, targets)
            keywords = job.keywords or []
            for raw in items:
                res = classify(raw.text, keywords)
                region, city = geolocate(raw.text, job.region)
                content = Content(
                    scan_id=job.id, platform=raw.platform, source_id=raw.source_id,
                    source_url=raw.source_url, author=raw.author, text=raw.text,
                    lang=res.lang, region=region, city=city,
                    threat_category=res.category, threat_subcategory=res.subcategory,
                    threat_score=res.score, sentiment=res.sentiment, status="analyzed",
                    published_at=raw.published_at,
                )
                db.add(content)
                db.flush()
                job.collected += 1

                if res.category != "neutral":
                    job.threats += 1
                    if res.score >= THRESHOLDS.get(res.category, 0.6):
                        alert = Alert(
                            number="", level=level_for(res.score),
                            threat_type=res.category, title=raw.text[:140],
                            content_id=content.id, platform=raw.platform,
                            region=region, place=(f"{city}, {region}" if city else region),
                            score=res.score, status="Ouvert",
                        )
                        db.add(alert)
                        db.flush()
                        alert.number = f"{day}-{alert.id:04d}"
                        job.alerts += 1
                        db.commit()
                        await manager.broadcast("new_alert", {
                            "number": alert.number, "level": alert.level,
                            "threat_type": alert.threat_type, "title": alert.title,
                            "platform": alert.platform, "place": alert.place,
                            "score": alert.score,
                        })
            db.commit()
            await manager.broadcast("scan_update", _job_dict(job))

        job.status = "done"
        job.finished_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:  # pragma: no cover
        job.status = "error"
        job.error = str(exc)[:500]
        db.commit()
    await manager.broadcast("scan_update", _job_dict(job))
    db.close()


def _job_dict(job: ScanJob) -> dict:
    return {
        "id": job.id, "status": job.status, "platforms": job.platforms,
        "region": job.region, "collected": job.collected,
        "threats": job.threats, "alerts": job.alerts,
    }
