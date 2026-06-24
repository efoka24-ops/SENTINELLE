"""Gazetier Cameroun (sous-ensemble) pour la géolocalisation par extraction textuelle."""

# region -> liste de villes / localités clés (minuscule)
REGIONS: dict[str, list[str]] = {
    "Extrême-Nord": ["maroua", "mora", "kousseri", "kousséri", "fotokol", "kolofata", "waza", "mokolo", "yagoua"],
    "Nord": ["garoua", "guider", "figuil", "pitoa", "lagdo", "tcholliré"],
    "Adamaoua": ["ngaoundéré", "ngaoundere", "tibati", "meiganga", "banyo", "tignère"],
    "Est": ["bertoua", "batouri", "abong-mbang", "yokadouma", "garoua-boulaï"],
    "Centre": ["yaoundé", "yaounde", "mbalmayo", "obala", "bafia", "monatélé", "akonolinga"],
    "Littoral": ["douala", "nkongsamba", "edéa", "edea", "loum", "manjo"],
    "Ouest": ["bafoussam", "dschang", "mbouda", "bafang", "foumban", "bandjoun"],
    "Sud-Ouest": ["buea", "limbe", "kumba", "tiko", "mamfe", "muyuka", "ekona"],
    "Nord-Ouest": ["bamenda", "kumbo", "ndop", "wum", "fundong", "bali", "batibo"],
    "Sud": ["ebolowa", "kribi", "sangmélima", "ambam", "djoum"],
}

_LOOKUP: dict[str, tuple[str, str]] = {}
for _region, _cities in REGIONS.items():
    for _c in _cities:
        _LOOKUP[_c] = (_region, _c.title())


def geolocate(text: str, fallback_region: str = "National") -> tuple[str, str]:
    """Retourne (region, ville) détectée dans le texte, sinon le périmètre demandé."""
    low = text.lower()
    for token, (region, city) in _LOOKUP.items():
        if token in low:
            return region, city
    if fallback_region and fallback_region not in ("National", "", "Unknown"):
        return fallback_region, ""
    return ("National" if fallback_region == "National" else "Unknown"), ""
