"""add_dataset_deleted_at

Revision ID: d36bf90e4782
Revises: c25ae89d3671
Create Date: 2026-01-26

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d36bf90e4782"
down_revision: Union[str, None] = "c25ae89d3671"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add deleted_at column to datasets table
    op.add_column(
        "datasets",
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "ix_datasets_deleted_at",
        "datasets",
        ["deleted_at"],
        unique=False,
    )


def downgrade() -> None:
    # Remove deleted_at from datasets table
    op.drop_index("ix_datasets_deleted_at", table_name="datasets")
    op.drop_column("datasets", "deleted_at")
