import enum
import json
from contextlib import contextmanager
from datetime import datetime
from typing import Generator, Optional

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    event,
)
from sqlalchemy.orm import (
    declarative_base,
    relationship,
    scoped_session,
    sessionmaker,
)
from sqlalchemy.types import Text as SAText
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.mutable import MutableList

from config import settings

IS_POSTGRES = settings.database.url.startswith("postgresql")

if IS_POSTGRES:
    from sqlalchemy.dialects.postgresql import ARRAY  # type: ignore

    def list_column_type():
        return ARRAY(String)

else:

    class JSONList(TypeDecorator):
        """Persist Python lists as JSON strings for non-Postgres engines."""

        impl = SAText
        cache_ok = True

        def process_bind_param(self, value, dialect):
            if value is None:
                return "[]"
            if isinstance(value, str):
                return value
            return json.dumps(value)

        def process_result_value(self, value, dialect):
            if not value:
                return []
            if isinstance(value, list):
                return value
            try:
                return json.loads(value)
            except (TypeError, ValueError):
                return []

    def list_column_type():
        return MutableList.as_mutable(JSONList)


DEFAULT_STUDENT_NAME = "Default Student"
DEFAULT_STUDENT_EMAIL = "student@grievances.local"
DEFAULT_ADMIN_NAME = "Default Admin"
DEFAULT_ADMIN_EMAIL = "admin@grievances.local"


class GrievanceStatus(enum.Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    SOLVED = "SOLVED"
    DROPPED = "DROPPED"


class Department(enum.Enum):
    HOSTEL = "HOSTEL"
    MESS = "MESS"
    FACULTY = "FACULTY"
    ACADEMICS = "ACADEMICS"
    LIBRARY = "LIBRARY"
    OTHERS = "OTHERS"


Base = declarative_base()


def _create_engine():
    kwargs = {
        "echo": settings.database.echo,
        "future": True,
    }
    if not settings.database.url.startswith("sqlite:"):
        kwargs["pool_size"] = settings.database.pool_size
    return create_engine(settings.database.url, **kwargs)


engine = _create_engine()
SessionFactory = sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)
SessionLocal = scoped_session(SessionFactory)


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Student(Base, TimestampMixin):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)

    grievances = relationship("Grievance", back_populates="student", lazy="selectin")


class Admin(Base, TimestampMixin):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    gd_service_account_json = Column(Text, nullable=True)


class Grievance(Base, TimestampMixin):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(GrievanceStatus), default=GrievanceStatus.NEW, nullable=False)
    assigned_to = Column(Enum(Department), default=Department.OTHERS, nullable=False)
    tags = Column(list_column_type(), default=list)
    s3_doc_urls = Column(list_column_type(), default=list)
    cluster = Column(String(120), nullable=True)
    drop_reason = Column(Text, nullable=True)

    student = relationship("Student", back_populates="grievances", lazy="joined")


@event.listens_for(SessionFactory, "after_flush")
def _update_timestamp(session, flush_context):
    for instance in session.dirty:
        if isinstance(instance, TimestampMixin):
            instance.updated_at = datetime.utcnow()


@contextmanager
def session_scope() -> Generator:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_or_create_default_student(session) -> Student:
    student = session.query(Student).filter(Student.email == DEFAULT_STUDENT_EMAIL).first()
    if not student:
        student = Student(name=DEFAULT_STUDENT_NAME, email=DEFAULT_STUDENT_EMAIL)
        session.add(student)
        session.flush()
    return student


def get_or_create_default_admin(session) -> Admin:
    admin = session.query(Admin).filter(Admin.email == DEFAULT_ADMIN_EMAIL).first()
    if not admin:
        admin = Admin(name=DEFAULT_ADMIN_NAME, email=DEFAULT_ADMIN_EMAIL)
        session.add(admin)
        session.flush()
    return admin


def seed_default_entities() -> None:
    with session_scope() as session:
        get_or_create_default_student(session)
        get_or_create_default_admin(session)


def init_db(drop_existing: bool = False) -> None:
    if drop_existing:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_default_entities()


def get_grievance(session, grievance_id: int) -> Optional[Grievance]:
    return session.query(Grievance).filter(Grievance.id == grievance_id).first()
