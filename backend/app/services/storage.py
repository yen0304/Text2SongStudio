import io
import boto3
from botocore.exceptions import ClientError
from app.config import get_settings

settings = get_settings()


class StorageService:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
        )
        self.bucket = settings.s3_bucket_name

    async def ensure_bucket_exists(self):
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError:
            self.client.create_bucket(Bucket=self.bucket)

    async def upload_file(self, key: str, data: bytes, content_type: str = "audio/wav"):
        await self.ensure_bucket_exists()
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"s3://{self.bucket}/{key}"

    async def download_file(self, key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    async def stream_file(self, key: str, chunk_size: int = 8192):
        # Handle both full S3 path and key-only
        if key.startswith("s3://"):
            key = key.split("/", 3)[-1]

        response = self.client.get_object(Bucket=self.bucket, Key=key)
        body = response["Body"]

        while True:
            chunk = body.read(chunk_size)
            if not chunk:
                break
            yield chunk

    async def delete_file(self, key: str):
        if key.startswith("s3://"):
            key = key.split("/", 3)[-1]
        self.client.delete_object(Bucket=self.bucket, Key=key)

    async def file_exists(self, key: str) -> bool:
        if key.startswith("s3://"):
            key = key.split("/", 3)[-1]
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False
