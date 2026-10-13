"""Verify Supabase-issued access tokens.

Supports both signing modes Supabase offers:
  * Legacy shared secret (HS256) — set SUPABASE_JWT_SECRET.
  * Asymmetric signing keys (RS256/ES256) — verified against the project's
    JWKS endpoint, fetched and cached by PyJWKClient.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import jwt
from fastapi import HTTPException, status

from app.core.config import get_settings

_ASYMMETRIC = ["RS256", "ES256", "EdDSA"]


@lru_cache
def _jwks_client() -> jwt.PyJWKClient:
    s = get_settings()
    return jwt.PyJWKClient(f"{s.auth_url}/.well-known/jwks.json", cache_keys=True, lifespan=600)


def _unauthorized(msg: str) -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED, detail=msg, headers={"WWW-Authenticate": "Bearer"}
    )


def verify_token(token: str) -> dict[str, Any]:
    s = get_settings()
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        if alg == "HS256":
            if not s.supabase_jwt_secret:
                raise _unauthorized("HS256 tokens require SUPABASE_JWT_SECRET")
            key: Any = s.supabase_jwt_secret
            algorithms = ["HS256"]
        elif alg in _ASYMMETRIC:
            key = _jwks_client().get_signing_key_from_jwt(token).key
            algorithms = [alg]
        else:
            raise _unauthorized("Unsupported token algorithm")

        claims = jwt.decode(
            token,
            key,
            algorithms=algorithms,
            audience=s.jwt_audience,
            issuer=s.auth_url,
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise _unauthorized("Token expired") from exc
    except jwt.PyJWTError as exc:
        raise _unauthorized("Invalid token") from exc
    return claims
