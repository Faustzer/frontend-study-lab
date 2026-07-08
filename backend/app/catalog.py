"""Server-side XP catalog — the source of truth for module rewards.

Client-sent xpReward values are never trusted. Regenerate the data
file with backend/scripts/gen_catalog.py when topics change.
"""

import json
from functools import lru_cache
from pathlib import Path

_DATA_FILE = Path(__file__).parent / "data" / "modules.json"

# Challenges have no catalog yet (frontend does not ship challenge
# definitions); cap the client-sent reward instead.
CHALLENGE_XP_CAP = 50


@lru_cache
def module_catalog() -> dict:
    return json.loads(_DATA_FILE.read_text())


def module_xp(slug: str) -> "int | None":
    """XP for a module, or None if the module is unknown."""
    return module_catalog().get(slug)


def challenge_xp(requested: int) -> int:
    return max(0, min(requested, CHALLENGE_XP_CAP))
