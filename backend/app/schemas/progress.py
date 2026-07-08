from pydantic import Field

from app.schemas.user import CamelModel


class ProgressOut(CamelModel):
    """Mirrors the frontend `UserProgress` API type: `xp` is XP within
    the current level, not total XP."""

    xp: int
    level: int
    completed_modules: list[str]
    completed_challenges: dict[str, list[str]]


class CompleteModuleRequest(CamelModel):
    module_slug: str = Field(min_length=1, max_length=100)
    # Accepted for API compatibility but ignored: the server derives
    # module XP from its own catalog, client values are untrusted.
    xp_reward: int = 0


class CompleteChallengeRequest(CamelModel):
    module_slug: str = Field(min_length=1, max_length=100)
    challenge_id: str = Field(min_length=1, max_length=100)
    xp_reward: int = 0
