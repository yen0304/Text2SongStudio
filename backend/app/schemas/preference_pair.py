"""Schemas for Preference Pairs (DPO/RLHF training data)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class PreferencePairCreate(BaseModel):
    """Create a preference pair - indicating which audio is better."""

    prompt_id: UUID = Field(
        ..., description="The prompt both audios were generated from"
    )
    chosen_audio_id: UUID = Field(..., description="The preferred/better audio")
    rejected_audio_id: UUID = Field(..., description="The rejected/worse audio")
    margin: float | None = Field(
        None,
        ge=1,
        le=5,
        description="How much better is chosen vs rejected (1=slightly, 5=much better)",
    )
    notes: str | None = None

    @model_validator(mode="after")
    def validate_different_audios(self):
        if self.chosen_audio_id == self.rejected_audio_id:
            raise ValueError("chosen_audio_id and rejected_audio_id must be different")
        return self


class PreferencePairResponse(BaseModel):
    """Response for a preference pair."""

    id: UUID
    prompt_id: UUID
    chosen_audio_id: UUID
    rejected_audio_id: UUID
    user_id: UUID | None
    margin: float | None
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class PreferencePairWithDetails(PreferencePairResponse):
    """Preference pair with prompt text for display."""

    prompt_text: str | None = None
    chosen_audio_path: str | None = None
    rejected_audio_path: str | None = None


class PreferencePairListResponse(BaseModel):
    """Paginated list of preference pairs."""

    items: list[PreferencePairResponse]
    total: int


class PreferencePairStats(BaseModel):
    """Statistics for preference pairs."""

    total_pairs: int
    unique_prompts: int
    unique_audios: int
    average_margin: float | None
    # How often each audio was chosen vs rejected
    audio_win_rates: dict[str, float] | None = None
