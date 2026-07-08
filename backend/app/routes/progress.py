from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.routes.deps import get_current_user
from app.schemas import CompleteChallengeRequest, CompleteModuleRequest
from app.services import progress as progress_service

router = APIRouter()

DbDep = Annotated[AsyncSession, Depends(get_db)]
UserDep = Annotated[User, Depends(get_current_user)]


def _wrap(row) -> dict:
    # Frontend ApiClient unwraps `{ data: ... }` envelopes
    return {"data": progress_service.to_progress_out(row).model_dump(by_alias=True)}


@router.get("")
async def get_progress(user: UserDep, db: DbDep) -> dict:
    row = await progress_service.get_or_create_progress(db, user.id)
    return _wrap(row)


@router.post("/complete")
async def complete_module(body: CompleteModuleRequest, user: UserDep, db: DbDep) -> dict:
    row = await progress_service.complete_module(db, user.id, body.module_slug)
    return _wrap(row)


@router.post("/challenge/complete")
async def complete_challenge(body: CompleteChallengeRequest, user: UserDep, db: DbDep) -> dict:
    row = await progress_service.complete_challenge(
        db, user.id, body.module_slug, body.challenge_id, body.xp_reward
    )
    return _wrap(row)
