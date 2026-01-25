import json
import os

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import AudioSample, Dataset, DatasetType, Feedback, Prompt
from app.schemas import DatasetFilterQuery
from app.services.storage import StorageService

settings = get_settings()


class DatasetService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = StorageService()

    def _build_filter_query(self, filter_query: DatasetFilterQuery | None):
        conditions = []

        if filter_query:
            if filter_query.min_rating is not None:
                conditions.append(Feedback.rating >= filter_query.min_rating)
            if filter_query.max_rating is not None:
                conditions.append(Feedback.rating <= filter_query.max_rating)
            if filter_query.required_tags:
                conditions.append(Feedback.tags.contains(filter_query.required_tags))
            if filter_query.excluded_tags:
                for tag in filter_query.excluded_tags:
                    conditions.append(~Feedback.tags.contains([tag]))
            if filter_query.adapter_id:
                conditions.append(AudioSample.adapter_id == filter_query.adapter_id)
            if filter_query.user_id:
                conditions.append(Feedback.user_id == filter_query.user_id)
            if filter_query.start_date:
                conditions.append(Feedback.created_at >= filter_query.start_date)
            if filter_query.end_date:
                conditions.append(Feedback.created_at <= filter_query.end_date)

        return conditions

    async def count_samples(
        self,
        dataset_type: DatasetType,
        filter_query: DatasetFilterQuery | None,
    ) -> int:
        conditions = self._build_filter_query(filter_query)

        if dataset_type == DatasetType.SUPERVISED:
            # Count samples with ratings
            query = (
                select(func.count(Feedback.id))
                .join(AudioSample, Feedback.audio_id == AudioSample.id)
                .where(Feedback.rating.isnot(None))
            )
        else:
            # Count preference pairs
            query = (
                select(func.count(Feedback.id))
                .join(AudioSample, Feedback.audio_id == AudioSample.id)
                .where(Feedback.preferred_over.isnot(None))
            )

        if conditions:
            query = query.where(and_(*conditions))

        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_supervised_samples(
        self,
        filter_query: DatasetFilterQuery | None,
    ):
        conditions = self._build_filter_query(filter_query)

        query = (
            select(Feedback, AudioSample, Prompt)
            .join(AudioSample, Feedback.audio_id == AudioSample.id)
            .join(Prompt, AudioSample.prompt_id == Prompt.id)
            .where(Feedback.rating.isnot(None))
        )

        if conditions:
            query = query.where(and_(*conditions))

        result = await self.db.execute(query)
        return result.all()

    async def get_preference_samples(
        self,
        filter_query: DatasetFilterQuery | None,
    ):
        conditions = self._build_filter_query(filter_query)

        query = (
            select(
                Feedback,
                AudioSample.alias("chosen"),
                AudioSample.alias("rejected"),
                Prompt,
            )
            .join(AudioSample, Feedback.audio_id == AudioSample.id)
            .join(Prompt, AudioSample.prompt_id == Prompt.id)
            .where(Feedback.preferred_over.isnot(None))
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

    async def _export_supervised(
        self,
        _dataset: Dataset,
        filter_query: DatasetFilterQuery | None,
        output_dir: str,
        format: str,
    ) -> str:
        samples = await self.get_supervised_samples(filter_query)

        if format == "json":
            data = []
            for feedback, audio, prompt in samples:
                data.append(
                    {
                        "prompt_id": str(audio.prompt_id),
                        "prompt_text": prompt.text,
                        "prompt_attributes": prompt.attributes,
                        "audio_id": str(audio.id),
                        "audio_path": audio.storage_path,
                        "rating": feedback.rating,
                        "tags": feedback.tags,
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
                "tags": [],
            }

            for feedback, audio, prompt in samples:
                data["prompt"].append(prompt.text)
                data["audio_path"].append(audio.storage_path)
                data["rating"].append(feedback.rating)
                data["tags"].append(feedback.tags or [])

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
        conditions = self._build_filter_query(filter_query)

        # Get preference feedback with both audio samples
        query = (
            select(Feedback, AudioSample, Prompt)
            .join(AudioSample, Feedback.audio_id == AudioSample.id)
            .join(Prompt, AudioSample.prompt_id == Prompt.id)
            .where(Feedback.preferred_over.isnot(None))
        )

        if conditions:
            query = query.where(and_(*conditions))

        result = await self.db.execute(query)
        feedbacks = result.all()

        # Get rejected audio info
        rejected_ids = [f[0].preferred_over for f in feedbacks]
        rejected_result = await self.db.execute(
            select(AudioSample).where(AudioSample.id.in_(rejected_ids))
        )
        rejected_map = {a.id: a for a in rejected_result.scalars().all()}

        data = []
        for feedback, chosen_audio, prompt in feedbacks:
            rejected_audio = rejected_map.get(feedback.preferred_over)
            if rejected_audio:
                data.append(
                    {
                        "prompt": prompt.text,
                        "chosen_path": chosen_audio.storage_path,
                        "rejected_path": rejected_audio.storage_path,
                        "chosen_id": str(chosen_audio.id),
                        "rejected_id": str(rejected_audio.id),
                    }
                )

        output_file = os.path.join(output_dir, "preferences.jsonl")
        with open(output_file, "w") as f:
            for row in data:
                f.write(json.dumps(row) + "\n")

        return output_dir

    async def get_stats(self, dataset: Dataset) -> dict:
        filter_query = None
        if dataset.filter_query:
            filter_query = DatasetFilterQuery(**dataset.filter_query)

        conditions = self._build_filter_query(filter_query)

        # Rating distribution
        rating_query = (
            select(Feedback.rating, func.count(Feedback.id))
            .join(AudioSample, Feedback.audio_id == AudioSample.id)
            .where(Feedback.rating.isnot(None))
            .group_by(Feedback.rating)
        )
        if conditions:
            rating_query = rating_query.where(and_(*conditions))

        rating_result = await self.db.execute(rating_query)
        rating_distribution = {str(r): c for r, c in rating_result.all()}

        # Unique prompts
        prompt_query = select(func.count(func.distinct(AudioSample.prompt_id))).join(
            Feedback, Feedback.audio_id == AudioSample.id
        )
        if conditions:
            prompt_query = prompt_query.where(and_(*conditions))

        prompt_result = await self.db.execute(prompt_query)
        unique_prompts = prompt_result.scalar() or 0

        # Unique adapters
        adapter_query = (
            select(func.count(func.distinct(AudioSample.adapter_id)))
            .join(Feedback, Feedback.audio_id == AudioSample.id)
            .where(AudioSample.adapter_id.isnot(None))
        )
        if conditions:
            adapter_query = adapter_query.where(and_(*conditions))

        adapter_result = await self.db.execute(adapter_query)
        unique_adapters = adapter_result.scalar() or 0

        # Tag frequency
        tag_query = (
            select(Feedback.tags)
            .join(AudioSample, Feedback.audio_id == AudioSample.id)
            .where(Feedback.tags.isnot(None))
        )
        if conditions:
            tag_query = tag_query.where(and_(*conditions))

        tag_result = await self.db.execute(tag_query)
        tag_counts = {}
        for (tags,) in tag_result.all():
            if tags:
                for tag in tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1

        return {
            "rating_distribution": rating_distribution,
            "unique_prompts": unique_prompts,
            "unique_adapters": unique_adapters,
            "tag_frequency": tag_counts,
        }
