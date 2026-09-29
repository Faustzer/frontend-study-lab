import pytest
from pydantic import ValidationError

from app.config import DEFAULT_JWT_SECRET, Settings


class TestDatabaseUrlNormalization:
    def test_rewrites_postgres_scheme(self):
        s = Settings(database_url="postgres://u:p@host:5432/db")
        assert s.database_url == "postgresql+asyncpg://u:p@host:5432/db"

    def test_rewrites_postgresql_scheme(self):
        s = Settings(database_url="postgresql://u:p@host:5432/db")
        assert s.database_url == "postgresql+asyncpg://u:p@host:5432/db"

    def test_keeps_asyncpg_scheme(self):
        url = "postgresql+asyncpg://u:p@host:5432/db"
        assert Settings(database_url=url).database_url == url

    def test_keeps_sqlite_scheme(self):
        url = "sqlite+aiosqlite://"
        assert Settings(database_url=url).database_url == url


class TestDeploymentSecrets:
    def test_placeholder_secret_allowed_locally(self):
        s = Settings(jwt_secret=DEFAULT_JWT_SECRET, frontend_url="http://localhost:5173")
        assert s.is_local

    def test_placeholder_secret_rejected_when_deployed(self):
        with pytest.raises(ValidationError, match="JWT_SECRET"):
            Settings(jwt_secret=DEFAULT_JWT_SECRET, frontend_url="https://study.example.com")

    def test_custom_secret_accepted_when_deployed(self):
        s = Settings(jwt_secret="x" * 40, frontend_url="https://study.example.com")
        assert not s.is_local
