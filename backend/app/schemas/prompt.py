from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

ALLOWED_INSTRUMENTS = [
    # Keys
    "acoustic-piano",
    "electric-piano",
    "organ",
    "clavinet",
    "celesta",
    # Strings - Plucked / Bowed
    "acoustic-guitar",
    "electric-guitar-clean",
    "electric-guitar-distorted",
    "bass-guitar",
    "synth-bass",
    "violin",
    "viola",
    "cello",
    "double-bass",
    "harp",
    # Drums & Percussion
    "acoustic-drum-kit",
    "electronic-drum-kit",
    "lofi-drum-kit",
    "808-drums",
    "909-drums",
    "kick-drum",
    "snare-drum",
    "hi-hat",
    "cymbals",
    "toms",
    # Woodwind & Brass
    "saxophone",
    "trumpet",
    "trombone",
    "french-horn",
    "flute",
    "piccolo",
    "clarinet",
    "oboe",
    "bassoon",
    # Synths & Electronic
    "analog-synth-lead",
    "analog-synth-pad",
    "digital-synth",
    "fm-synth",
    "mono-synth-bass",
    "poly-synth",
    "arpeggiator-synth",
    # World / Ethnic
    "acoustic-strings-ensemble",
    "taiko-drums",
    "kalimba",
    "sitar",
    "shamisen",
    "erhu",
    # Texture / FX / Vocal-like
    "vocal-pad",
    "choir",
    "breath-fx",
    "vinyl-noise",
    "tape-saturation",
    "ambient-noise",
]


def _validate_instruments(v: list[str] | None) -> list[str] | None:
    if v is None:
        return v
    invalid = [inst for inst in v if inst not in ALLOWED_INSTRUMENTS]
    if invalid:
        raise ValueError(
            f"Invalid instruments: {invalid}. Allowed: {ALLOWED_INSTRUMENTS}"
        )
    return v


class PromptAttributes(BaseModel):
    style: str | None = None
    tempo: int | None = Field(None, ge=40, le=200)
    primary_instruments: list[str] | None = None
    secondary_instruments: list[str] | None = None
    mood: str | None = None
    duration: int | None = Field(None, ge=1)  # No max limit, user chooses freely

    @field_validator("primary_instruments")
    @classmethod
    def validate_primary_instruments(cls, v: list[str] | None) -> list[str] | None:
        return _validate_instruments(v)

    @field_validator("secondary_instruments")
    @classmethod
    def validate_secondary_instruments(cls, v: list[str] | None) -> list[str] | None:
        return _validate_instruments(v)


class PromptCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    attributes: PromptAttributes | None = None

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        return v.strip()


class PromptResponse(BaseModel):
    id: UUID
    text: str
    attributes: dict | None
    created_at: datetime
    audio_sample_ids: list[UUID] = []

    class Config:
        from_attributes = True


class PromptListResponse(BaseModel):
    items: list[PromptResponse]
    total: int
    page: int
    limit: int
