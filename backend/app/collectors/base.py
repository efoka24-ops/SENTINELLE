"""Contrat commun des collecteurs + structure d'item normalisé."""
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class RawItem:
    platform: str
    source_id: str
    author: str
    text: str
    source_url: str = ""
    published_at: datetime | None = None
    mode: str = "demo"  # "live" si collecté via API réelle, sinon "demo"
    meta: dict = field(default_factory=dict)


class Collector:
    platform: str = "generic"

    def is_live(self) -> bool:
        """True si une clé/API réelle est configurée pour ce connecteur."""
        return False

    async def collect(self, region: str, limit: int, targets: list[str] | None = None) -> list[RawItem]:  # pragma: no cover
        """`targets` : cibles publiques (URLs/comptes) saisies pour CE scan.
        Si absentes, le collecteur retombe sur les cibles globales (env)."""
        raise NotImplementedError


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
