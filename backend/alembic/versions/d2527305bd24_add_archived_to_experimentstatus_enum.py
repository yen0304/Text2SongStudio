"""add_archived_to_experimentstatus_enum

Revision ID: d2527305bd24
Revises: d36bf90e4782
Create Date: 2026-01-26 01:09:50.171989

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2527305bd24'
down_revision: Union[str, None] = 'd36bf90e4782'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'ARCHIVED' value to the experimentstatus enum (uppercase to match existing values)
    op.execute("ALTER TYPE experimentstatus ADD VALUE IF NOT EXISTS 'ARCHIVED'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type which is complex
    # For safety, we leave this as a no-op
    pass
