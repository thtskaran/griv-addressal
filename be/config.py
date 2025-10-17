import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional


def _load_env_file(path: Path) -> None:
    """Populate os.environ with key/value pairs discovered in a .env file."""
    if not path.exists() or not path.is_file():
        return
    for raw_line in path.read_text().splitlines():
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def _to_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "t", "yes", "y", "on"}


@dataclass(frozen=True)
class DatabaseSettings:
    url: str
    echo: bool
    pool_size: int


@dataclass(frozen=True)
class MongoSettings:
    uri: str
    db_name: str
    chat_collection: str
    embedding_collection: str
    analytics_collection: str


@dataclass(frozen=True)
class OpenAISettings:
    api_key: str
    embedding_model: str
    chat_model: str


@dataclass(frozen=True)
class AWSSettings:
    access_key_id: str
    secret_access_key: str
    region: str
    s3_bucket: str


@dataclass(frozen=True)
class GoogleDriveSettings:
    service_account_path: Optional[str]
    polling_interval_seconds: int


@dataclass(frozen=True)
class ApplicationSettings:
    environment: str
    debug: bool
    flask_secret_key: str
    database: DatabaseSettings
    mongo: MongoSettings
    openai: OpenAISettings
    aws: AWSSettings
    gdrive: GoogleDriveSettings
    allow_cors_origins: Optional[str]

    def as_flask_config(self) -> Dict[str, str]:
        return {
            "ENV": self.environment,
            "DEBUG": self.debug,
            "SECRET_KEY": self.flask_secret_key,
            "SQLALCHEMY_DATABASE_URI": self.database.url,
        }


def load_settings(env_file: str = ".env") -> ApplicationSettings:
    _load_env_file(Path(env_file))
    project_root = Path(__file__).resolve().parent

    database = DatabaseSettings(
        url=os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg2://postgres:postgres@localhost:5432/grievances",
        ),
        echo=_to_bool(os.getenv("SQLALCHEMY_ECHO"), default=False),
        pool_size=int(os.getenv("SQLALCHEMY_POOL_SIZE", "5")),
    )

    mongo = MongoSettings(
        uri=os.getenv("MONGODB_URI", "mongodb://localhost:27017"),
        db_name=os.getenv("MONGODB_DB", "grievances"),
        chat_collection=os.getenv("MONGODB_CHAT_COLLECTION", "grievance_chats"),
        embedding_collection=os.getenv(
            "MONGODB_EMBEDDING_COLLECTION", "grievance_embeddings"
        ),
        analytics_collection=os.getenv(
            "MONGODB_ANALYTICS_COLLECTION", "cluster_analytics"
        ),
    )

    openai = OpenAISettings(
        api_key=os.getenv("OPENAI_API_KEY", ""),
        embedding_model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
        chat_model=os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
    )

    aws = AWSSettings(
        access_key_id=os.getenv("AWS_ACCESS_KEY_ID", ""),
        secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", ""),
        region=os.getenv("AWS_REGION", "ap-south-1"),
        s3_bucket=os.getenv("AWS_S3_BUCKET", "student-grievances"),
    )

    gdrive = GoogleDriveSettings(
        service_account_path=str(project_root / "client.json"),
        polling_interval_seconds=int(os.getenv("GDRIVE_POLL_INTERVAL", "300")),
    )

    settings = ApplicationSettings(
        environment=os.getenv("FLASK_ENV", "development"),
        debug=_to_bool(os.getenv("FLASK_DEBUG"), default=True),
        flask_secret_key=os.getenv("FLASK_SECRET_KEY", "change-me"),
        database=database,
        mongo=mongo,
        openai=openai,
        aws=aws,
        gdrive=gdrive,
        allow_cors_origins=os.getenv("CORS_ALLOW_ORIGINS"),
    )
    return settings


settings = load_settings()
