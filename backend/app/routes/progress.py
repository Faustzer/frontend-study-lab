from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, UserProgress
from app.routes.deps import get_current_user
from app.schemas import CompleteChallengeRequest, CompleteModuleRequest
from app.services import progress as progress_service

router = APIRouter()

DbDep = Annotated[AsyncSession, Depends(get_db)]
UserDep = Annotated[User, Depends(get_current_user)]


def _wrap(row: UserProgress) -> dict[str, Any]:
    # Frontend ApiClient unwraps `{ data: ... }` envelopes
    return {"data": progress_service.to_progress_out(row).model_dump(by_alias=True)}


@router.get("")
async def get_progress(user: UserDep, db: DbDep) -> dict[str, Any]:
    row = await progress_service.get_or_create_progress(db, user.id)
    return _wrap(row)


@router.post("/complete")
async def complete_module(
    body: CompleteModuleRequest, user: UserDep, db: DbDep
) -> dict[str, Any]:
    try:
        row = await progress_service.complete_module(db, user.id, body.module_slug)
    except progress_service.UnknownModuleError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown module") from None
    return _wrap(row)


@router.post("/challenge/complete")
async def complete_challenge(
    body: CompleteChallengeRequest, user: UserDep, db: DbDep
) -> dict[str, Any]:
    try:
        row = await progress_service.complete_challenge(
            db, user.id, body.module_slug, body.challenge_id, body.xp_reward
        )
    except progress_service.UnknownModuleError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown module") from None
    except progress_service.ChallengeLimitError:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Challenge limit reached for this module"
        ) from None
    return _wrap(row)
