from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    pass


# Small pool: the whole service must fit a ~1 GB free-tier instance
# and free-tier Postgres caps connections aggressively.
# (SQLite — used in tests — does not take pool sizing arguments.)
_url = get_settings().database_url
_pool_kwargs = (
    {"pool_size": 3, "max_overflow": 2, "pool_pre_ping": True}
    if _url.startswith("postgresql")
    else {}
)
engine = create_async_engine(_url, **_pool_kwargs)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with async_session() as session:
        yield session
