import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.catalog import challenge_xp, module_xp
from app.models import UserProgress
from app.schemas import ProgressOut


def xp_for_level(level: int) -> int:
    """XP needed to finish level N — mirrors the frontend formula."""
    return int(100 * 1.5 ** (level - 1))


def split_total_xp(total_xp: int) -> "tuple[int, int]":
    """Convert total XP into (level, xp within that level)."""
    level = 1
    xp = total_xp
    while xp >= xp_for_level(level):
        xp -= xp_for_level(level)
        level += 1
    return level, xp


def to_progress_out(row: UserProgress) -> ProgressOut:
    level, xp = split_total_xp(row.total_xp)
    return ProgressOut(
        xp=xp,
        level=level,
        completed_modules=row.completed_modules,
        completed_challenges=row.completed_challenges,
    )


async def get_or_create_progress(db: AsyncSession, user_id: uuid.UUID) -> UserProgress:
    row = await db.scalar(select(UserProgress).where(UserProgress.user_id == user_id))
    if row is None:
        row = UserProgress(
            user_id=user_id, total_xp=0, completed_modules=[], completed_challenges={}
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


async def complete_module(db: AsyncSession, user_id: uuid.UUID, module_slug: str) -> UserProgress:
    """Idempotent: completing an already-completed module changes nothing.
    XP comes from the server catalog; unknown modules award nothing but
    are still recorded so the client and server sets stay in sync."""
    row = await get_or_create_progress(db, user_id)
    if module_slug in row.completed_modules:
        return row

    row.completed_modules = [*row.completed_modules, module_slug]
    row.total_xp += module_xp(module_slug) or 0
    await db.commit()
    await db.refresh(row)
    return row


async def complete_challenge(
    db: AsyncSession, user_id: uuid.UUID, module_slug: str, challenge_id: str, requested_xp: int
) -> UserProgress:
    row = await get_or_create_progress(db, user_id)
    done = row.completed_challenges.get(module_slug, [])
    if challenge_id in done:
        return row

    row.completed_challenges = {**row.completed_challenges, module_slug: [*done, challenge_id]}
    flag_modified(row, "completed_challenges")
    row.total_xp += challenge_xp(requested_xp)
    await db.commit()
    await db.refresh(row)
    return row
