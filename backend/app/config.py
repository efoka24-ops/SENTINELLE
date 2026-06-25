"""Configuration chargée depuis l'environnement (et .env si présent)."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv() -> None:
    env = BASE_DIR / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip())


_load_dotenv()


def _db_url() -> str:
    """URL de base : SENTINELLE_DB_URL > DATABASE_URL (Railway) > SQLite local.
    Normalise le schéma `postgres://` (Railway/Heroku) en `postgresql://`
    requis par SQLAlchemy, et force le driver psycopg2."""
    url = (
        os.environ.get("SENTINELLE_DB_URL")
        or os.environ.get("DATABASE_URL")
        or f"sqlite:///{BASE_DIR / 'sentinelle.db'}"
    )
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    return url


class Settings:
    JWT_SECRET: str = os.environ.get("SENTINELLE_JWT_SECRET", "dev-secret-change-me")
    JWT_ALG: str = "HS256"
    JWT_TTL_HOURS: int = 8

    # Connexion par code à usage unique envoyé par e-mail.
    #  - AUTH_DEV_MODE=true  (DÉVELOPPEMENT) : pas d'e-mail, le code est renvoyé dans la réponse.
    #  - AUTH_DEV_MODE=false (PRODUCTION)    : le code est envoyé par e-mail, jamais renvoyé.
    AUTH_DEV_MODE: bool = os.environ.get("SENTINELLE_AUTH_DEV_MODE", "true").lower() in ("1", "true", "yes")
    LOGIN_CODE_TTL_MIN: int = 10
    DB_URL: str = _db_url()
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.environ.get(
            "SENTINELLE_CORS_ORIGINS",
            "http://localhost:5173,http://localhost:5174",
        ).split(",")
        if o.strip()
    ]
    # Autorise par défaut tout déploiement Vercel (*.vercel.app) sans config.
    # Surchargeable via SENTINELLE_CORS_ORIGIN_REGEX.
    CORS_ORIGIN_REGEX: str = os.environ.get(
        "SENTINELLE_CORS_ORIGIN_REGEX",
        r"https://.*\.vercel\.app",
    )

    # Clés API des plateformes (présence => collecte réelle)
    TWITTER_BEARER_TOKEN: str = os.environ.get("TWITTER_BEARER_TOKEN", "")
    FACEBOOK_ACCESS_TOKEN: str = os.environ.get("FACEBOOK_ACCESS_TOKEN", "")
    FACEBOOK_PAGE_IDS: list[str] = [
        p.strip() for p in os.environ.get("FACEBOOK_PAGE_IDS", "").split(",") if p.strip()
    ]
    GRAPH_API_VERSION: str = os.environ.get("GRAPH_API_VERSION", "v21.0")
    LINKEDIN_ACCESS_TOKEN: str = os.environ.get("LINKEDIN_ACCESS_TOKEN", "")

    # Fournisseur de scraping (évite l'App Review) — Apify
    APIFY_TOKEN: str = os.environ.get("APIFY_TOKEN", "")
    APIFY_ACTORS: dict = {
        "Facebook": os.environ.get("APIFY_FACEBOOK_ACTOR", "apify~facebook-posts-scraper"),
        "Instagram": os.environ.get("APIFY_INSTAGRAM_ACTOR", "apify~instagram-scraper"),
        "TikTok": os.environ.get("APIFY_TIKTOK_ACTOR", "clockworks~tiktok-scraper"),
        "LinkedIn": os.environ.get("APIFY_LINKEDIN_ACTOR", "apimaestro~linkedin-profile-posts"),
        "Twitter / X": os.environ.get("APIFY_TWITTER_ACTOR", "apidojo~tweet-scraper"),
        "YouTube": os.environ.get("APIFY_YOUTUBE_ACTOR", "streamers~youtube-scraper"),
        "Reddit": os.environ.get("APIFY_REDDIT_ACTOR", "trudax~reddit-scraper"),
    }
    # Cibles publiques à surveiller (pages, groupes, comptes) — URLs ou identifiants
    WATCH_TARGETS: list[str] = [
        t.strip() for t in os.environ.get("WATCH_TARGETS", "").split(",") if t.strip()
    ]
    YOUTUBE_API_KEY: str = os.environ.get("YOUTUBE_API_KEY", "")
    TELEGRAM_API_ID: str = os.environ.get("TELEGRAM_API_ID", "")
    TELEGRAM_API_HASH: str = os.environ.get("TELEGRAM_API_HASH", "")

    # SMTP (envoi réel des rapports / notifications)
    SMTP_HOST: str = os.environ.get("SMTP_HOST", "")
    SMTP_PORT: int = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER: str = os.environ.get("SMTP_USER", "")
    SMTP_PASSWORD: str = os.environ.get("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER", ""))
    SMTP_TLS: str = os.environ.get("SMTP_TLS", "starttls").lower()  # starttls|ssl|none


settings = Settings()
