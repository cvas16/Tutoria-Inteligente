from datetime import datetime, timezone
from uuid import uuid4
import pytest
from httpx import AsyncClient, ASGITransport
from app.core.deps import get_db
from app.main import app
from app.core.security import create_access_token


class _TestConnection:
    async def fetch(self, query, *args):
        return []

    async def fetchrow(self, query, *args):
        return {
            "id": uuid4(),
            "student_id": args[0],
            "submission_date": datetime.now(timezone.utc),
        }


class _TestAcquire:
    async def __aenter__(self):
        return _TestConnection()

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False


class _TestPool:
    def acquire(self):
        return _TestAcquire()


@pytest.fixture
def test_student_token():
    return create_access_token(
        subject="00000000-0000-0000-0000-000000000001",
        role="STUDENT"
    )

@pytest.fixture
def test_tutor_token():
    return create_access_token(
        subject="00000000-0000-0000-0000-000000000002",
        role="TUTOR"
    )

@pytest.fixture
async def async_client():
    previous_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = lambda: _TestPool()
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override