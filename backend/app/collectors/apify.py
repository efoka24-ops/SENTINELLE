"""Connecteur Apify — collecte de contenus publics (pages, groupes, posts)
via des « actors » Apify, sans App Review des plateformes.

Nécessite uniquement APIFY_TOKEN. Les champs renvoyés varient selon l'actor ;
le mapping est volontairement tolérant (best-effort).
"""
import httpx

from ..config import settings
from .base import RawItem, utcnow


async def run_actor(actor: str, payload: dict, timeout: float = 300.0) -> list[dict]:
    """Lance un actor et récupère les items du dataset (exécution synchrone)."""
    if not settings.APIFY_TOKEN:
        return []
    url = f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(url, params={"token": settings.APIFY_TOKEN}, json=payload)
            if r.status_code >= 300:
                return []
            data = r.json()
            return data if isinstance(data, list) else []
    except Exception:
        return []


def _first(d: dict, *keys: str) -> str:
    for k in keys:
        v = d.get(k)
        if isinstance(v, dict):
            v = v.get("name") or v.get("nickName") or v.get("username") or v.get("fullName")
        if v:
            return str(v)
    return ""


def to_items(rows: list[dict], platform: str) -> list[RawItem]:
    out: list[RawItem] = []
    for d in rows:
        if not isinstance(d, dict) or d.get("error"):
            continue
        text = _first(d, "text", "message", "caption", "postText", "content",
                      "desc", "description", "title", "body", "fullText")
        if not text or len(text) < 5:
            continue
        author = _first(d, "authorName", "ownerUsername", "pageName", "authorMeta",
                        "user", "author", "ownerFullName", "nickName", "channelName") or platform
        link = _first(d, "url", "postUrl", "link", "permalink", "webVideoUrl", "tweetUrl")
        sid = _first(d, "id", "postId", "fbid", "tweetId") or link or f"apify-{len(out)}"
        out.append(RawItem(
            platform=platform, source_id=str(sid), author=author,
            text=text[:2000], source_url=link, published_at=utcnow(), mode="live",
        ))
    return out
