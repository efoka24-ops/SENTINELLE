"""Classifieur de menaces lexical (FR/EN + tokens locaux).

Moteur réel, déterministe et extensible : compte les correspondances de lexiques
pondérés par catégorie, calcule un score [0..1], une sous-catégorie, la langue
et le sentiment. Remplaçable par un modèle transformers (CamemBERT/XLM-R) en
gardant la même signature `classify()`.
"""
import re
import unicodedata
from dataclasses import dataclass


def _fold(s: str) -> str:
    """Minuscule sans accents (robustesse orthographe)."""
    return "".join(
        c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn"
    )

# Lexiques par catégorie -> sous-catégorie -> mots-clés (minuscule)
LEXICONS: dict[str, dict[str, list[str]]] = {
    "terrorism": {
        "recrutement": ["rejoignez", "recrutement", "combattants", "moudjahidin", "join the fight", "enrôler", "enroler"],
        "propagande": ["jihad", "djihad", "califat", "boko haram", "iswap", "martyr", "shahid", "allahu akbar"],
        "planification_attaque": ["attaque", "attentat", "cible", "explosif", "kamikaze", "ied", "embuscade"],
        "glorification": ["héros", "martyrs", "victoire d'allah", "gloire aux combattants"],
    },
    "hate_speech": {
        "haine_ethnique": ["sale tribu", "ces bamis", "ces bétis", "nordistes", "tous les mêmes", "race inférieure", "cockroaches"],
        "haine_regionale": ["anglofous", "francofous", "ambazonia clowns", "ces gens du nord-ouest", "sécessionnistes vermine"],
        "haine_religieuse": ["sales musulmans", "sales chrétiens", "mécréants", "infidèles à éliminer"],
        "incitation_violence": ["il faut les tuer", "brûlez", "qu'on les massacre", "éliminer ces", "à mort les", "kill them all"],
    },
    "disinformation": {
        "fake_news": ["en réalité", "ce qu'on vous cache", "la vérité cachée", "scoop exclusif non vérifié", "fake", "intox"],
        "rumeur_amplifiee": ["partagez avant suppression", "faites tourner", "urgent diffusez", "share before deleted"],
        "desinformation_sante": ["le vaccin tue", "remède miracle", "covid est un mensonge", "ne vous faites pas vacciner"],
        "desinformation_electorale": ["élection truquée", "fraude massive prouvée", "résultats déjà connus", "bourrage des urnes"],
    },
    "insurrection": {
        "appel_manifester_illegalement": ["sortez dans la rue", "manifestation interdite maintenue", "bloquons tout", "villes mortes"],
        "appel_renverser_gouvernement": ["renverser le régime", "chassons le pouvoir", "révolution maintenant", "à bas le régime"],
        "coordination_violence": ["rendez-vous armés", "préparez les machettes", "on attaque demain", "tous au point de ralliement"],
    },
    "foreign_interference": {
        "campagne_influence": ["agents étrangers", "puissance étrangère soutient", "narratif importé", "troll farm"],
        "propagande_etatique_etrangere": ["selon nos sources étrangères", "le vrai pouvoir derrière"],
    },
    "cybersecurity": {
        "phishing": ["cliquez ici pour gagner", "votre compte sera suspendu", "vérifiez vos identifiants", "lien sécurisé urgent", "verify your account"],
        "ransomware": ["vos fichiers sont chiffrés", "payez en bitcoin", "rançon", "ransomware"],
        "fuite_donnees": ["base de données fuitée", "données personnelles exposées", "leak", "dump de comptes"],
        "ddos_annonce": ["nous allons attaquer le site", "ddos", "faire tomber le serveur"],
    },
    # Détection de protection de l'enfance (signalement aux autorités)
    "child_safety": {
        "pedopiegeage": ["tu as quel âge", "envoie une photo privée", "garde le secret",
                          "ne dis pas à tes parents", "on se voit en cachette", "send me a private pic"],
        "exploitation_mineurs": ["mineure dispo", "très jeune dispo", "collégienne dispo", "ado dispo", "jeune fille de 14"],
    },
    # Détection de proxénétisme / traite des êtres humains
    "trafficking": {
        "recrutement": ["escort dispo", "placement filles", "recherche filles", "gain facile assuré",
                        "travail discret bien payé", "sugar daddy cherche", "rejoins notre agence"],
        "proxenetisme": ["tarif nuit", "service complet dispo", "disponible cette nuit", "rdv discret",
                         "massage tarif", "vip dispo", "escort"],
    },
}

# Indices emoji de sollicitation sexuelle (proxénétisme / exploitation)
EMOJI_SEXUAL = ["🔞", "💋", "🍑", "🍆", "💦", "👅", "👙", "🥵", "💸"]
MINOR_TOKENS = ["mineur", "mineure", "ado ", "adolescent", "collégien", "collégienne",
                "13 ans", "14 ans", "15 ans", "16 ans", "petite jeune", "jeune fille de"]
SOLICIT_TOKENS = ["dispo", "tarif", "service", "rdv", "escort", "placement", "contactez",
                  "privé", " dm ", "prix", "nuit", "massage", "vip", "discret"]

CATEGORY_LABELS = {
    "terrorism": "Terrorisme & violence armée",
    "hate_speech": "Discours de haine",
    "disinformation": "Désinformation",
    "insurrection": "Appels à l'insurrection",
    "foreign_interference": "Ingérence étrangère",
    "cybersecurity": "Cybersécurité",
    "child_safety": "Protection des mineurs",
    "trafficking": "Proxénétisme / traite",
    "watch": "Surveillance ciblée",
    "neutral": "Neutre",
}

# Seuils d'alerte par catégorie (alignés sur le MVP)
THRESHOLDS = {
    "terrorism": 0.65, "hate_speech": 0.60, "disinformation": 0.55,
    "insurrection": 0.70, "foreign_interference": 0.60, "cybersecurity": 0.65,
    "child_safety": 0.50, "trafficking": 0.55,
}

_NEG = ["mort", "tuer", "haine", "violence", "attaque", "danger", "guerre", "peur",
        "menace", "détruire", "sang", "kill", "hate", "war", "blood", "fear"]

_EN_HINTS = ["the ", " and ", " is ", " are ", " you ", " join ", " kill ", " account "]
_FR_HINTS = [" le ", " la ", " les ", " des ", " est ", " vous ", " pour ", " avec "]


@dataclass
class Result:
    category: str
    subcategory: str
    score: float
    sentiment: str
    lang: str
    matched: list[str]


def detect_language(text: str) -> str:
    low = f" {text.lower()} "
    fr = sum(low.count(h) for h in _FR_HINTS)
    en = sum(low.count(h) for h in _EN_HINTS)
    if en > fr:
        return "en"
    return "fr"


def _sentiment(low: str) -> str:
    n = sum(low.count(w) for w in _NEG)
    if n >= 3:
        return "very_negative"
    if n == 2:
        return "negative"
    if n == 1:
        return "negative"
    return "neutral"


def classify(text: str, keywords: list[str] | None = None) -> Result:
    low = " " + re.sub(r"\s+", " ", text.lower()) + " "
    best_cat = "neutral"
    best_sub = ""
    best_hits: list[str] = []
    best_count = 0

    for cat, subs in LEXICONS.items():
        cat_hits: list[str] = []
        sub_best, sub_best_n = "", 0
        for sub, words in subs.items():
            n = 0
            for w in words:
                if w in low:
                    n += 1
                    cat_hits.append(w)
            if n > sub_best_n:
                sub_best, sub_best_n = sub, n
        if len(cat_hits) > best_count:
            best_count = len(cat_hits)
            best_cat = cat
            best_sub = sub_best
            best_hits = cat_hits

    # --- Détection emoji/contexte mineur (proxénétisme / exploitation) ---
    folded = _fold(low)
    emoji_hits = [e for e in EMOJI_SEXUAL if e in text]
    minor = any(_fold(t) in folded for t in MINOR_TOKENS)
    solicit = any(_fold(t) in folded for t in SOLICIT_TOKENS)
    if minor and (solicit or emoji_hits or best_cat in ("trafficking", "child_safety")):
        score = min(0.99, 0.72 + 0.05 * len(emoji_hits))
        return Result("child_safety", "pédopiégeage / exploitation", round(score, 4),
                      "very_negative", detect_language(text),
                      sorted(set(emoji_hits)) + ["contexte_mineur"])
    if len(emoji_hits) >= 2 and (solicit or best_cat == "trafficking"):
        score = min(0.99, 0.6 + 0.06 * len(emoji_hits))
        return Result("trafficking", "proxénétisme (emojis)", round(score, 4),
                      "very_negative", detect_language(text),
                      sorted(set(emoji_hits)))

    # Boost par mots-clés ciblés (instructions de recherche de l'analyste)
    kw_hits = [k for k in (keywords or []) if k.strip() and k.strip().lower() in low]

    if best_cat == "neutral" or best_count == 0:
        if kw_hits:
            score = min(0.99, 0.55 + 0.12 * len(kw_hits))
            return Result("watch", "mot-clé surveillé", round(score, 4),
                          _sentiment(low), detect_language(text), sorted(set(kw_hits)))
        return Result("neutral", "", round(min(0.25, 0.05 * best_count), 4),
                      _sentiment(low), detect_language(text), [])

    # Score : base + gain par correspondance, borné, +bonus mots violents, +bonus mots-clés
    neg = sum(low.count(w) for w in _NEG)
    score = 0.45 + 0.16 * best_count + 0.03 * min(neg, 4) + 0.06 * len(kw_hits)
    score = max(0.0, min(0.99, score))
    return Result(best_cat, best_sub, round(score, 4),
                  _sentiment(low), detect_language(text), sorted(set(best_hits + kw_hits)))
