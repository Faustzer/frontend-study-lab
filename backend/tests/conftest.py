import os

# Configure BEFORE app modules are imported: tests run on in-memory
# SQLite and enable the dev-login endpoint.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
os.environ["JWT_SECRET"] = "test-secret-0123456789abcdef0123456789abcdef"
os.environ["DEV_LOGIN_ENABLED"] = "true"
# Explicitly blank OAuth credentials: env vars take precedence over a
# developer's backend/.env, so tests never see real provider config.
for _provider in ("GOOGLE", "TWITCH", "DISCORD"):
    os.environ[f"{_provider}_CLIENT_ID"] = ""
    os.environ[f"{_provider}_CLIENT_SECRET"] = ""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture
async def db_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest.fixture
async def client(db_engine):
    factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def auth_client(client):
    """Client with a valid Bearer token for a dev user."""
    resp = await client.post("/api/auth/dev-login")
    data = resp.json()["data"]
    client.headers["Authorization"] = f"Bearer {data['token']}"
    client.user = data["user"]
    return client
