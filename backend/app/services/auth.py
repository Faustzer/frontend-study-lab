import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


async def upsert_oauth_user(
    db: AsyncSession,
    *,
    provider: str,
    provider_id: str,
    email: str,
    display_name: str,
    avatar_url: str,
) -> User:
    """Find a user by (provider, provider_id) or create one; refresh
    profile fields that may have changed at the provider."""
    user = await db.scalar(
        select(User).where(User.provider == provider, User.provider_id == provider_id)
    )
    if user is None:
        user = User(
            provider=provider,
            provider_id=provider_id,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
        )
        db.add(user)
    else:
        user.email = email
        user.display_name = display_name
        user.avatar_url = avatar_url

    await db.commit()
    await db.refresh(user)
    return user


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> "User | None":
    return await db.get(User, user_id)
