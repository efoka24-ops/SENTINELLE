"""Détection de Comportements Coordonnés Inauthentiques (CIB) — inspiré VIGINUM.

Recherche, parmi les contenus collectés, des grappes de messages quasi-identiques
diffusés par plusieurs comptes distincts (et/ou plusieurs plateformes) — signature
typique d'une campagne coordonnée / amplification artificielle.
"""
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Content
from ..nlp.gazetteer import REGIONS

_CITY_TOKENS = {c for cs in REGIONS.values() for c in cs}
_STOP = {"le", "la", "les", "des", "une", "un", "de", "du", "et", "à", "a", "en",
         "ce", "ces", "que", "qui", "pour", "sur", "the", "and", "for", "you"}


def _signature(text: str) -> str:
    low = re.sub(r"[^a-zàâäéèêëîïôöùûüç ]", " ", text.lower())
    toks = [
        t for t in low.split()
        if len(t) > 3 and t not in _STOP and t not in _CITY_TOKENS
    ]
    return " ".join(sorted(set(toks))[:6])


def detect_cib(db: Session, min_authors: int = 3) -> list[dict]:
    rows = db.scalars(select(Content)).all()
    clusters: dict[str, list[Content]] = {}
    for c in rows:
        sig = _signature(c.text)
        if not sig:
            continue
        clusters.setdefault(sig, []).append(c)

    out: list[dict] = []
    for sig, items in clusters.items():
        authors = {i.author for i in items if i.author}
        platforms = {i.platform for i in items}
        if len(authors) < min_authors:
            continue
        size = len(items)
        cats = {}
        for i in items:
            if i.threat_category != "neutral":
                cats[i.threat_category] = cats.get(i.threat_category, 0) + 1
        dominant = max(cats, key=cats.get) if cats else "neutral"
        score = min(0.99, 0.40 + 0.05 * size + 0.06 * len(platforms) + 0.03 * len(authors))
        level = ("CRITICAL" if score >= 0.85 else "HIGH" if score >= 0.75
                 else "MEDIUM" if score >= 0.6 else "LOW")
        sample = max(items, key=lambda i: i.threat_score)
        out.append({
            "signature": sig,
            "sample": sample.text[:160],
            "size": size,
            "authors": sorted(authors)[:14],
            "author_count": len(authors),
            "platforms": sorted(platforms),
            "dominant_category": dominant,
            "score": round(score, 3),
            "level": level,
        })

    out.sort(key=lambda x: x["score"], reverse=True)
    return out[:12]
