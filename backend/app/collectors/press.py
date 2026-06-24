"""Collecteur Presse — RÉEL, sans clé API (RSS des médias camerounais/internationaux).

Récupère réellement les flux, en direct. C'est le connecteur pleinement
fonctionnel hors-API. En cas d'indisponibilité réseau d'un flux, il est ignoré.
"""
import asyncio

import feedparser
import httpx

from .base import Collector, RawItem, utcnow

FEEDS = [
    ("Cameroon Tribune", "https://www.cameroon-tribune.cm/rss.xml"),
    ("Journal du Cameroun", "https://www.journalducameroun.com/feed/"),
    ("Actu Cameroun", "https://actucameroun.com/feed/"),
    ("CamerounWeb", "https://www.camerounweb.com/cameroonhomepage/rss/"),
    ("RFI Afrique", "https://www.rfi.fr/fr/afrique/rss"),
    ("BBC Afrique", "https://www.bbc.com/afrique/index.xml"),
    ("VOA Afrique", "https://www.voaafrique.com/api/zmgqoe$mom"),
]


class PressCollector(Collector):
    platform = "Presse"

    def is_live(self) -> bool:
        return True  # RSS public, toujours réel

    async def collect(self, region: str, limit: int) -> list[RawItem]:
        items: list[RawItem] = []
        per_feed = max(2, limit // max(1, len(FEEDS)))
        async with httpx.AsyncClient(
            timeout=8.0, follow_redirects=True,
            headers={"User-Agent": "SentinelleBot/1.0 (+veille publique)"},
        ) as client:
            results = await asyncio.gather(
                *[self._fetch(client, name, url, per_feed) for name, url in FEEDS],
                return_exceptions=True,
            )
        for r in results:
            if isinstance(r, list):
                items.extend(r)
        return items[:limit]

    async def _fetch(self, client, name, url, n) -> list[RawItem]:
        out: list[RawItem] = []
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return out
            parsed = feedparser.parse(resp.content)
            for e in parsed.entries[:n]:
                title = getattr(e, "title", "")
                summary = getattr(e, "summary", "")
                text = f"{title}. {summary}".strip()
                if not text:
                    continue
                out.append(RawItem(
                    platform=self.platform,
                    source_id=getattr(e, "id", getattr(e, "link", title))[:480],
                    author=name,
                    text=text[:2000],
                    source_url=getattr(e, "link", ""),
                    published_at=utcnow(),
                    mode="live",
                ))
        except Exception:
            return out
        return out
