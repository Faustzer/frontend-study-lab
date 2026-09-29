"""users.email is no longer unique

The same person may sign in through several OAuth providers with one
email, and Twitch/Discord may return no email at all — a unique email
turned the second such login into a 500.

Revision ID: b3c1d2e4f5a6
Revises: aa6726c11f09
Create Date: 2026-09-29 13:00:00.000000

"""
from alembic import op

revision = "b3c1d2e4f5a6"
down_revision = "aa6726c11f09"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Name assigned by PostgreSQL to the unnamed UniqueConstraint("email")
    op.drop_constraint("users_email_key", "users", type_="unique")
    op.create_index("ix_users_email", "users", ["email"])


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.create_unique_constraint("users_email_key", "users", ["email"])
