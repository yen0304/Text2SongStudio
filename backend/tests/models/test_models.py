"""Tests for model __repr__ methods and constants."""

from uuid import uuid4


class TestAudioTagModel:
    """Tests for AudioTag model."""

    def test_repr_positive_tag(self):
        """Test AudioTag __repr__ for positive tag."""
        from app.models.audio_tag import AudioTag

        tag = AudioTag(
            id=uuid4(),
            audio_id=uuid4(),
            tag="good_melody",
            is_positive=True,
        )

        repr_str = repr(tag)

        assert "AudioTag" in repr_str
        assert "+good_melody" in repr_str

    def test_repr_negative_tag(self):
        """Test AudioTag __repr__ for negative tag."""
        from app.models.audio_tag import AudioTag

        tag = AudioTag(
            id=uuid4(),
            audio_id=uuid4(),
            tag="noisy",
            is_positive=False,
        )

        repr_str = repr(tag)

        assert "AudioTag" in repr_str
        assert "-noisy" in repr_str


class TestAudioTagConstants:
    """Tests for AudioTag constants."""

    def test_positive_tags_defined(self):
        """Test POSITIVE_TAGS constant is defined."""
        from app.models.audio_tag import POSITIVE_TAGS

        assert isinstance(POSITIVE_TAGS, list)
        assert len(POSITIVE_TAGS) > 0
        assert "good_melody" in POSITIVE_TAGS
        assert "high_quality" in POSITIVE_TAGS

    def test_negative_tags_defined(self):
        """Test NEGATIVE_TAGS constant is defined."""
        from app.models.audio_tag import NEGATIVE_TAGS

        assert isinstance(NEGATIVE_TAGS, list)
        assert len(NEGATIVE_TAGS) > 0
        assert "noisy" in NEGATIVE_TAGS
        assert "distorted" in NEGATIVE_TAGS

    def test_all_tags_defined(self):
        """Test ALL_TAGS constant contains all tags."""
        from app.models.audio_tag import ALL_TAGS, NEGATIVE_TAGS, POSITIVE_TAGS

        assert isinstance(ALL_TAGS, list)
        assert len(ALL_TAGS) == len(POSITIVE_TAGS) + len(NEGATIVE_TAGS)
        for tag in POSITIVE_TAGS:
            assert tag in ALL_TAGS
        for tag in NEGATIVE_TAGS:
            assert tag in ALL_TAGS


class TestPreferencePairModel:
    """Tests for PreferencePair model."""

    def test_repr(self):
        """Test PreferencePair __repr__."""
        from app.models.preference_pair import PreferencePair

        prompt_id = uuid4()
        chosen_id = uuid4()
        rejected_id = uuid4()

        pair = PreferencePair(
            id=uuid4(),
            prompt_id=prompt_id,
            chosen_audio_id=chosen_id,
            rejected_audio_id=rejected_id,
        )

        repr_str = repr(pair)

        assert "PreferencePair" in repr_str
        assert str(prompt_id) in repr_str
        assert str(chosen_id) in repr_str
        assert str(rejected_id) in repr_str


class TestQualityRatingModel:
    """Tests for QualityRating model."""

    def test_repr(self):
        """Test QualityRating __repr__."""
        from app.models.quality_rating import QualityRating

        audio_id = uuid4()

        rating = QualityRating(
            id=uuid4(),
            audio_id=audio_id,
            rating=4.5,
            criterion="overall",
        )

        repr_str = repr(rating)

        assert "QualityRating" in repr_str
        assert str(audio_id) in repr_str
        assert "4.5" in repr_str
        assert "overall" in repr_str
