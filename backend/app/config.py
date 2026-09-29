import logging
from functools import lru_cache
from urllib.parse import urlparse

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

DEFAULT_JWT_SECRET = "change-me-in-production"
# RFC 7518 §3.2: HS256 keys should be at least 256 bits
MIN_JWT_SECRET_LENGTH = 32
_LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://studylab:studylab@localhost:5432/studylab"

    @field_validator("database_url")
    @classmethod
    def _force_asyncpg_scheme(cls, url: str) -> str:
        """Hosting platforms (Railway, Render, Heroku) hand out
        postgres:// or postgresql:// URLs; SQLAlchemy needs the
        async driver spelled out."""
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+asyncpg://" + url[len(prefix):]
        return url

    jwt_secret: str = DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_expires_days: int = 7

    # Where to send the user after a successful OAuth callback
    frontend_url: str = "http://localhost:5173"

    allowed_origins: str = "http://localhost:5173,http://localhost:5174"

    google_client_id: str = ""
    google_client_secret: str = ""
    twitch_client_id: str = ""
    twitch_client_secret: str = ""
    discord_client_id: str = ""
    discord_client_secret: str = ""

    # Enables POST /api/auth/dev-login (mock user without OAuth).
    # Never enable in production.
    dev_login_enabled: bool = False

    @property
    def is_local(self) -> bool:
        """True when the frontend runs on this machine (dev, e2e, tests)."""
        return urlparse(self.frontend_url).hostname in _LOCAL_HOSTS

    @model_validator(mode="after")
    def _check_deployment_secrets(self) -> "Settings":
        """Refuse to run a deployed instance with the placeholder JWT
        secret: anyone could forge tokens for any user."""
        if self.is_local:
            return self
        if self.jwt_secret == DEFAULT_JWT_SECRET:
            raise ValueError("JWT_SECRET must be set for a non-local deployment")
        if len(self.jwt_secret) < MIN_JWT_SECRET_LENGTH:
            # Constant message: passing anything secret-derived to the
            # logger is flagged by CodeQL (py/clear-text-logging)
            logger.warning("JWT_SECRET is shorter than 32 characters; use a longer random value")
        if self.dev_login_enabled:
            logger.warning("DEV_LOGIN_ENABLED is on for a non-local deployment")
        return self

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
