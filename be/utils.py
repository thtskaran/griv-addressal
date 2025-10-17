import base64
import hashlib
import io
import json
import logging
import time
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

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
    from pymongo import MongoClient, ReturnDocument, UpdateOne  # type: ignore
except ImportError:  # pragma: no cover
    MongoClient = None
    ReturnDocument = None
    UpdateOne = None
try:
    from bson import ObjectId  # type: ignore
except ImportError:  # pragma: no cover
    ObjectId = None

try:
    from google.oauth2 import service_account  # type: ignore
    from googleapiclient.discovery import build  # type: ignore
    from googleapiclient.errors import HttpError  # type: ignore
    from googleapiclient.http import MediaIoBaseDownload  # type: ignore
except ImportError:  # pragma: no cover
    service_account = None
    build = None
    HttpError = None
    MediaIoBaseDownload = None

try:
    from PyPDF2 import PdfReader  # type: ignore
except ImportError:  # pragma: no cover
    PdfReader = None

logger = logging.getLogger("grievance.backend")


def _stringify_object_ids(value: Any) -> Any:
    if ObjectId is not None and isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_stringify_object_ids(item) for item in value]
    if isinstance(value, dict):
        return {key: _stringify_object_ids(inner) for key, inner in value.items()}
    return value


class KnowledgeBaseChangePoller:
    """Background poller that periodically syncs Google Drive knowledge-base chunks."""

    def __init__(self, interval_seconds: int):
        self.interval = max(60, int(interval_seconds) if interval_seconds else 300)
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._wake_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._folder_id: Optional[str] = None
        self._change_token: Optional[str] = None

    def start(self, folder_id: str, change_token: Optional[str] = None) -> None:
        """Start or reconfigure the poller for the provided folder."""
        with self._lock:
            self._folder_id = folder_id
            self._change_token = change_token
            if self._thread and self._thread.is_alive():
                self._wake_event.set()
                logger.info("Reconfigured GDrive poller for folder %s", folder_id)
                return

            self._stop_event.clear()
            self._wake_event.set()
            self._thread = threading.Thread(
                target=self._run, name="gdrive-kb-poller", daemon=True
            )
            self._thread.start()
            logger.info(
                "Started GDrive poller for folder %s (interval=%ss)", folder_id, self.interval
            )

    def stop(self) -> None:
        with self._lock:
            if not self._thread:
                return
            self._stop_event.set()
            self._wake_event.set()
            thread = self._thread
            self._thread = None
        thread.join(timeout=1.0)

    def trigger_now(self) -> None:
        self._wake_event.set()

    def current_folder_id(self) -> Optional[str]:
        with self._lock:
            return self._folder_id

    def set_change_token(self, token: Optional[str]) -> None:
        self._store_change_token(token)

    def snapshot_state(self) -> Dict[str, Optional[str]]:
        return self._snapshot_state()

    def _snapshot_state(self) -> Dict[str, Optional[str]]:
        with self._lock:
            return {"folder_id": self._folder_id, "change_token": self._change_token}

    def _store_change_token(self, token: Optional[str]) -> None:
        with self._lock:
            self._change_token = token

    def _run(self) -> None:
        ingestor = KnowledgeBaseIngestor()
        while not self._stop_event.is_set():
            # Wait for the next cycle or external trigger.
            self._wake_event.wait(self.interval)
            self._wake_event.clear()
            if self._stop_event.is_set():
                break

            snapshot = self._snapshot_state()
            folder_id = snapshot["folder_id"]
            change_token = snapshot["change_token"]
            if not folder_id:
                continue

            try:
                new_token = ingestor.poll_and_ingest(folder_id, change_token)
                if new_token is not None:
                    self._store_change_token(new_token)
            except Exception as exc:  # pragma: no cover - background worker should never crash app
                logger.warning("GDrive polling error: %s", exc, exc_info=True)


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
            self.kb_chunks = self.db[settings.mongo.kb_collection]
            self._ensure_indexes()
        except Exception as exc:
            raise RuntimeError(f"MongoDB connection failed: {exc}") from exc

    def _ensure_indexes(self) -> None:
        try:
            self.kb_chunks.create_index(
                [("doc_id", 1), ("chunk_id", 1)],
                unique=True,
                name="kb_doc_chunk_unique",
            )
            self.kb_chunks.create_index(
                [("folder_id", 1), ("doc_id", 1)],
                name="kb_folder_doc_idx",
            )
        except Exception as exc:  # pragma: no cover - index creation best effort
            logger.warning("Failed to ensure KB Mongo indexes: %s", exc)

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

    def bulk_upsert_kb_chunks(self, chunks: Sequence[Dict[str, Any]]) -> int:
        if not chunks:
            return 0
        if UpdateOne is None:
            raise RuntimeError("pymongo is required for MongoDB interactions.")
        operations = []
        for chunk in chunks:
            selector = {
                "type": "kb_chunk",
                "doc_id": chunk["doc_id"],
                "chunk_id": chunk["chunk_id"],
            }
            payload = dict(chunk)
            payload["updated_at"] = datetime.utcnow()
            operations.append(UpdateOne(selector, {"$set": payload}, upsert=True))
        result = self.kb_chunks.bulk_write(operations, ordered=False)
        modified = result.modified_count or 0
        upserted = len(result.upserted_ids) if result.upserted_ids else 0
        return modified + upserted

    def delete_folder_kb_chunks(self, folder_id: str) -> int:
        result = self.kb_chunks.delete_many(
            {"type": "kb_chunk", "folder_id": folder_id}
        )
        return result.deleted_count or 0

    def delete_kb_chunks(self, chunk_refs: Sequence[Dict[str, Any]]) -> int:
        if not chunk_refs:
            return 0
        total_deleted = 0
        for ref in chunk_refs:
            doc_id = ref.get("doc_id")
            chunk_id = ref.get("chunk_id")
            if not doc_id or not chunk_id:
                continue
            if chunk_id == "*":
                result = self.kb_chunks.delete_many({"type": "kb_chunk", "doc_id": doc_id})
            else:
                result = self.kb_chunks.delete_one(
                    {"type": "kb_chunk", "doc_id": doc_id, "chunk_id": chunk_id}
                )
            total_deleted += result.deleted_count or 0
        return total_deleted

    def replace_kb_folder_chunks(
        self, folder_id: str, chunks: Sequence[Dict[str, Any]]
    ) -> Dict[str, int]:
        deleted = self.delete_folder_kb_chunks(folder_id)
        upserted = self.bulk_upsert_kb_chunks(chunks)
        return {"deleted": deleted, "upserted": upserted}

    def search_similar_chunks(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar KB chunks using cosine similarity with the query embedding.
        Returns top_k most similar chunks.
        """
        # Fetch all KB chunks with embeddings
        all_chunks = list(self.kb_chunks.find({"type": "kb_chunk", "embedding": {"$exists": True}}))
        
        if not all_chunks:
            logger.warning("No KB chunks with embeddings found")
            return []
        
        # Calculate cosine similarity for each chunk
        similarities = []
        for chunk in all_chunks:
            chunk_embedding = chunk.get("embedding", [])
            if not chunk_embedding:
                continue
            
            # Cosine similarity calculation
            dot_product = sum(a * b for a, b in zip(query_embedding, chunk_embedding))
            magnitude_query = sum(a * a for a in query_embedding) ** 0.5
            magnitude_chunk = sum(b * b for b in chunk_embedding) ** 0.5
            
            if magnitude_query > 0 and magnitude_chunk > 0:
                similarity = dot_product / (magnitude_query * magnitude_chunk)
                similarities.append({
                    **chunk,
                    "score": similarity
                })
        
        # Sort by similarity score (descending) and return top_k
        similarities.sort(key=lambda x: x["score"], reverse=True)
        return _stringify_object_ids(similarities[:top_k])


class KnowledgeBaseIngestor:
    def __init__(self):
        self.service_account_path = settings.gdrive.service_account_path
        self.polling_interval = settings.gdrive.polling_interval_seconds
        self._scopes = ["https://www.googleapis.com/auth/drive.readonly"]

    def register_folder(self, folder_id: str) -> Dict[str, Any]:
        logger.info("=== Starting GDrive folder registration for folder_id=%s ===", folder_id)
        if not self.service_account_path:
            raise ValueError("Missing client.json service account configuration.")
        if not Path(self.service_account_path).exists():
            raise ValueError(
                f"Service account file not found at {self.service_account_path}. "
                "Ensure client.json is present alongside the application files."
            )
        if service_account is None or build is None:
            raise RuntimeError(
                "google-api-python-client is required for Google Drive ingestion."
            )

        request_id = hashlib.sha256(f"{folder_id}-{time.time()}".encode()).hexdigest()
        logger.info("Request ID generated: %s", request_id)
        
        logger.info("Building Drive API client...")
        drive = self._build_drive_client()
        logger.info("Drive API client built successfully")
        
        logger.info("Fetching start page token from Google Drive...")
        start_token = self._get_start_page_token(drive)
        logger.info("Start page token received: %s", start_token)
        
        logger.info(
            "Registered Drive folder %s via request %s (start token=%s)",
            folder_id,
            request_id,
            start_token,
        )
        return {
            "folder_id": folder_id,
            "request_id": request_id,
            "status": "QUEUED",
            "start_page_token": start_token,
        }

    def poll_and_ingest(
        self, folder_id: str, change_token: Optional[str] = None
    ) -> Optional[str]:
        """Fetch Drive deltas and synchronise them into MongoDB."""
        logger.info("=== Starting poll_and_ingest for folder_id=%s, change_token=%s ===", folder_id, change_token)
        if service_account is None or build is None:
            raise RuntimeError(
                "google-api-python-client is required for Google Drive ingestion."
            )

        logger.info("Building Drive API client for polling...")
        drive = self._build_drive_client()
        logger.info("Drive API client built for polling")

        if change_token is None:
            logger.info("No change token provided, performing full snapshot...")
            snapshot_chunks, next_token = self._snapshot_folder(drive, folder_id)
            logger.info("Snapshot completed: %d chunks, next_token=%s", len(snapshot_chunks), next_token)
            self._persist_chunks(folder_id, snapshot_chunks, [])
            return next_token

        logger.info("Change token provided, collecting incremental changes...")
        changes, deleted, next_token = self._collect_drive_changes(drive, folder_id, change_token)
        logger.info("Changes collected: %d updates, %d deletions, next_token=%s", len(changes), len(deleted), next_token)
        self._persist_chunks(folder_id, changes, deleted)
        return next_token

    def reindex_folder(self, folder_id: str) -> Dict[str, Any]:
        logger.info("=== Starting reindex_folder for folder_id=%s ===", folder_id)
        if not folder_id:
            raise ValueError("folder_id is required for reindexing.")
        if not self.service_account_path:
            raise ValueError("Missing client.json service account configuration.")
        if not Path(self.service_account_path).exists():
            raise ValueError(
                f"Service account file not found at {self.service_account_path}. "
                "Ensure client.json is present alongside the application files."
            )
        if service_account is None or build is None:
            raise RuntimeError(
                "google-api-python-client is required for Google Drive ingestion."
            )
        
        logger.info("Building Drive API client for reindexing...")
        drive = self._build_drive_client()
        logger.info("Drive API client built for reindexing")
        
        logger.info("Starting full folder snapshot for reindex...")
        chunks, next_token = self._snapshot_folder(drive, folder_id)
        logger.info("Snapshot for reindex completed: %d chunks, next_token=%s", len(chunks), next_token)
        
        logger.info("Replacing KB folder chunks in MongoDB...")
        repo = MongoRepository()
        stats = repo.replace_kb_folder_chunks(folder_id, chunks)
        logger.info("KB chunks replaced: %s", stats)
        
        return {
            "folder_id": folder_id,
            "chunks_discovered": len(chunks),
            "chunks_upserted": stats.get("upserted", 0),
            "chunks_deleted": stats.get("deleted", 0),
            "next_change_token": next_token,
            "reindexed_at": datetime.utcnow().isoformat(),
        }

    def _build_drive_client(self):
        logger.debug("Authenticating with service account: %s", self.service_account_path)
        credentials = service_account.Credentials.from_service_account_file(
            self.service_account_path,
            scopes=self._scopes,
        )
        logger.debug("Building Drive v3 API client...")
        return build("drive", "v3", credentials=credentials, cache_discovery=False)

    def _get_start_page_token(self, drive) -> str:
        logger.debug("Requesting start page token from Drive API...")
        response = drive.changes().getStartPageToken().execute()
        token = response.get("startPageToken")
        logger.debug("Start page token retrieved: %s", token)
        return token

    def _snapshot_folder(self, drive, folder_id: str) -> Tuple[List[Dict[str, Any]], str]:
        logger.info("Listing all files in folder %s...", folder_id)
        files = self._list_folder_files(drive, folder_id)
        logger.info("Found %d files in folder %s", len(files), folder_id)
        
        chunks: List[Dict[str, Any]] = []
        for idx, file in enumerate(files, 1):
            logger.info("Processing file %d/%d: %s (id=%s)", idx, len(files), file.get("name"), file.get("id"))
            file_chunks = self._build_chunks_for_file(drive, folder_id, file)
            logger.info("Generated %d chunks for file %s", len(file_chunks), file.get("name"))
            chunks.extend(file_chunks)
        
        logger.info("Total chunks generated from all files: %d", len(chunks))
        next_token = self._get_start_page_token(drive)
        logger.info("Next page token for future polling: %s", next_token)
        return chunks, next_token

    def _collect_drive_changes(
        self, drive, folder_id: str, change_token: str
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, str]], str]:
        logger.info("Collecting changes from Drive API starting with token: %s", change_token)
        page_token = change_token
        updates: List[Dict[str, Any]] = []
        deleted: List[Dict[str, str]] = []
        page_count = 0

        while True:
            page_count += 1
            logger.debug("Fetching changes page %d with token: %s", page_count, page_token)
            request = (
                drive.changes()
                .list(
                    pageToken=page_token,
                    spaces="drive",
                    fields=(
                        "nextPageToken,"
                        "newStartPageToken,"
                        "changes(fileId,removed,file("
                        "id,name,mimeType,parents,modifiedTime,md5Checksum,headRevisionId"
                        "))"
                    ),
                    includeItemsFromAllDrives=True,
                    supportsAllDrives=True,
                )
            )
            response = request.execute()
            changes = response.get("changes", [])
            logger.info("Received %d changes in page %d", len(changes), page_count)
            
            for change in changes:
                file_obj = change.get("file")
                file_id = change.get("fileId")
                if change.get("removed") or not file_obj:
                    logger.debug("File %s removed or not accessible", file_id)
                    deleted.append({"doc_id": file_id, "chunk_id": "*"})
                    continue
                parents = file_obj.get("parents") or []
                if folder_id not in parents:
                    logger.debug("File %s (%s) not in target folder, marking for deletion", file_id, file_obj.get("name"))
                    deleted.append({"doc_id": file_obj.get("id"), "chunk_id": "*"})
                    continue
                logger.info("Processing updated file: %s (id=%s)", file_obj.get("name"), file_obj.get("id"))
                file_updates = self._build_chunks_for_file(drive, folder_id, file_obj)
                logger.info("Generated %d chunks for updated file %s", len(file_updates), file_obj.get("name"))
                updates.extend(file_updates)

            page_token = response.get("nextPageToken")
            if not page_token:
                new_token = response.get("newStartPageToken") or change_token
                logger.info("Change collection complete. Total updates: %d, deletions: %d, new_token: %s", 
                           len(updates), len(deleted), new_token)
                return updates, deleted, new_token

    def _list_folder_files(self, drive, folder_id: str) -> List[Dict[str, Any]]:
        logger.info("Querying Drive API for files in folder: %s", folder_id)
        files: List[Dict[str, Any]] = []
        page_token: Optional[str] = None
        query = f"'{folder_id}' in parents and trashed = false"
        page_count = 0
        
        while True:
            page_count += 1
            logger.debug("Fetching files page %d", page_count)
            response = (
                drive.files()
                .list(
                    q=query,
                    pageSize=100,
                    pageToken=page_token,
                    fields="nextPageToken, files(id, name, mimeType, modifiedTime, md5Checksum, headRevisionId)",
                    includeItemsFromAllDrives=True,
                    supportsAllDrives=True,
                )
                .execute()
            )
            page_files = response.get("files", [])
            logger.debug("Page %d returned %d files", page_count, len(page_files))
            files.extend(page_files)
            page_token = response.get("nextPageToken")
            if not page_token:
                break
        
        logger.info("Total files retrieved: %d", len(files))
        return files

    def _build_chunks_for_file(
        self, drive, folder_id: str, file_obj: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        file_id = file_obj.get("id")
        file_name = file_obj.get("name")
        if not file_id:
            logger.warning("File object missing ID, skipping")
            return []
        
        logger.info("Downloading content for file: %s (id=%s)", file_name, file_id)
        content = self._download_file_content(drive, file_obj)
        if content is None:
            logger.warning("No content downloaded for file %s, skipping chunking", file_name)
            return []
        
        logger.info("Downloaded %d characters of content from %s", len(content), file_name)
        logger.info("Chunking text content...")
        chunks = self._chunk_text(content)
        logger.info("Text chunked into %d segments for file %s", len(chunks), file_name)
        
        metadata = {
            "file_name": file_obj.get("name"),
            "mime_type": file_obj.get("mimeType"),
            "modified_time": file_obj.get("modifiedTime"),
            "revision": file_obj.get("headRevisionId"),
        }
        records: List[Dict[str, Any]] = []
        facade = OpenAIClientFacade()
        
        for index, chunk_text in enumerate(chunks, start=1):
            chunk_id = f"chunk_{index:04d}"
            logger.debug("Generating embedding for chunk %s of file %s", chunk_id, file_name)
            embedding = facade.generate_embedding(chunk_text)
            logger.debug("Embedding generated: %d dimensions for chunk %s", len(embedding), chunk_id)
            
            records.append(
                {
                    "type": "kb_chunk",
                    "folder_id": folder_id,
                    "doc_id": file_id,
                    "chunk_id": chunk_id,
                    "content": chunk_text,
                    "embedding": embedding,
                    "meta_info": metadata,
                    "checksum": file_obj.get("md5Checksum"),
                    "source": file_obj.get("name"),
                }
            )
        
        logger.info("Built %d chunk records for file %s", len(records), file_name)
        return records

    def _download_file_content(self, drive, file_obj: Dict[str, Any]) -> Optional[str]:
        file_id = file_obj.get("id")
        mime_type = file_obj.get("mimeType")
        file_name = file_obj.get("name")
        
        if not file_id or not mime_type:
            logger.warning("File missing ID or mime_type: %s", file_name)
            return None

        try:
            logger.debug("Attempting download for %s (mime=%s)", file_name, mime_type)
            
            # Handle PDF files
            if mime_type == "application/pdf":
                logger.debug("Downloading PDF file as binary")
                request = drive.files().get_media(fileId=file_id)
                buffer = io.BytesIO()
                downloader = MediaIoBaseDownload(buffer, request)
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                    if status:
                        logger.debug("Download progress for %s: %d%%", file_name, int(status.progress() * 100))
                
                buffer.seek(0)
                logger.debug("Download complete for %s, extracting text from PDF...", file_name)
                return self._extract_text_from_pdf(buffer, file_name)
            
            # Handle Google Docs exports
            if mime_type == "application/vnd.google-apps.document":
                logger.debug("Exporting Google Doc as text/plain")
                request = drive.files().export_media(fileId=file_id, mimeType="text/plain")
            elif mime_type == "application/vnd.google-apps.spreadsheet":
                logger.debug("Exporting Google Sheet as text/csv")
                request = drive.files().export_media(fileId=file_id, mimeType="text/csv")
            elif mime_type == "application/vnd.google-apps.presentation":
                logger.debug("Exporting Google Slides as text/plain")
                request = drive.files().export_media(fileId=file_id, mimeType="text/plain")
            elif mime_type.startswith("text/") or mime_type in {
                "application/json",
                "application/xml",
                "application/javascript",
            }:
                logger.debug("Downloading as media (text-like mime type)")
                request = drive.files().get_media(fileId=file_id)
            else:
                logger.debug(
                    "Skipping unsupported Drive mime type %s for file %s", mime_type, file_id
                )
                return None

            buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(buffer, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    logger.debug("Download progress for %s: %d%%", file_name, int(status.progress() * 100))
            
            buffer.seek(0)
            logger.debug("Download complete for %s, decoding content...", file_name)
            try:
                content = buffer.read().decode("utf-8")
                logger.info("Successfully decoded %s as UTF-8 (%d chars)", file_name, len(content))
                return content
            except UnicodeDecodeError:
                content = buffer.getvalue().decode("latin-1", errors="ignore")
                logger.warning("UTF-8 decode failed for %s, using latin-1 fallback (%d chars)", file_name, len(content))
                return content
        except HttpError as exc:
            logger.warning("Failed to download Drive file %s: %s", file_id, exc)
            return None

    def _extract_text_from_pdf(self, pdf_buffer: io.BytesIO, file_name: str) -> Optional[str]:
        """Extract text content from a PDF file buffer."""
        if PdfReader is None:
            logger.error("PyPDF2 is not installed, cannot extract PDF text from %s", file_name)
            return None
        
        try:
            reader = PdfReader(pdf_buffer)
            text_parts = []
            
            for page_num, page in enumerate(reader.pages, 1):
                logger.debug("Extracting text from page %d of %s", page_num, file_name)
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            
            full_text = "\n\n".join(text_parts)
            logger.info("Successfully extracted %d characters from %d pages of PDF: %s", 
                       len(full_text), len(reader.pages), file_name)
            return full_text
        except Exception as exc:
            logger.error("Failed to extract text from PDF %s: %s", file_name, exc, exc_info=True)
            return None

    def _chunk_text(self, text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
        if not text:
            return []
        cleaned = text.replace("\r\n", "\n").strip()
        if not cleaned:
            return []
        chunks: List[str] = []
        start = 0
        length = len(cleaned)
        while start < length:
            end = min(start + chunk_size, length)
            chunk = cleaned[start:end]
            chunks.append(chunk)
            if end == length:
                break
            start = max(end - overlap, start + 1)
        return chunks

    def _persist_chunks(
        self,
        folder_id: str,
        chunks: List[Dict[str, Any]],
        deleted_refs: List[Dict[str, str]],
    ) -> None:
        if not chunks and not deleted_refs:
            logger.debug("No knowledge-base changes detected for folder %s", folder_id)
            return

        logger.info("=== Persisting chunks to MongoDB for folder %s ===", folder_id)
        logger.info("Chunks to upsert: %d, Chunks to delete: %d", len(chunks), len(deleted_refs))
        
        repo = MongoRepository()
        modified = 0
        removed = 0
        
        if chunks:
            logger.info("Starting bulk upsert of %d chunks...", len(chunks))
            modified = repo.bulk_upsert_kb_chunks(chunks)
            logger.info(
                "Upserted %s knowledge-base chunks for folder %s", modified, folder_id
            )

        if deleted_refs:
            normalized = [
                ref
                for ref in deleted_refs
                if ref.get("doc_id") and ref.get("chunk_id")
            ]
            logger.info("Normalized %d deletion references", len(normalized))
            if normalized:
                logger.info("Starting deletion of %d chunk references...", len(normalized))
                removed = repo.delete_kb_chunks(normalized)
                logger.info(
                    "Removed %s knowledge-base chunks for folder %s", removed, folder_id
                )
        
        if modified == 0 and removed == 0:
            logger.debug(
                "Knowledge-base poll completed without material changes for folder %s", folder_id
            )
        else:
            logger.info("=== Persistence complete: %d upserted, %d removed ===", modified, removed)


_GDRIVE_POLLER: Optional[KnowledgeBaseChangePoller] = None


def get_gdrive_poller() -> KnowledgeBaseChangePoller:
    global _GDRIVE_POLLER
    if _GDRIVE_POLLER is None:
        _GDRIVE_POLLER = KnowledgeBaseChangePoller(settings.gdrive.polling_interval_seconds)
    return _GDRIVE_POLLER


class OpenAIClientFacade:
    def __init__(self):
        self.api_key = settings.openai.api_key
        self.embedding_model = settings.openai.embedding_model
        self.chat_model = settings.openai.chat_model
        self.client = OpenAI(api_key=self.api_key) if self.api_key and OpenAI else None

    def generate_embedding(self, text: str) -> List[float]:
        if self.client:
            logger.debug("Calling OpenAI API for embedding (model=%s, text_length=%d)", 
                        self.embedding_model, len(text))
            response = self.client.embeddings.create(
                input=text,
                model=self.embedding_model,
            )
            embedding = response.data[0].embedding
            logger.debug("OpenAI embedding received: %d dimensions", len(embedding))
            return embedding
        # Deterministic fallback to keep downstream logic working offline.
        logger.warning("OpenAI client not configured, using fallback embedding generation")
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
    response = ingestor.register_folder(folder_id)
    poller = get_gdrive_poller()
    poller.start(folder_id)
    response.update(
        {
            "status": "POLLING",
            "polling_interval_seconds": settings.gdrive.polling_interval_seconds,
            "next_poll_in_seconds": 0,
        }
    )
    return response


def reindex_gdrive_folder(folder_id: str) -> Dict[str, Any]:
    ingestor = KnowledgeBaseIngestor()
    return ingestor.reindex_folder(folder_id)


def summarize_for_admin(grievances: List[Dict[str, Any]]) -> str:
    facade = OpenAIClientFacade()
    return facade.summarize_grievances(grievances)


def embed_text(text: str) -> List[float]:
    facade = OpenAIClientFacade()
    return facade.generate_embedding(text)


def generate_tags_with_ai(title: str, description: str) -> List[str]:
    """
    Generate relevant tags for a grievance using OpenAI based on title and description.
    Returns a list of tag strings.
    """
    facade = OpenAIClientFacade()
    if not facade.client:
        logger.warning("OpenAI client not configured, returning default tags")
        return ["general", "unclassified"]
    
    prompt = f"""Analyze the following grievance and generate 3-5 relevant tags that categorize the issue.
Tags should be lowercase, single words or short phrases (2-3 words max), separated by commas.
Focus on: issue type, department, urgency, and specific problem area.

Title: {title}
Description: {description}

Return only the tags as a comma-separated list, nothing else."""

    try:
        completion = facade.client.chat.completions.create(
            model=facade.chat_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            temperature=0.3,
        )
        tags_str = completion.choices[0].message.content.strip()
        # Parse comma-separated tags and clean them
        tags = [tag.strip().lower() for tag in tags_str.split(",") if tag.strip()]
        logger.info(f"Generated {len(tags)} tags using OpenAI: {tags}")
        return tags[:5]  # Limit to 5 tags max
    except Exception as e:
        logger.error(f"Error generating tags with OpenAI: {e}")
        return ["general", "unclassified"]


def get_kb_suggestions_for_grievance(description: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Get knowledge base suggestions by finding similar chunks based on the grievance description.
    Returns a list of relevant KB chunks with excerpts.
    """
    try:
        # Generate embedding for the description
        embedding = embed_text(description)
        
        # Search for similar chunks in MongoDB
        repo = MongoRepository()
        similar_chunks = repo.search_similar_chunks(embedding, top_k=top_k)
        
        suggestions = []
        for chunk in similar_chunks:
            suggestions.append({
                "doc_name": chunk.get("doc_name", "Unknown Document"),
                "excerpt": chunk.get("text", "")[:300],  # First 300 chars
                "similarity_score": chunk.get("score", 0.0),
                "chunk_id": str(chunk.get("_id", "")),
            })
        
        logger.info(f"Found {len(suggestions)} KB suggestions for grievance")
        return suggestions
    except Exception as e:
        logger.error(f"Error getting KB suggestions: {e}")
        return []


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
