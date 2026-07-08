from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.routes import auth, progress

settings = get_settings()

app = FastAPI(title="StudyLab API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session cookie is only used by authlib to hold OAuth state
# between the login redirect and the provider callback.
app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret, max_age=600)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
