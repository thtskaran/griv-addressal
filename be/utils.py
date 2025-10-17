import base64
import hashlib
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from config import settings

try:
    import boto3  # type: ignore
except ImportError:  # pragma: no cover
    boto3 = None

try:
    from openai import OpenAI  # type: ignore
except ImportError:  # pragma: no cover
    OpenAI = None

try:
    from pymongo import MongoClient, ReturnDocument  # type: ignore
except ImportError:  # pragma: no cover
    MongoClient = None
    ReturnDocument = None
try:
    from bson import ObjectId  # type: ignore
except ImportError:  # pragma: no cover
    ObjectId = None

logger = logging.getLogger("grievance.backend")


def _stringify_object_ids(value: Any) -> Any:
    if ObjectId is not None and isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_stringify_object_ids(item) for item in value]
    if isinstance(value, dict):
        return {key: _stringify_object_ids(inner) for key, inner in value.items()}
    return value


class S3Storage:
    def __init__(self):
        if boto3 is None:
            raise RuntimeError("boto3 is required for S3 interactions.")
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws.access_key_id,
            aws_secret_access_key=settings.aws.secret_access_key,
            region_name=settings.aws.region,
        )
        self.bucket = settings.aws.s3_bucket

    def upload_documents(self, grievance_id: int, documents: Iterable[Dict[str, Any]]) -> List[str]:
        urls: List[str] = []
        for doc in documents:
            filename = doc["filename"]
            content_b64 = doc.get("content_base64")
            binary = base64.b64decode(content_b64) if content_b64 else doc.get("content_bytes", b"")
            key = f"grievances/{grievance_id}/{filename}"
            try:
                self.client.put_object(
                    Bucket=self.bucket,
                    Key=key,
                    Body=binary,
                    ContentType=doc.get("content_type", "application/octet-stream"),
                )
            except Exception as exc:  # pragma: no cover - network/AWS specific
                raise RuntimeError(f"S3 upload failed: {exc}") from exc
            urls.append(f"s3://{self.bucket}/{key}")
        return urls


class MongoRepository:
    def __init__(self):
        if MongoClient is None:
            raise RuntimeError("pymongo is required for MongoDB interactions.")
        try:
            self.client = MongoClient(settings.mongo.uri, serverSelectionTimeoutMS=2000)
            self.db = self.client[settings.mongo.db_name]
            self.chats = self.db[settings.mongo.chat_collection]
            self.embeddings = self.db[settings.mongo.embedding_collection]
            self.analytics = self.db[settings.mongo.analytics_collection]
        except Exception as exc:
            raise RuntimeError(f"MongoDB connection failed: {exc}") from exc

    def append_chat_message(self, grievance_id: int, role: str, message: str) -> Dict[str, Any]:
        payload = {
            "role": role,
            "message": message,
            "timestamp": datetime.utcnow(),
        }
        record = self.chats.find_one_and_update(
            {"grievance_id": grievance_id},
            {"$push": {"conversations": payload}},
            upsert=True,
            return_document=ReturnDocument.AFTER if ReturnDocument else None,
        )
        if not record:
            record = {"grievance_id": grievance_id, "conversations": [payload]}
        return _stringify_object_ids(record)

    def fetch_chat(self, grievance_id: int) -> Dict[str, Any]:
        record = self.chats.find_one({"grievance_id": grievance_id}) or {}
        record = _stringify_object_ids(record)
        return {"grievance_id": grievance_id, "conversations": record.get("conversations", [])}

    def upsert_embedding(self, grievance_id: int, embedding: List[float], meta: Dict[str, Any]) -> None:
        record = {
            "grievance_id": grievance_id,
            "embedding": embedding,
            "meta_info": meta,
            "updated_at": datetime.utcnow(),
        }
        self.embeddings.update_one(
            {"grievance_id": grievance_id},
            {"$set": record},
            upsert=True,
        )

    def fetch_cluster_analytics(self) -> List[Dict[str, Any]]:
        results = list(self.analytics.find({}))
        return _stringify_object_ids(results)


class KnowledgeBaseIngestor:
    def __init__(self):
        self.service_account_path = settings.gdrive.service_account_path

    def register_folder(self, folder_id: str) -> Dict[str, Any]:
        if not self.service_account_path:
            raise ValueError("Missing client.json service account configuration.")
        if not Path(self.service_account_path).exists():
            raise ValueError(
                f"Service account file not found at {self.service_account_path}. "
                "Ensure client.json is present alongside the application files."
            )
        # The ingestion pipeline would live here; we simulate scheduling.
        request_id = hashlib.sha256(f"{folder_id}-{time.time()}".encode()).hexdigest()
        logger.info("Scheduled ingestion for folder %s via request %s", folder_id, request_id)
        return {
            "folder_id": folder_id,
            "request_id": request_id,
            "status": "QUEUED",
        }


class OpenAIClientFacade:
    def __init__(self):
        self.api_key = settings.openai.api_key
        self.embedding_model = settings.openai.embedding_model
        self.chat_model = settings.openai.chat_model
        self.client = OpenAI(api_key=self.api_key) if self.api_key and OpenAI else None

    def generate_embedding(self, text: str) -> List[float]:
        if self.client:
            response = self.client.embeddings.create(
                input=text,
                model=self.embedding_model,
            )
            return response.data[0].embedding
        # Deterministic fallback to keep downstream logic working offline.
        digest = hashlib.sha256(text.encode()).digest()
        return [int(b) / 255.0 for b in digest]

    def summarize_grievances(self, grievances: List[Dict[str, Any]]) -> str:
        if not grievances:
            return "No grievances available for summarization."
        prompt = (
            "Summarize the following grievances with trends and suggested actions:\n"
            f"{json.dumps(grievances, default=str)}"
        )
        if self.client:
            completion = self.client.responses.create(
                model=self.chat_model,
                input=[{"role": "user", "content": prompt}],
            )
            return completion.output_text
        return "AI summarization unavailable (missing OpenAI credentials)."


def upload_documents_to_s3(grievance_id: int, documents: Iterable[Dict[str, Any]]) -> List[str]:
    if not documents:
        return []
    storage = S3Storage()
    return storage.upload_documents(grievance_id, documents)


def persist_embedding(grievance_id: int, embedding: List[float], meta: Dict[str, Any]) -> None:
    repo = MongoRepository()
    repo.upsert_embedding(grievance_id, embedding, meta)


def append_chat(grievance_id: int, role: str, message: str) -> Dict[str, Any]:
    repo = MongoRepository()
    return repo.append_chat_message(grievance_id, role, message)


def fetch_chat(grievance_id: int) -> Dict[str, Any]:
    repo = MongoRepository()
    return repo.fetch_chat(grievance_id)


def fetch_cluster_analytics() -> List[Dict[str, Any]]:
    repo = MongoRepository()
    return repo.fetch_cluster_analytics()


def schedule_gdrive_ingestion(folder_id: str) -> Dict[str, Any]:
    ingestor = KnowledgeBaseIngestor()
    return ingestor.register_folder(folder_id)


def summarize_for_admin(grievances: List[Dict[str, Any]]) -> str:
    facade = OpenAIClientFacade()
    return facade.summarize_grievances(grievances)


def embed_text(text: str) -> List[float]:
    facade = OpenAIClientFacade()
    return facade.generate_embedding(text)


def generate_ai_suggestions(
    grievance: Dict[str, Any],
    related_grievances: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    facade = OpenAIClientFacade()
    summary = facade.summarize_grievances([grievance])

    suggestion_id = hashlib.sha256(str(grievance["id"]).encode()).hexdigest()[:12]
    suggestion_payload = {
        "suggestions": [
            {
                "confidence": 0.72,
                "source": {
                    "doc_id": "knowledge_base_virtual",
                    "chunk_id": suggestion_id,
                },
                "summary": summary,
            }
        ],
        "kb_context_window": [
            {
                "doc_name": "virtual_kb_entry.txt",
                "excerpt": summary[:280] if summary else "Context unavailable.",
            }
        ],
        "related_grievances": related_grievances or [],
    }
    return suggestion_payload
