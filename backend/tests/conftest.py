"""
Test configuration and fixtures for TransitOps backend.
Uses in-memory SQLite for fast, isolated unit tests.
"""
import asyncio
import uuid
from datetime import date, timedelta
from decimal import Decimal
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.core.database import get_async_session
from app.main import app


# ──────────────────────────────────────────────────────────────
# Test Database Setup (In-Memory SQLite)
# ──────────────────────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ──────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for all tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a fresh database for each test function.
    Tables are created before each test and dropped after.
    """
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

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    HTTP test client that uses the test database session.
    """
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_async_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ──────────────────────────────────────────────────────────────
# Factory Fixtures (Sample Data)
# ──────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def sample_vehicle(db_session: AsyncSession):
    """Create a sample vehicle in the test database."""
    from app.models.vehicle import Vehicle, VehicleStatus

    vehicle = Vehicle(
        id=uuid.uuid4(),
        registration_number="MH-12-AB-1001",
        make="Tata",
        model="Ace",
        year=2023,
        fuel_type="Diesel",
        status=VehicleStatus.AVAILABLE.value,
        max_capacity_kg=Decimal("500.00"),
        odometer_km=Decimal("45000.00"),
        version=1,
    )
    db_session.add(vehicle)
    await db_session.commit()
    await db_session.refresh(vehicle)
    return vehicle


@pytest_asyncio.fixture
async def sample_driver(db_session: AsyncSession):
    """Create a sample driver with valid license."""
    from app.models.driver import Driver, DriverStatus

    driver = Driver(
        id=uuid.uuid4(),
        first_name="Alex",
        last_name="Kumar",
        license_number="DL-MH-2020-001",
        license_class="Commercial",
        license_expiry_date=date.today() + timedelta(days=365),
        status=DriverStatus.AVAILABLE.value,
        phone="+919876543001",
        version=1,
    )
    db_session.add(driver)
    await db_session.commit()
    await db_session.refresh(driver)
    return driver


@pytest_asyncio.fixture
async def sample_expired_driver(db_session: AsyncSession):
    """Create a driver with expired license (for testing dispatch block)."""
    from app.models.driver import Driver, DriverStatus

    driver = Driver(
        id=uuid.uuid4(),
        first_name="Vijay",
        last_name="Sharma",
        license_number="DL-KA-2020-005",
        license_class="Class B",
        license_expiry_date=date.today() - timedelta(days=10),
        status=DriverStatus.AVAILABLE.value,
        phone="+919876543005",
        version=1,
    )
    db_session.add(driver)
    await db_session.commit()
    await db_session.refresh(driver)
    return driver


@pytest_asyncio.fixture
async def sample_user(db_session: AsyncSession):
    """Create a sample user for authentication tests."""
    from app.models.user import User
    from app.core.security import get_password_hash

    user = User(
        id=uuid.uuid4(),
        email="fleet@transitops.io",
        username="fleet_manager",
        full_name="Rajesh Kumar",
        hashed_password=get_password_hash("Transit@2026"),
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user
