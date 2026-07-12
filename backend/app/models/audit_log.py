import uuid
from datetime import datetime
from typing import Optional, Any
import json

from sqlalchemy import DateTime, ForeignKey, String, Text, func, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, GUID


class JSONType(TypeDecorator):
    """Platform-independent JSON type.

    Uses PostgreSQL's JSONB when available, otherwise stores as TEXT
    with JSON serialization (for SQLite compatibility).
    """

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value


class AuditLog(Base):
    """
    Immutable audit log - no update/delete. Only INSERT is allowed.
    Tracks all state-changing operations in the system.
    """

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Actor
    user_id: Mapped[Optional[str]] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Action details
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    # Change tracking — Using JSONType for cross-DB compatibility
    old_values: Mapped[Optional[dict]] = mapped_column(JSONType(), nullable=True)
    new_values: Mapped[Optional[dict]] = mapped_column(JSONType(), nullable=True)

    # Request context
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    request_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} on {self.entity_type}/{self.entity_id}>"
