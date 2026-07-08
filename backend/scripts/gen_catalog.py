"""Generate app/data/modules.json from the frontend topics metadata.

Mirrors the frontend slug/XP logic (frontend/helpers/useTopics.ts):
slug = PascalCase .vue filename lowercased with camel-humps joined,
xp = explicit `xp` from _meta.json or a difficulty-based default.

Run from the repo root after adding/changing topic modules:
    python backend/scripts/gen_catalog.py
"""

import json
import re
from pathlib import Path

DIFFICULTY_XP = {"easy": 30, "medium": 60, "hard": 100}

REPO_ROOT = Path(__file__).resolve().parents[2]
TOPICS_DIR = REPO_ROOT / "frontend" / "topics"
OUT_FILE = REPO_ROOT / "backend" / "app" / "data" / "modules.json"


def slugify(vue_filename: str) -> str:
    name = vue_filename.removesuffix(".vue")
    return re.sub(r"([a-z])([A-Z])", r"\1-\2", name).lower().replace("-", "")


def main() -> None:
    catalog: dict[str, int] = {}
    for meta_path in sorted(TOPICS_DIR.glob("*/*/_meta.json")):
        meta = json.loads(meta_path.read_text())
        vue_files = list(meta_path.parent.glob("*.vue"))
        if not vue_files:
            continue
        slug = slugify(vue_files[0].name)
        xp = meta.get("xp", DIFFICULTY_XP.get(meta.get("difficulty", "easy"), 30))
        catalog[slug] = xp

    OUT_FILE.write_text(json.dumps(catalog, indent=2, sort_keys=True) + "\n")
    print(f"Wrote {len(catalog)} modules to {OUT_FILE}")


if __name__ == "__main__":
    main()
