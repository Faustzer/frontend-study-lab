import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Serializes with camelCase keys to match the frontend API types."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class UserOut(CamelModel):
    id: uuid.UUID
    email: str
    display_name: str
    avatar_url: str
    provider: str
    created_at: datetime
