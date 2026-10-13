"""Thin async clients for Supabase PostgREST and the GoTrue admin API.

`UserDB` forwards the caller's own JWT, so every query runs under Postgres
Row Level Security as that user — the API's role checks are a first line of
defence, RLS is the backstop. `AuthAdmin` uses the service-role key and is
only used for creating / deleting auth users.
"""

from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings

_http: httpx.AsyncClient | None = None


def http() -> httpx.AsyncClient:
    global _http
    if _http is None:
        _http = httpx.AsyncClient(timeout=httpx.Timeout(15.0))
    return _http


async def close_http() -> None:
    global _http
    if _http is not None:
        await _http.aclose()
        _http = None


def _raise_for(resp: httpx.Response) -> None:
    if resp.is_success:
        return
    try:
        body = resp.json()
        detail = body.get("message") or body.get("msg") or body.get("error_description") or body
    except ValueError:
        body, detail = {}, resp.text
    code = body.get("code") if isinstance(body, dict) else None
    # Map common Postgres errors to sensible HTTP statuses.
    if code == "23505":
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(detail))
    if code in ("42501", "PGRST301") or resp.status_code in (401, 403):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not permitted")
    if code in ("23503", "23514", "22P02"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(detail))
    if resp.status_code == 404:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(detail))
    raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=f"Supabase error: {detail}")


class UserDB:
    def __init__(self, token: str):
        s = get_settings()
        self._base = s.rest_url
        self._headers = {
            "apikey": s.supabase_anon_key,
            "Authorization": f"Bearer {token}",
        }

    async def select(self, table: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
        resp = await http().get(f"{self._base}/{table}", params=params or {}, headers=self._headers)
        _raise_for(resp)
        return resp.json()

    async def select_one(self, table: str, params: dict[str, str]) -> dict[str, Any] | None:
        rows = await self.select(table, {**params, "limit": "1"})
        return rows[0] if rows else None

    async def insert(
        self,
        table: str,
        data: dict[str, Any] | list[dict[str, Any]],
        *,
        upsert_on: str | None = None,
    ) -> list[dict[str, Any]]:
        prefer = ["return=representation"]
        params: dict[str, str] = {}
        if upsert_on:
            prefer.append("resolution=merge-duplicates")
            params["on_conflict"] = upsert_on
        resp = await http().post(
            f"{self._base}/{table}",
            params=params,
            json=data,
            headers={**self._headers, "Prefer": ",".join(prefer)},
        )
        _raise_for(resp)
        return resp.json()

    async def update(self, table: str, match: dict[str, str], data: dict[str, Any]) -> list[dict[str, Any]]:
        resp = await http().patch(
            f"{self._base}/{table}",
            params=match,
            json=data,
            headers={**self._headers, "Prefer": "return=representation"},
        )
        _raise_for(resp)
        return resp.json()

    async def delete(self, table: str, match: dict[str, str]) -> list[dict[str, Any]]:
        resp = await http().delete(
            f"{self._base}/{table}",
            params=match,
            headers={**self._headers, "Prefer": "return=representation"},
        )
        _raise_for(resp)
        return resp.json()


class AuthAdmin:
    def __init__(self) -> None:
        s = get_settings()
        if not s.supabase_service_key:
            raise HTTPException(
                status.HTTP_501_NOT_IMPLEMENTED,
                detail="SUPABASE_SERVICE_KEY is not configured; user management is disabled.",
            )
        self._base = s.auth_url
        self._headers = {
            "apikey": s.supabase_service_key,
            "Authorization": f"Bearer {s.supabase_service_key}",
        }

    async def create_user(self, *, email: str, password: str, full_name: str, role: str) -> dict[str, Any]:
        resp = await http().post(
            f"{self._base}/admin/users",
            json={
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name},
                "app_metadata": {"role": role},
            },
            headers=self._headers,
        )
        if resp.status_code == 422:
            raise HTTPException(status.HTTP_409_CONFLICT, detail=resp.json().get("msg", "User exists"))
        _raise_for(resp)
        return resp.json()

    async def update_role(self, user_id: str, role: str) -> None:
        resp = await http().put(
            f"{self._base}/admin/users/{user_id}",
            json={"app_metadata": {"role": role}},
            headers=self._headers,
        )
        _raise_for(resp)

    async def delete_user(self, user_id: str) -> None:
        resp = await http().delete(f"{self._base}/admin/users/{user_id}", headers=self._headers)
        _raise_for(resp)
