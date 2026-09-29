import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.catalog import MAX_CHALLENGES_PER_MODULE, challenge_xp, module_xp
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


class UnknownModuleError(Exception):
    """The module slug is not in the server catalog."""


class ChallengeLimitError(Exception):
    """The module already has the maximum number of recorded challenges."""


def to_progress_out(row: UserProgress) -> ProgressOut:
    level, xp = split_total_xp(row.total_xp)
    return ProgressOut(
        xp=xp,
        level=level,
        completed_modules=row.completed_modules,
        completed_challenges=row.completed_challenges,
    )


async def get_or_create_progress(
    db: AsyncSession, user_id: uuid.UUID, *, for_update: bool = False
) -> UserProgress:
    """Fetch the user's progress row, creating it on first access.

    `for_update` locks the row (SELECT ... FOR UPDATE on PostgreSQL) so
    concurrent completions are serialized instead of overwriting each
    other's JSON lists and XP."""
    query = select(UserProgress).where(UserProgress.user_id == user_id)
    if for_update:
        query = query.with_for_update()
    row = await db.scalar(query)
    if row is not None:
        return row

    db.add(
        UserProgress(user_id=user_id, total_xp=0, completed_modules=[], completed_challenges={})
    )
    try:
        await db.commit()
    except IntegrityError:
        # A concurrent request created the row first — use theirs
        await db.rollback()
    created = await db.scalar(query.execution_options(populate_existing=True))
    assert created is not None
    return created


async def complete_module(db: AsyncSession, user_id: uuid.UUID, module_slug: str) -> UserProgress:
    """Idempotent: completing an already-completed module changes nothing.
    XP comes from the server catalog; unknown modules are rejected so
    arbitrary slugs can't grow the stored progress."""
    xp = module_xp(module_slug)
    if xp is None:
        raise UnknownModuleError(module_slug)

    row = await get_or_create_progress(db, user_id, for_update=True)
    # Early returns leave the lock to be released when the request's
    # session closes; a rollback here would expire `row` before it's read.
    if module_slug in row.completed_modules:
        return row

    row.completed_modules = [*row.completed_modules, module_slug]
    row.total_xp += xp
    await db.commit()
    await db.refresh(row)
    return row


async def complete_challenge(
    db: AsyncSession, user_id: uuid.UUID, module_slug: str, challenge_id: str, requested_xp: int
) -> UserProgress:
    if module_xp(module_slug) is None:
        raise UnknownModuleError(module_slug)

    row = await get_or_create_progress(db, user_id, for_update=True)
    done = row.completed_challenges.get(module_slug, [])
    if challenge_id in done:
        return row
    if len(done) >= MAX_CHALLENGES_PER_MODULE:
        await db.rollback()
        raise ChallengeLimitError(module_slug)

    row.completed_challenges = {**row.completed_challenges, module_slug: [*done, challenge_id]}
    flag_modified(row, "completed_challenges")
    row.total_xp += challenge_xp(requested_xp)
    await db.commit()
    await db.refresh(row)
    return row
