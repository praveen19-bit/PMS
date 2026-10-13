from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Literal

from fastapi import Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.core.security import verify_token
from app.core.supabase_client import UserDB

Role = Literal["student", "faculty", "dean", "admin"]

_bearer = HTTPBearer(auto_error=False)

# user_id -> (expires_at, role, full_name). Short TTL so role changes apply quickly.
_profile_cache: dict[str, tuple[float, str, str]] = {}


@dataclass
class CurrentUser:
    id: str
    email: str | None
    role: Role
    full_name: str
    db: UserDB

    @property
    def is_staff(self) -> bool:
        return self.role in ("dean", "admin")


def invalidate_profile_cache(user_id: str) -> None:
    _profile_cache.pop(user_id, None)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Missing bearer token", headers={"WWW-Authenticate": "Bearer"}
        )
    token = creds.credentials
    # JWKS lookups may do blocking network I/O on a cold cache.
    claims = await run_in_threadpool(verify_token, token)
    user_id: str = claims["sub"]
    db = UserDB(token)

    now = time.monotonic()
    cached = _profile_cache.get(user_id)
    if cached and cached[0] > now:
        _, role, full_name = cached
    else:
        # The profile row is the source of truth for the app role (RLS uses it too).
        row = await db.select_one("profiles", {"id": f"eq.{user_id}", "select": "role,full_name"})
        if row is None:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No profile exists for this account")
        role, full_name = row["role"], row["full_name"]
        _profile_cache[user_id] = (now + get_settings().profile_cache_ttl, role, full_name)

    return CurrentUser(id=user_id, email=claims.get("email"), role=role, full_name=full_name, db=db)  # type: ignore[arg-type]


def require_role(roles: list[Role]):
    """Dependency factory: `Depends(require_role(["faculty", "dean", "admin"]))`."""

    async def checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Requires role: {', '.join(roles)}")
        return user

    return checker


StaffRoles: list[Role] = ["dean", "admin"]
FacultyAndStaff: list[Role] = ["faculty", "dean", "admin"]
