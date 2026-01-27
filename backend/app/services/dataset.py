import json
import os
from pathlib import Path

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.config import get_settings
from app.models import (
    AudioSample,
    AudioTag,
    Dataset,
    DatasetType,
    PreferencePair,
    Prompt,
    QualityRating,
)
from app.schemas import DatasetFilterQuery
from app.services.storage import StorageService

settings = get_settings()

# Backend root directory for resolving paths
BACKEND_ROOT = Path(__file__).parents[2]


class DatasetService:
    """Service for dataset export and statistics.

    Uses industry-standard RLHF feedback tables:
    - QualityRating: For SFT (Supervised Fine-Tuning) data
    - PreferencePair: For DPO/RLHF preference learning
    - AudioTag: For filtering and categorization
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = StorageService()

    def _build_quality_filter(self, filter_query: DatasetFilterQuery | None):
        """Build filter conditions for QualityRating queries."""
        conditions = []

        if filter_query:
            if filter_query.min_rating is not None:
                conditions.append(QualityRating.rating >= filter_query.min_rating)
            if filter_query.max_rating is not None:
                conditions.append(QualityRating.rating <= filter_query.max_rating)
            if filter_query.adapter_id:
                conditions.append(AudioSample.adapter_id == filter_query.adapter_id)
            if filter_query.user_id:
                conditions.append(QualityRating.user_id == filter_query.user_id)
            if filter_query.start_date:
                conditions.append(QualityRating.created_at >= filter_query.start_date)
            if filter_query.end_date:
                conditions.append(QualityRating.created_at <= filter_query.end_date)

        return conditions

    def _build_preference_filter(self, filter_query: DatasetFilterQuery | None):
        """Build filter conditions for PreferencePair queries."""
        conditions = []

        if filter_query:
            if filter_query.adapter_id:
                # Filter by adapter used in chosen audio
                ChosenAudio = aliased(AudioSample)
                conditions.append(ChosenAudio.adapter_id == filter_query.adapter_id)
            if filter_query.user_id:
                conditions.append(PreferencePair.user_id == filter_query.user_id)
            if filter_query.start_date:
                conditions.append(PreferencePair.created_at >= filter_query.start_date)
            if filter_query.end_date:
                conditions.append(PreferencePair.created_at <= filter_query.end_date)

        return conditions

    async def count_samples(
        self,
        dataset_type: DatasetType,
        filter_query: DatasetFilterQuery | None,
    ) -> int:
        """Count samples using the new industry-standard tables."""
        if dataset_type == DatasetType.SUPERVISED:
            # Count quality ratings
            conditions = self._build_quality_filter(filter_query)
            query = select(func.count(QualityRating.id)).join(
                AudioSample, QualityRating.audio_id == AudioSample.id
            )
            if conditions:
                query = query.where(and_(*conditions))
        else:
            # Count preference pairs
            conditions = self._build_preference_filter(filter_query)
            query = select(func.count(PreferencePair.id))
            if conditions:
                query = query.where(and_(*conditions))

        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_supervised_samples(
        self,
        filter_query: DatasetFilterQuery | None,
    ):
        """Get supervised training samples from QualityRating table."""
        conditions = self._build_quality_filter(filter_query)

        # Use 'overall' criterion for main quality rating, or get best rating per audio
        query = (
            select(QualityRating, AudioSample, Prompt)
            .join(AudioSample, QualityRating.audio_id == AudioSample.id)
            .join(Prompt, AudioSample.prompt_id == Prompt.id)
            .where(QualityRating.criterion == "overall")  # Main quality metric
        )

        if conditions:
            query = query.where(and_(*conditions))

        result = await self.db.execute(query)
        return result.all()

    async def get_preference_samples(
        self,
        filter_query: DatasetFilterQuery | None,
    ):
        """Get preference pairs for DPO/RLHF training."""
        conditions = self._build_preference_filter(filter_query)

        ChosenAudio = aliased(AudioSample)
        RejectedAudio = aliased(AudioSample)

        query = (
            select(PreferencePair, ChosenAudio, RejectedAudio, Prompt)
            .join(ChosenAudio, PreferencePair.chosen_audio_id == ChosenAudio.id)
            .join(RejectedAudio, PreferencePair.rejected_audio_id == RejectedAudio.id)
            .join(Prompt, PreferencePair.prompt_id == Prompt.id)
        )

        if conditions:
            query = query.where(and_(*conditions))

        result = await self.db.execute(query)
        return result.all()

    async def export_dataset(
        self,
        dataset: Dataset,
        format: str = "huggingface",
        output_path: str | None = None,
    ) -> str:
        filter_query = None
        if dataset.filter_query:
            filter_query = DatasetFilterQuery(**dataset.filter_query)

        output_dir = output_path or f"./exports/{dataset.id}"
        os.makedirs(output_dir, exist_ok=True)

        if dataset.type == DatasetType.SUPERVISED:
            return await self._export_supervised(
                dataset, filter_query, output_dir, format
            )
        else:
            return await self._export_preference(
                dataset, filter_query, output_dir, format
            )

    async def _download_audio_file(self, storage_path: str, output_dir: str) -> str:
        """Download audio file from S3 to local directory for training.

        Returns the absolute local path to the downloaded file.
        """
        # Create audio subdirectory
        audio_dir = os.path.join(output_dir, "audio")
        os.makedirs(audio_dir, exist_ok=True)

        # Use the original filename from storage path
        filename = os.path.basename(storage_path)
        local_path = os.path.join(audio_dir, filename)

        # Skip if already downloaded
        if os.path.exists(local_path):
            return os.path.abspath(local_path)

        # Download from S3
        try:
            audio_data = await self.storage.download_file(storage_path)
            with open(local_path, "wb") as f:
                f.write(audio_data)
        except Exception as e:
            raise RuntimeError(f"Failed to download audio from S3: {storage_path}: {e}")

        return os.path.abspath(local_path)

    async def _export_supervised(
        self,
        _dataset: Dataset,
        filter_query: DatasetFilterQuery | None,
        output_dir: str,
        format: str,
    ) -> str:
        """Export supervised training data using QualityRating table."""
        samples = await self.get_supervised_samples(filter_query)

        if format == "json":
            data = []
            for rating, audio, prompt in samples:
                # Download audio from S3 to local for training
                local_audio_path = await self._download_audio_file(
                    audio.storage_path, output_dir
                )

                # Get tags for this audio
                tag_result = await self.db.execute(
                    select(AudioTag).where(AudioTag.audio_id == audio.id)
                )
                tags = tag_result.scalars().all()
                positive_tags = [t.tag for t in tags if t.is_positive]
                negative_tags = [t.tag for t in tags if not t.is_positive]

                data.append(
                    {
                        "prompt_id": str(audio.prompt_id),
                        "prompt_text": prompt.text,
                        "prompt_attributes": prompt.attributes,
                        "audio_id": str(audio.id),
                        "audio_path": local_audio_path,
                        "rating": rating.rating,
                        "criterion": rating.criterion,
                        "positive_tags": positive_tags,
                        "negative_tags": negative_tags,
                        "adapter_id": str(audio.adapter_id)
                        if audio.adapter_id
                        else None,
                    }
                )

            output_file = os.path.join(output_dir, "dataset.json")
            with open(output_file, "w") as f:
                json.dump(data, f, indent=2)

            return output_file

        elif format == "huggingface":
            # Export as Hugging Face dataset format
            data = {
                "prompt": [],
                "audio_path": [],
                "rating": [],
                "positive_tags": [],
                "negative_tags": [],
            }

            for rating, audio, prompt in samples:
                # Download audio from S3 to local for training
                local_audio_path = await self._download_audio_file(
                    audio.storage_path, output_dir
                )

                # Get tags for this audio
                tag_result = await self.db.execute(
                    select(AudioTag).where(AudioTag.audio_id == audio.id)
                )
                tags = tag_result.scalars().all()

                data["prompt"].append(prompt.text)
                data["audio_path"].append(local_audio_path)
                data["rating"].append(rating.rating)
                data["positive_tags"].append([t.tag for t in tags if t.is_positive])
                data["negative_tags"].append([t.tag for t in tags if not t.is_positive])

            # Save as JSON lines for HF compatibility
            output_file = os.path.join(output_dir, "train.jsonl")
            with open(output_file, "w") as f:
                for i in range(len(data["prompt"])):
                    row = {k: v[i] for k, v in data.items()}
                    f.write(json.dumps(row) + "\n")

            return output_dir

        return output_dir

    async def _export_preference(
        self,
        _dataset: Dataset,
        filter_query: DatasetFilterQuery | None,
        output_dir: str,
        _format: str,
    ) -> str:
        """Export preference pairs for DPO/RLHF training."""
        samples = await self.get_preference_samples(filter_query)

        data = []
        for pair, chosen_audio, rejected_audio, prompt in samples:
            # Download audio files from S3 to local for training
            chosen_local_path = await self._download_audio_file(
                chosen_audio.storage_path, output_dir
            )
            rejected_local_path = await self._download_audio_file(
                rejected_audio.storage_path, output_dir
            )

            data.append(
                {
                    "prompt": prompt.text,
                    "prompt_id": str(prompt.id),
                    "chosen_path": chosen_local_path,
                    "rejected_path": rejected_local_path,
                    "chosen_id": str(chosen_audio.id),
                    "rejected_id": str(rejected_audio.id),
                    "margin": pair.margin,  # Confidence/strength of preference
                }
            )

        output_file = os.path.join(output_dir, "preferences.jsonl")
        with open(output_file, "w") as f:
            for row in data:
                f.write(json.dumps(row) + "\n")

        return output_dir

    async def get_stats(self, dataset: Dataset) -> dict:
        """Get dataset statistics using new industry-standard tables."""
        filter_query = None
        if dataset.filter_query:
            filter_query = DatasetFilterQuery(**dataset.filter_query)

        if dataset.type == DatasetType.SUPERVISED:
            return await self._get_supervised_stats(filter_query)
        else:
            return await self._get_preference_stats(filter_query)

    async def _get_supervised_stats(
        self, filter_query: DatasetFilterQuery | None
    ) -> dict:
        """Get statistics for supervised (SFT) datasets."""
        conditions = self._build_quality_filter(filter_query)

        # Rating distribution
        rating_query = (
            select(QualityRating.rating, func.count(QualityRating.id))
            .join(AudioSample, QualityRating.audio_id == AudioSample.id)
            .where(QualityRating.criterion == "overall")
            .group_by(QualityRating.rating)
        )
        if conditions:
            rating_query = rating_query.where(and_(*conditions))

        rating_result = await self.db.execute(rating_query)
        rating_distribution = {str(r): c for r, c in rating_result.all()}

        # Unique prompts
        prompt_query = select(func.count(func.distinct(AudioSample.prompt_id))).join(
            QualityRating, QualityRating.audio_id == AudioSample.id
        )
        if conditions:
            prompt_query = prompt_query.where(and_(*conditions))

        prompt_result = await self.db.execute(prompt_query)
        unique_prompts = prompt_result.scalar() or 0

        # Unique adapters
        adapter_query = (
            select(func.count(func.distinct(AudioSample.adapter_id)))
            .join(QualityRating, QualityRating.audio_id == AudioSample.id)
            .where(AudioSample.adapter_id.isnot(None))
        )
        if conditions:
            adapter_query = adapter_query.where(and_(*conditions))

        adapter_result = await self.db.execute(adapter_query)
        unique_adapters = adapter_result.scalar() or 0

        # Tag frequency from new AudioTag table
        tag_query = (
            select(AudioTag.tag, AudioTag.is_positive, func.count(AudioTag.id))
            .join(AudioSample, AudioTag.audio_id == AudioSample.id)
            .join(QualityRating, QualityRating.audio_id == AudioSample.id)
            .group_by(AudioTag.tag, AudioTag.is_positive)
        )

        tag_result = await self.db.execute(tag_query)
        positive_tags = {}
        negative_tags = {}
        for tag, is_positive, count in tag_result.all():
            if is_positive:
                positive_tags[tag] = count
            else:
                negative_tags[tag] = count

        return {
            "rating_distribution": rating_distribution,
            "unique_prompts": unique_prompts,
            "unique_adapters": unique_adapters,
            "positive_tag_frequency": positive_tags,
            "negative_tag_frequency": negative_tags,
        }

    async def _get_preference_stats(
        self, filter_query: DatasetFilterQuery | None
    ) -> dict:
        """Get statistics for preference (DPO/RLHF) datasets."""
        conditions = self._build_preference_filter(filter_query)

        # Total pairs
        count_query = select(func.count(PreferencePair.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        count_result = await self.db.execute(count_query)
        total_pairs = count_result.scalar() or 0

        # Unique prompts
        prompt_query = select(func.count(func.distinct(PreferencePair.prompt_id)))
        if conditions:
            prompt_query = prompt_query.where(and_(*conditions))
        prompt_result = await self.db.execute(prompt_query)
        unique_prompts = prompt_result.scalar() or 0

        # Margin distribution (confidence of preferences)
        margin_query = select(
            func.avg(PreferencePair.margin),
            func.min(PreferencePair.margin),
            func.max(PreferencePair.margin),
        ).where(PreferencePair.margin.isnot(None))
        if conditions:
            margin_query = margin_query.where(and_(*conditions))
        margin_result = await self.db.execute(margin_query)
        margin_row = margin_result.first()

        return {
            "total_pairs": total_pairs,
            "unique_prompts": unique_prompts,
            "avg_margin": float(margin_row[0])
            if margin_row and margin_row[0]
            else None,
            "min_margin": float(margin_row[1])
            if margin_row and margin_row[1]
            else None,
            "max_margin": float(margin_row[2])
            if margin_row and margin_row[2]
            else None,
        }
