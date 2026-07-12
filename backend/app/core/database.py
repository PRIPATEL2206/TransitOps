from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool, StaticPool
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Build engine kwargs based on database type
engine_kwargs = {
    "echo": settings.DEBUG,
}

if settings.IS_SQLITE:
    # SQLite needs special handling for async
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine_kwargs["poolclass"] = StaticPool
else:
    # PostgreSQL connection pooling
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_recycle"] = 3600

# Create async engine
engine = create_async_engine(
    settings.EFFECTIVE_DATABASE_URL,
    **engine_kwargs,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables. Used for SQLite local dev and testing."""
    from app.models.base import Base
    # Import all models so they register with Base.metadata
    import app.models.user  # noqa: F401
    import app.models.vehicle  # noqa: F401
    import app.models.driver  # noqa: F401
    import app.models.trip  # noqa: F401
    import app.models.maintenance  # noqa: F401
    import app.models.fuel_log  # noqa: F401
    import app.models.expense  # noqa: F401
    import app.models.audit_log  # noqa: F401
    import app.models.notification  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized", db_url=settings.EFFECTIVE_DATABASE_URL)


async def dispose_engine() -> None:
    await engine.dispose()
    logger.info("Database engine disposed")
