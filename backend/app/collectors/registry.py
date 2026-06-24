"""Registre des connecteurs disponibles (clé = nom de plateforme)."""
from .base import Collector
from .press import PressCollector
from .social import (
    FacebookCollector,
    InstagramCollector,
    LinkedInCollector,
    RedditCollector,
    TelegramCollector,
    TikTokCollector,
    TwitterCollector,
    YouTubeCollector,
)

REGISTRY: dict[str, Collector] = {
    "Presse": PressCollector(),
    "Facebook": FacebookCollector(),
    "Twitter / X": TwitterCollector(),
    "LinkedIn": LinkedInCollector(),
    "Telegram": TelegramCollector(),
    "YouTube": YouTubeCollector(),
    "Instagram": InstagramCollector(),
    "TikTok": TikTokCollector(),
    "Reddit": RedditCollector(),
}


def available_platforms() -> list[dict]:
    return [
        {"platform": name, "live": c.is_live()}
        for name, c in REGISTRY.items()
    ]
