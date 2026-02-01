"""add_templates_favorites_search

Revision ID: a3f8b2c9d4e1
Revises: 9269ea09f027
Create Date: 2026-02-01 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a3f8b2c9d4e1'
down_revision: Union[str, None] = '9269ea09f027'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create prompt_templates table
    op.create_table('prompt_templates',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('attributes', sa.JSON(), nullable=True, default={}),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, default=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_prompt_templates_category', 'prompt_templates', ['category'], unique=False)
    op.create_index('ix_prompt_templates_is_system', 'prompt_templates', ['is_system'], unique=False)
    op.create_index('ix_prompt_templates_user_id', 'prompt_templates', ['user_id'], unique=False)

    # Create favorites table (polymorphic)
    op.create_table('favorites',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('target_type', sa.String(length=20), nullable=False),
        sa.Column('target_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('target_type', 'target_id', 'user_id', name='uq_favorites_target_user')
    )
    op.create_index('ix_favorites_target_type', 'favorites', ['target_type'], unique=False)
    op.create_index('ix_favorites_user_id', 'favorites', ['user_id'], unique=False)

    # Add full-text search index on prompts.text
    op.execute(
        "CREATE INDEX ix_prompts_text_search ON prompts USING GIN (to_tsvector('english', text))"
    )

    # Seed system templates
    op.execute("""
        INSERT INTO prompt_templates (id, name, description, text, attributes, category, is_system, created_at, updated_at)
        VALUES
        (gen_random_uuid(), 'Electronic Dance', 'Upbeat electronic dance music with driving beats', 
         'Energetic electronic dance music with driving beats, synth leads, and pulsing bass',
         '{"style": "electronic", "mood": "energetic", "tempo": 128}', 'electronic', true, NOW(), NOW()),
        
        (gen_random_uuid(), 'Ambient Chill', 'Relaxing ambient soundscape for focus or meditation',
         'Peaceful ambient soundscape with soft pads, gentle textures, and slow evolution',
         '{"style": "ambient", "mood": "peaceful", "tempo": 70}', 'ambient', true, NOW(), NOW()),
        
        (gen_random_uuid(), 'Cinematic Epic', 'Dramatic orchestral music for film and trailers',
         'Epic cinematic orchestral piece with dramatic strings, powerful brass, and intense percussion',
         '{"style": "classical", "mood": "dramatic", "tempo": 90}', 'cinematic', true, NOW(), NOW()),
        
        (gen_random_uuid(), 'Jazz Lounge', 'Smooth jazz for relaxed evening atmosphere',
         'Smooth jazz with mellow piano, walking bass, brushed drums, and occasional saxophone',
         '{"style": "jazz", "mood": "peaceful", "tempo": 95}', 'jazz', true, NOW(), NOW()),
        
        (gen_random_uuid(), 'Pop Upbeat', 'Catchy pop music with modern production',
         'Catchy pop track with uplifting melody, modern synths, punchy drums, and bright vocals',
         '{"style": "pop", "mood": "uplifting", "tempo": 118}', 'pop', true, NOW(), NOW()),
        
        (gen_random_uuid(), 'Classical Piano', 'Solo piano piece in classical style',
         'Elegant classical piano solo with expressive dynamics and romantic harmonies',
         '{"style": "classical", "mood": "melancholic", "tempo": 72, "primary_instruments": ["acoustic-piano"]}', 'classical', true, NOW(), NOW())
    """)


def downgrade() -> None:
    # Drop full-text search index
    op.execute("DROP INDEX IF EXISTS ix_prompts_text_search")
    
    # Drop favorites table
    op.drop_index('ix_favorites_user_id', table_name='favorites')
    op.drop_index('ix_favorites_target_type', table_name='favorites')
    op.drop_table('favorites')
    
    # Drop prompt_templates table
    op.drop_index('ix_prompt_templates_user_id', table_name='prompt_templates')
    op.drop_index('ix_prompt_templates_is_system', table_name='prompt_templates')
    op.drop_index('ix_prompt_templates_category', table_name='prompt_templates')
    op.drop_table('prompt_templates')
