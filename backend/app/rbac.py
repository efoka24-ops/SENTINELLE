"""Rôles et permissions (RBAC) — pilotent les vues accessibles dans le back-office."""

# Permissions = "view:<clé de vue>" + actions transverses
ALL_VIEWS = [
    "dashboard", "carte", "collecte", "analyse", "alertes",
    "renseignement", "signalements", "rapports", "audit", "endpoints", "users",
]

ROLE_LABELS = {
    "analyst_jr": "Analyste junior",
    "analyst_sr": "Analyste senior",
    "chief": "Chef d'équipe",
    "director": "Directeur",
    "admin": "Administrateur",
    "auditor": "Auditeur (CEC)",
}

# Permissions par rôle. "*" = toutes.
ROLE_PERMS: dict[str, set[str]] = {
    "analyst_jr": {
        "view:dashboard", "view:carte", "view:alertes", "view:renseignement",
        "view:signalements", "alerts:ack",
    },
    "analyst_sr": {
        "view:dashboard", "view:carte", "view:collecte", "view:analyse",
        "view:alertes", "view:renseignement", "view:signalements", "view:rapports",
        "scan:launch", "alerts:ack", "alerts:write", "intel:write", "reports:generate",
    },
    "chief": {
        "view:dashboard", "view:carte", "view:collecte", "view:analyse",
        "view:alertes", "view:renseignement", "view:signalements", "view:rapports",
        "view:endpoints", "scan:launch", "alerts:ack", "alerts:write", "intel:write",
        "reports:generate", "reports:validate",
    },
    "director": {
        "view:dashboard", "view:carte", "view:collecte", "view:analyse",
        "view:alertes", "view:renseignement", "view:signalements", "view:rapports",
        "view:endpoints", "view:audit", "scan:launch", "alerts:write",
        "reports:generate", "reports:validate", "audit:read",
    },
    "admin": {"*"},
    "auditor": {"view:audit", "view:rapports", "audit:read"},
}


def perms_for(role: str) -> list[str]:
    p = ROLE_PERMS.get(role, set())
    if "*" in p:
        out = {f"view:{v}" for v in ALL_VIEWS}
        out |= {"scan:launch", "alerts:write", "alerts:ack", "intel:write",
                "reports:generate", "reports:validate", "users:manage", "audit:read"}
        return sorted(out)
    return sorted(p)


def has_perm(role: str, perm: str) -> bool:
    p = ROLE_PERMS.get(role, set())
    return "*" in p or perm in p
