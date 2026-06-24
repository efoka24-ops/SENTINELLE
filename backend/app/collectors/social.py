"""Collecteurs réseaux sociaux.

Chaque connecteur tente une collecte RÉELLE si la clé/API est configurée
(variables d'environnement), sinon bascule en mode DÉMO réaliste afin que le
pipeline complet (collecte → NLP → alertes) reste démontrable de bout en bout.

- X / Twitter : API v2 recent search (réel si TWITTER_BEARER_TOKEN).
- YouTube     : Data API v3 search (réel si YOUTUBE_API_KEY).
- Facebook / LinkedIn / Telegram / Instagram / TikTok : adaptateurs prêts ;
  collecte réelle nécessite OAuth/app review/session (clé en env) — sinon démo.
"""
import random

import httpx

from ..config import settings
from ..nlp.gazetteer import REGIONS
from .base import Collector, RawItem, utcnow
from .apify import run_actor as apify_run, to_items as apify_items

_PLATFORM_BASE = {
    "Facebook": "https://www.facebook.com/",
    "Instagram": "https://www.instagram.com/",
    "TikTok": "https://www.tiktok.com/@",
    "LinkedIn": "https://www.linkedin.com/in/",
    "Twitter / X": "https://twitter.com/",
    "YouTube": "https://www.youtube.com/@",
    "Reddit": "https://www.reddit.com/r/",
}


def _mk_urls(platform: str, targets: list[str]) -> list[str]:
    base = _PLATFORM_BASE.get(platform, "")
    return [t if t.startswith("http") else base + t.lstrip("@") for t in targets]


def _handle(target: str) -> str:
    return target.rstrip("/").split("/")[-1].lstrip("@")


async def _apify_collect(platform: str, targets: list[str], limit: int) -> list[RawItem]:
    """Collecte via Apify (pages / groupes / comptes publics) si configuré.

    Le payload est un sur-ensemble tolérant : chaque actor lit les clés qu'il
    reconnaît et ignore les autres (FB, IG, TikTok, X, LinkedIn, YouTube, Reddit).
    """
    actor = settings.APIFY_ACTORS.get(platform)
    if not (settings.APIFY_TOKEN and actor and targets):
        return []
    urls = _mk_urls(platform, targets)
    handles = [_handle(t) for t in targets]
    start = [{"url": u} for u in urls]
    # Payload STRICTEMENT spécifique : certains actors rejettent les clés inconnues.
    if platform == "Facebook":
        payload: dict = {"startUrls": start, "resultsLimit": limit}
    elif platform == "Instagram":
        payload = {"directUrls": urls, "resultsType": "posts", "resultsLimit": limit}
    elif platform == "TikTok":
        payload = {"profiles": handles, "resultsPerPage": limit,
                   "shouldDownloadVideos": False, "shouldDownloadCovers": False}
    elif platform == "LinkedIn":
        payload = {"username": handles[0] if handles else "", "usernames": handles, "startUrls": start}
    elif platform == "Twitter / X":
        payload = {"startUrls": start, "searchTerms": handles, "maxTweets": limit}
    elif platform == "YouTube":
        payload = {"startUrls": start, "maxResults": limit}
    elif platform == "Reddit":
        payload = {"startUrls": start, "maxPostCount": limit}
    else:
        payload = {"startUrls": start, "maxItems": limit}

    rows = await apify_run(actor, payload)
    return apify_items(rows, platform)

# Modèles de contenu (déclenchent volontairement le classifieur lexical)
TEMPLATES: list[tuple[float, str]] = [
    (0.40, "Ambiance à {city} ce weekend, circulation dense et marché animé. Tout est calme."),
    (0.10, "Réunion communautaire à {city} pour discuter du développement local et de l'eau potable."),
    (0.10, "Rejoignez le jihad à {city}, les combattants attendent. Gloire aux martyrs, allahu akbar."),
    (0.09, "Ces gens du nord-ouest, il faut les tuer. Sécessionnistes vermine à {city}, à mort les traîtres."),
    (0.09, "URGENT diffusez : le vaccin tue, ce qu'on vous cache sur {city}. Partagez avant suppression."),
    (0.08, "Sortez dans la rue à {city}, bloquons tout, à bas le régime. Révolution maintenant."),
    (0.07, "Cliquez ici pour gagner : votre compte sera suspendu, vérifiez vos identifiants via ce lien sécurisé urgent."),
    (0.07, "Selon nos sources étrangères, le vrai pouvoir derrière {city}. Narratif importé, agents étrangers à l'œuvre."),
    (0.05, "Petite jeune dispo à {city}, tu as quel âge ? envoie une photo privée, garde le secret 🔞"),
    (0.05, "Escort dispo cette nuit à {city}, tarif nuit, rdv discret, service complet 🔞💋💦"),
]

HANDLES = {
    "Facebook": ["Page Actu 237", "Groupe public {c}", "Voix du {c}", "Info Citoyenne"],
    "Twitter / X": ["@infos_cmr", "@buzz237", "@veille_{c}", "@actu_rapide"],
    "LinkedIn": ["recrutement-pro-237", "talent-acquisition-cm", "diaspora-network", "opportunites-{c}"],
    "Telegram": ["@canal_{c}", "@veille_nord", "@actu_directe", "@infos_securite"],
    "YouTube": ["Chaîne Actu CMR", "Live Politique 237", "Reporter {c}"],
    "Instagram": ["story_{c}", "237_news", "buzz_visuel"],
    "TikTok": ["clip_{c}", "viral_237", "info_courte"],
}


def _cities(region: str) -> list[str]:
    if region and region in REGIONS:
        return REGIONS[region]
    return [c for cs in REGIONS.values() for c in cs]


def _demo(platform: str, region: str, n: int) -> list[RawItem]:
    cities = _cities(region)
    weights = [w for w, _ in TEMPLATES]
    texts = [t for _, t in TEMPLATES]
    handles = HANDLES.get(platform, ["compte_anonyme"])
    out: list[RawItem] = []
    for i in range(n):
        city = random.choice(cities)
        tmpl = random.choices(texts, weights=weights, k=1)[0]
        handle = random.choice(handles).replace("{c}", city.split("-")[0].title())
        out.append(RawItem(
            platform=platform,
            source_id=f"demo-{platform}-{utcnow().timestamp()}-{i}",
            author=handle,
            text=tmpl.format(city=city.title()),
            source_url="",
            published_at=utcnow(),
            mode="demo",
        ))
    return out


class TwitterCollector(Collector):
    platform = "Twitter / X"

    def _apify_targets(self) -> list[str]:
        return [t for t in settings.WATCH_TARGETS if "twitter" in t.lower() or "x.com" in t.lower()]

    def is_live(self) -> bool:
        return bool(settings.TWITTER_BEARER_TOKEN) or bool(settings.APIFY_TOKEN and self._apify_targets())

    async def collect(self, region: str, limit: int) -> list[RawItem]:
        if settings.APIFY_TOKEN and self._apify_targets():
            items = await _apify_collect("Twitter / X", self._apify_targets(), min(limit, 25))
            if items:
                return items
        if not settings.TWITTER_BEARER_TOKEN:
            return _demo(self.platform, region, min(limit, 20))
        try:
            q = "(Cameroun OR Cameroon) -is:retweet lang:fr"
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    "https://api.twitter.com/2/tweets/search/recent",
                    params={"query": q, "max_results": min(max(limit, 10), 100),
                            "tweet.fields": "created_at,author_id"},
                    headers={"Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}"},
                )
            data = r.json()
            out = []
            for t in data.get("data", []):
                out.append(RawItem(
                    platform=self.platform, source_id=t["id"],
                    author=str(t.get("author_id", "")), text=t.get("text", ""),
                    source_url=f"https://twitter.com/i/web/status/{t['id']}",
                    published_at=utcnow(), mode="live",
                ))
            return out or _demo(self.platform, region, min(limit, 20))
        except Exception:
            return _demo(self.platform, region, min(limit, 20))


class YouTubeCollector(Collector):
    platform = "YouTube"

    def _apify_targets(self) -> list[str]:
        return [t for t in settings.WATCH_TARGETS if "youtube" in t.lower() or "youtu.be" in t.lower()]

    def is_live(self) -> bool:
        return bool(settings.YOUTUBE_API_KEY) or bool(settings.APIFY_TOKEN and self._apify_targets())

    async def collect(self, region: str, limit: int) -> list[RawItem]:
        if settings.APIFY_TOKEN and self._apify_targets():
            items = await _apify_collect("YouTube", self._apify_targets(), min(limit, 15))
            if items:
                return items
        if not settings.YOUTUBE_API_KEY:
            return _demo(self.platform, region, min(limit, 12))
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    "https://www.googleapis.com/youtube/v3/search",
                    params={"part": "snippet", "q": "Cameroun actualités",
                            "maxResults": min(limit, 25), "type": "video",
                            "key": settings.YOUTUBE_API_KEY},
                )
            data = r.json()
            out = []
            for it in data.get("items", []):
                sn = it.get("snippet", {})
                vid = it.get("id", {}).get("videoId", "")
                out.append(RawItem(
                    platform=self.platform, source_id=vid,
                    author=sn.get("channelTitle", ""),
                    text=f"{sn.get('title','')}. {sn.get('description','')}",
                    source_url=f"https://youtube.com/watch?v={vid}",
                    published_at=utcnow(), mode="live",
                ))
            return out or _demo(self.platform, region, min(limit, 12))
        except Exception:
            return _demo(self.platform, region, min(limit, 12))


class _EnvGatedDemo(Collector):
    """FB / LinkedIn / Telegram / Instagram / TikTok : démo tant que la
    collecte réelle (OAuth/app review/session) n'est pas branchée."""
    platform = "generic"
    env_key = ""
    cap = 20

    def _targets(self) -> list[str]:
        key = self.platform.lower().split(" /")[0]
        return [t for t in settings.WATCH_TARGETS if key in t.lower()]

    def is_live(self) -> bool:
        if settings.APIFY_TOKEN and self._targets():
            return True
        return bool(getattr(settings, self.env_key, "")) if self.env_key else False

    async def collect(self, region: str, limit: int) -> list[RawItem]:
        targets = self._targets()
        if settings.APIFY_TOKEN and targets:
            items = await _apify_collect(self.platform, targets, min(limit, self.cap))
            if items:
                return items
        return _demo(self.platform, region, min(limit, self.cap))


class FacebookCollector(Collector):
    """Facebook.

    - Token + FACEBOOK_PAGE_IDS  -> Graph API (robuste, légal).
    - FACEBOOK_PAGE_IDS sans token -> scraping public best-effort (fragile, CGU).
    - sinon -> démo.
    """
    platform = "Facebook"

    def is_live(self) -> bool:
        return bool(settings.APIFY_TOKEN or settings.FACEBOOK_PAGE_IDS or settings.FACEBOOK_ACCESS_TOKEN)

    async def collect(self, region: str, limit: int) -> list[RawItem]:
        pages = settings.FACEBOOK_PAGE_IDS or [t for t in settings.WATCH_TARGETS if "facebook" in t.lower()]
        # 1) Apify (contourne l'App Review) — pages, groupes, posts publics
        if settings.APIFY_TOKEN and pages:
            items = await _apify_collect("Facebook", pages, limit)
            if items:
                return items
        # 2) Graph API officielle (token + pages)
        if settings.FACEBOOK_ACCESS_TOKEN and settings.FACEBOOK_PAGE_IDS:
            items = await self._graph(settings.FACEBOOK_PAGE_IDS, limit)
            if items:
                return items
        # 3) Scraping public best-effort (souvent mur de connexion)
        if pages:
            items = await self._scrape(pages, limit)
            if items:
                return items
        return _demo(self.platform, region, min(limit, 30))

    async def _graph(self, pages: list[str], limit: int) -> list[RawItem]:
        out: list[RawItem] = []
        ver = settings.GRAPH_API_VERSION
        per = max(3, min(limit, 25))
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                for pid in pages[:10]:
                    r = await client.get(
                        f"https://graph.facebook.com/{ver}/{pid}/posts",
                        params={"fields": "message,created_time,permalink_url,from",
                                "limit": per, "access_token": settings.FACEBOOK_ACCESS_TOKEN},
                    )
                    for p in r.json().get("data", []):
                        msg = p.get("message")
                        if not msg:
                            continue
                        out.append(RawItem(
                            platform=self.platform, source_id=p.get("id", ""),
                            author=(p.get("from") or {}).get("name", pid), text=msg,
                            source_url=p.get("permalink_url", ""), published_at=utcnow(), mode="live",
                        ))
        except Exception:
            return out
        return out

    async def _scrape(self, pages: list[str], limit: int) -> list[RawItem]:
        """Best-effort : mbasic.facebook.com renvoie parfois du contenu public
        sans authentification. Souvent vide (mur de connexion) -> repli démo."""
        import re as _re
        out: list[RawItem] = []
        headers = {"User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"}
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
                for pid in pages[:6]:
                    resp = await client.get(f"https://mbasic.facebook.com/{pid}")
                    if resp.status_code != 200:
                        continue
                    # Extraction grossière de blocs de texte visibles
                    texts = _re.findall(r"<p>(.*?)</p>", resp.text, _re.S)
                    for t in texts[: max(2, limit // len(pages[:6]) or 2)]:
                        clean = _re.sub(r"<[^>]+>", " ", t).strip()
                        if len(clean) > 25:
                            out.append(RawItem(
                                platform=self.platform, source_id=f"scrape-{pid}-{len(out)}",
                                author=pid, text=clean[:1500],
                                source_url=f"https://facebook.com/{pid}", published_at=utcnow(), mode="live",
                            ))
        except Exception:
            return out
        return out


class LinkedInCollector(_EnvGatedDemo):
    platform = "LinkedIn"
    env_key = "LINKEDIN_ACCESS_TOKEN"
    cap = 20


class TelegramCollector(_EnvGatedDemo):
    platform = "Telegram"
    env_key = "TELEGRAM_API_ID"
    cap = 25


class InstagramCollector(_EnvGatedDemo):
    platform = "Instagram"
    env_key = "FACEBOOK_ACCESS_TOKEN"
    cap = 15


class TikTokCollector(_EnvGatedDemo):
    platform = "TikTok"
    env_key = ""
    cap = 12


class RedditCollector(_EnvGatedDemo):
    platform = "Reddit"
    env_key = ""
    cap = 20
