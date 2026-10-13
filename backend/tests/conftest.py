import os
import time

import jwt
import pytest

os.environ.setdefault("SUPABASE_URL", "https://proj.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "anon")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "service")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret-test-secret-test-secret!")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

from fastapi.testclient import TestClient  # noqa: E402

from app import deps  # noqa: E402
from app.main import app  # noqa: E402

REST = "https://proj.supabase.co/rest/v1"
AUTH = "https://proj.supabase.co/auth/v1"


def make_token(sub: str, secret: str | None = None, **extra) -> str:
    claims = {
        "sub": sub,
        "aud": "authenticated",
        "iss": AUTH,
        "exp": int(time.time()) + 3600,
        "role": "authenticated",
        "email": f"{sub}@college.edu",
        **extra,
    }
    return jwt.encode(claims, secret or os.environ["SUPABASE_JWT_SECRET"], algorithm="HS256")


@pytest.fixture(autouse=True)
def _clear_cache():
    deps._profile_cache.clear()
    yield
    deps._profile_cache.clear()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def as_role(respx_mock):
    """Return auth headers for a user whose profile row has the given role."""

    def _make(role: str, sub: str | None = None):
        sub = sub or f"{role}-1"
        respx_mock.get(f"{REST}/profiles", params={"id": f"eq.{sub}", "select": "role,full_name"}).respond(
            json=[{"role": role, "full_name": f"{role.title()} User"}]
        )
        return {"Authorization": f"Bearer {make_token(sub)}"}

    return _make
