"""Point d'entrée FastAPI — SENTINELLE backend."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import SessionLocal, init_db
from .routers import auth_users, data, scans
from .seed import seed
from .ws import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title="SENTINELLE API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_users.router, prefix="/api/v1")
app.include_router(scans.router, prefix="/api/v1")
app.include_router(data.router, prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "service": "sentinelle-api"}


@app.websocket("/api/v1/ws")
async def ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # garde la connexion ouverte
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
