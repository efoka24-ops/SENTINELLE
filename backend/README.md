# SENTINELLE — Backend (FastAPI)

Backend réel : authentification + RBAC, orchestration de **scans** des réseaux
sociaux, **collecteurs** (Presse RSS en réel sans clé ; FB/X/LinkedIn/Telegram/
YouTube/Instagram/TikTok en réel dès que les clés API sont fournies, sinon démo),
**moteur NLP** de classification des menaces, **alertes**, **notifications avec
preuve**, **rapports**, **carte/heatmap**, **audit immuable**, **WebSocket** temps réel.

## Démarrage

```powershell
cd backend
uv venv --python 3.12
uv pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

API : http://127.0.0.1:8000/api/v1 · Docs interactives : `/docs`

## Comptes de démonstration (mot de passe = rôle + 123)

| E-mail | Rôle | Voit |
|--------|------|------|
| admin@sentinelle.cm | admin | tout + gestion utilisateurs |
| directeur@sentinelle.cm | director | tout + audit |
| chef@sentinelle.cm | chief | opérations + rapports + endpoints |
| analyste.sr@sentinelle.cm | analyst_sr | collecte, analyse, scan, alertes, rapports |
| analyste.jr@sentinelle.cm | analyst_jr | dashboard, carte, alertes, signalements |
| auditeur@sentinelle.cm | auditor | audit + rapports (lecture) |

## Collecte réelle des réseaux sociaux

Copier `.env.example` → `.env` et renseigner les clés. Sans clé, le connecteur
tourne en **mode démo** ; la **Presse (RSS)** est toujours réelle.

- `TWITTER_BEARER_TOKEN` → X/Twitter API v2 (recherche récente, réelle)
- `YOUTUBE_API_KEY` → YouTube Data API v3 (réelle)
- `FACEBOOK_ACCESS_TOKEN`, `LINKEDIN_ACCESS_TOKEN`, `TELEGRAM_API_ID/HASH` →
  adaptateurs prêts (collecte réelle = OAuth/app review/session à finaliser).

## Endpoints principaux (`/api/v1`)

- `POST /auth/login`, `GET /auth/me`, `GET /users`, `POST /users`
- `GET /scans/platforms`, `POST /scans` (platforms, region, **keywords**, limit), `GET /scans/{id}`
- `GET /contents`, `GET /contents/{id}`, `GET /alerts`, `GET /map/heatmap`
- `POST /notify` (notification + **preuve** : réseau, auteur, heure, lien, discours)
- `POST /reports/generate` (synthèse, destinataires, e-mail, **planification** cron)
- `GET /audit/logs`, `GET /threat-actors`, `POST /public/citizen-reports`
- `WS /ws` (alertes & progression de scan en temps réel)

## Architecture

```
app/
├── main.py            assemblage FastAPI + CORS + WebSocket
├── config.py          env / clés API
├── db.py models.py    SQLAlchemy (SQLite par défaut)
├── security.py rbac.py  JWT + PBKDF2 + permissions par rôle
├── nlp/               classifieur lexical + gazetier Cameroun (géoloc)
├── collectors/        press (réel) + social (adaptateurs) + registry
├── services/scan.py   orchestration collecte → NLP → alertes (async)
└── routers/           auth_users · scans · data
```
