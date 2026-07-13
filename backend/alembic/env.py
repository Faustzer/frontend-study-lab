import asyncio

from alembic import context
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import get_settings
from app.database import Base
from app.models import User, UserProgress

config = context.config
# Settings normalize postgres:// URLs (as handed out by Railway/Render)
# to postgresql+asyncpg:// — reading os.environ directly here would
# make SQLAlchemy look for psycopg2, which is not installed.
config.set_main_option("sqlalchemy.url", get_settings().database_url)

target_metadata = Base.metadata
# Import models above for their side effect of registering tables on
# Base.metadata, which autogenerate needs — reference them so they aren't
# flagged as unused imports.
assert User and UserProgress


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
