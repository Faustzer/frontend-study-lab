import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

# Portable JSON: plain JSON on SQLite (tests), JSONB on PostgreSQL
PortableJSON = JSON().with_variant(JSONB(), "postgresql")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    # Single source of truth for XP; level and xp-within-level are derived
    total_xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_modules: Mapped[list] = mapped_column(PortableJSON, default=list, nullable=False)
    completed_challenges: Mapped[dict] = mapped_column(PortableJSON, default=dict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
