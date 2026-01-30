"""add_system_settings_table

Revision ID: 9269ea09f027
Revises: e47cf91a5893
Create Date: 2026-01-30 23:41:21.055566

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9269ea09f027'
down_revision: Union[str, None] = 'e47cf91a5893'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create system_settings table for key-value configuration storage."""
    op.create_table('system_settings',
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('key')
    )


def downgrade() -> None:
    """Drop system_settings table."""
    op.drop_table('system_settings')
