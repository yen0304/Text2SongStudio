"""add_soft_delete_columns

Revision ID: c25ae89d3671
Revises: b14ae68c2560
Create Date: 2026-01-25

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c25ae89d3671"
down_revision: Union[str, None] = "b14ae68c2560"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add deleted_at column to generation_jobs table
    op.add_column(
        "generation_jobs",
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "ix_generation_jobs_deleted_at",
        "generation_jobs",
        ["deleted_at"],
        unique=False,
    )

    # Add deleted_at column to adapters table
    op.add_column(
        "adapters",
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "ix_adapters_deleted_at",
        "adapters",
        ["deleted_at"],
        unique=False,
    )


def downgrade() -> None:
    # Remove deleted_at from adapters table
    op.drop_index("ix_adapters_deleted_at", table_name="adapters")
    op.drop_column("adapters", "deleted_at")

    # Remove deleted_at from generation_jobs table
    op.drop_index("ix_generation_jobs_deleted_at", table_name="generation_jobs")
    op.drop_column("generation_jobs", "deleted_at")
