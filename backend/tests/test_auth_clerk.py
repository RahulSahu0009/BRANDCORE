"""
BRANDCORE — Clerk JWT verification tests (Phase 8).

Tests the clerk.py module without cryptography (incompatible with Pyodide).
Uses manual JWT construction and pow()-based RSA verification.
"""
import json
import time
import base64
import pytest
import asyncio

from app.auth.clerk import (
    ClerkJwksClient,
    ClerkTokenError,
    ClerkUser,
    _b64url_decode_int,
    _verify_rs256,
    verify_clerk_token,
    get_current_clerk_user,
)
from app.repositories.base import SqliteD1Wrapper
import sqlite3


# ---------------------------------------------------------------------------
# Test helpers — manual JWT construction (no cryptography needed)
# ---------------------------------------------------------------------------

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_encode_int(n: int) -> str:
    byte_len = (n.bit_length() + 7) // 8
    b = n.to_bytes(byte_len, "big")
    return _b64url_encode(b)


def _b64url_decode(s: str) -> bytes:
    s += "=" * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _make_test_rsa_keys():
    """Create an RSA key pair large enough for PKCS1v15 + SHA-256 (n >= 62 bytes)."""
    p = 35266053634686052938309530226969642664875036148642404703946719364681381547727
    q = 59972968026624986469039251814715029652175551136931434126731028296099556066461
    n = p * q  # 510 bits = 64 bytes
    phi = (p - 1) * (q - 1)
    e = 65537
    d = pow(e, -1, phi)
    return {"n": n, "e": e, "d": d, "p": p, "q": q}


def _sign_with_rsa_private_key(signing_input: str, d: int, n: int) -> str:
    """Sign using RSA private key: sig = H(signing_input)^d mod n."""
    import hashlib
    h = hashlib.sha256(signing_input.encode("utf-8")).digest()
    # PKCS1v15 padding: 0x00 || 0x01 || PS(0xFF) || 0x00 || DigestInfo(SHA-256) || hash
    sha256_digest_info = bytes.fromhex("3031300d060960864801650304020105000420")
    t = sha256_digest_info + h
    k = (n.bit_length() + 7) // 8
    ps_len = k - len(t) - 3
    ps = b"\xff" * ps_len
    em = b"\x00\x01" + ps + b"\x00" + t
    m = int.from_bytes(em, "big")
    sig = pow(m, d, n)
    sig_bytes = sig.to_bytes(k, "big")
    return _b64url_encode(sig_bytes)


def _make_jwk(n: int, e: int, kid: str = "test-key-1") -> dict:
    return {
        "kty": "RSA",
        "kid": kid,
        "use": "sig",
        "alg": "RS256",
        "n": _b64url_encode_int(n),
        "e": _b64url_encode_int(e),
    }


def _make_manual_jwt(
    d: int,
    n: int,
    claims: dict,
    kid: str = "test-key-1",
    alg: str = "RS256",
) -> str:
    """Create a manually signed JWT (no cryptography library needed)."""
    header = {"alg": alg, "typ": "JWT", "kid": kid}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    claims_b64 = _b64url_encode(json.dumps(claims, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{claims_b64}"
    sig_b64 = _sign_with_rsa_private_key(signing_input, d, n)
    return f"{signing_input}.{sig_b64}"


def _make_valid_claims(
    user_id: str = "user_123",
    org_id: str = "org_123",
    org_role: str = "org:admin",
    issuer: str = "https://clerk.example.com",
    azp: str | None = None,
    expired: bool = False,
    no_sub: bool = False,
    no_org: bool = False,
) -> dict:
    now = int(time.time())
    claims = {}
    if not no_sub:
        claims["sub"] = user_id
    claims["iss"] = issuer
    claims["iat"] = now
    if not no_org:
        claims["org_id"] = org_id
        claims["org_role"] = org_role
        claims["org_permissions"] = ["org:system_memberships:read"]
    claims["email"] = "test@example.com"
    if expired:
        claims["exp"] = now - 3600
    else:
        claims["exp"] = now + 3600
    if azp:
        claims["azp"] = azp
    return claims


# ---------------------------------------------------------------------------
# Test keys fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def rsa_keys():
    return _make_test_rsa_keys()


@pytest.fixture
def jwk(rsa_keys):
    return _make_jwk(rsa_keys["n"], rsa_keys["e"])


@pytest.fixture
def jwks_client(jwk):
    async def fake_fetch(url):
        return {"keys": [jwk]}
    return ClerkJwksClient(issuer_url="https://clerk.example.com", fetch_fn=fake_fetch)


def _async_verify(jwks_client, token, issuer_url, authorized_party=None):
    return asyncio.run(
        verify_clerk_token(
            token=token,
            issuer_url=issuer_url,
            jwks_client=jwks_client,
            authorized_party=authorized_party,
        )
    )


# ---------------------------------------------------------------------------
# RSA pow() verification tests
# ---------------------------------------------------------------------------

class TestRs256PowVerification:
    """Test pow()-based RSA-PKCS1v15 signature verification."""

    def test_valid_signature_verifies(self, rsa_keys, jwk):
        claims = _make_valid_claims()
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims)
        signing_input, sig_b64 = token.rsplit(".", 1)

        result = _verify_rs256(signing_input, sig_b64, jwk)
        assert result is True

    def test_tampered_signature_fails(self, rsa_keys, jwk):
        claims = _make_valid_claims()
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims)
        signing_input, _ = token.rsplit(".", 1)

        tampered_sig = _b64url_encode(b"\x00" * 256)
        result = _verify_rs256(signing_input, tampered_sig, jwk)
        assert result is False

    def test_tampered_payload_fails(self, rsa_keys, jwk):
        claims = _make_valid_claims()
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims)
        header_b64, payload_b64, sig_b64 = token.split(".")

        # Tamper with the payload (but keep the same signature)
        tampered_token = f"{header_b64}.{payload_b64}tampered.{sig_b64}"
        signing_input = f"{header_b64}.{payload_b64}tampered"

        result = _verify_rs256(signing_input, sig_b64, jwk)
        assert result is False


# ---------------------------------------------------------------------------
# Token verification tests
# ---------------------------------------------------------------------------

class TestVerifyClerkToken:
    """Test verify_clerk_token with various token scenarios."""

    def test_valid_token_returns_user(self, rsa_keys, jwks_client):
        claims = _make_valid_claims()
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims)

        user = _async_verify(jwks_client, token, "https://clerk.example.com")
        assert isinstance(user, ClerkUser)
        assert user.user_id == "user_123"
        assert user.org_id == "org_123"
        assert user.org_role == "org:admin"
        assert user.is_authenticated
        assert user.has_organization

    def test_empty_token_raises(self, jwks_client):
        with pytest.raises(ClerkTokenError):
            _async_verify(jwks_client, "", "https://clerk.example.com")

    def test_invalid_algorithm_raises(self, rsa_keys, jwks_client):
        claims = _make_valid_claims()
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims, alg="HS256")

        with pytest.raises(ClerkTokenError) as exc:
            _async_verify(jwks_client, token, "https://clerk.example.com")
        assert "Unsupported algorithm" in str(exc.value)

    def test_expired_token_raises(self, rsa_keys, jwks_client):
        claims = _make_valid_claims(expired=True)
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims)

        with pytest.raises(ClerkTokenError) as exc:
            _async_verify(jwks_client, token, "https://clerk.example.com")
        assert "expired" in str(exc.value).lower()

    def test_wrong_issuer_raises(self, rsa_keys, jwks_client):
        claims = _make_valid_claims(issuer="https://evil.example.com")
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims)

        with pytest.raises(ClerkTokenError) as exc:
            _async_verify(jwks_client, token, "https://clerk.example.com")
        assert "issuer" in str(exc.value).lower()

    def test_wrong_authorized_party_raises(self, rsa_keys, jwks_client):
        claims = _make_valid_claims(azp="https://evil.example.com")
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims)

        with pytest.raises(ClerkTokenError) as exc:
            _async_verify(
                jwks_client, token, "https://clerk.example.com",
                authorized_party="https://expected.example.com",
            )
        assert "authorized party" in str(exc.value).lower()

    def test_unknown_kid_raises(self, rsa_keys, jwks_client):
        claims = _make_valid_claims()
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims, kid="nonexistent-key")

        with pytest.raises(ClerkTokenError) as exc:
            _async_verify(jwks_client, token, "https://clerk.example.com")
        assert "Signing key not found" in str(exc.value)

    def test_missing_subject_raises(self, rsa_keys, jwks_client):
        claims = _make_valid_claims(no_sub=True)
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims)

        with pytest.raises(ClerkTokenError) as exc:
            _async_verify(jwks_client, token, "https://clerk.example.com")
        assert "subject" in str(exc.value).lower()

    def test_token_without_org_returns_user_no_org(self, rsa_keys, jwks_client):
        """User without org_id still gets a ClerkUser, just without org context."""
        claims = _make_valid_claims(no_org=True)
        token = _make_manual_jwt(rsa_keys["d"], rsa_keys["n"], claims)

        user = _async_verify(jwks_client, token, "https://clerk.example.com")
        assert isinstance(user, ClerkUser)
        assert user.user_id == "user_123"
        assert not user.has_organization
        assert user.org_id is None


# ---------------------------------------------------------------------------
# JWKS client tests
# ---------------------------------------------------------------------------

class TestJwksClient:
    def test_get_signing_key_returns_matching_jwk(self, jwk):
        async def fake_fetch(url):
            return {"keys": [jwk]}

        client = ClerkJwksClient(issuer_url="https://clerk.example.com", fetch_fn=fake_fetch)
        result = asyncio.run(client.get_signing_key("test-key-1"))
        assert result is not None
        assert result["kid"] == "test-key-1"

    def test_get_signing_key_unknown_kid_returns_none(self, jwk):
        async def fake_fetch(url):
            return {"keys": [jwk]}

        client = ClerkJwksClient(issuer_url="https://clerk.example.com", fetch_fn=fake_fetch)
        result = asyncio.run(client.get_signing_key("nonexistent-key"))
        assert result is None


# ---------------------------------------------------------------------------
# get_current_clerk_user dependency tests
# ---------------------------------------------------------------------------

class TestGetCurrentClerkUser:
    def _make_request(self, headers=None, env_vars=None):
        scope = {
            "type": "http", "method": "GET", "path": "/api/test",
            "headers": [], "query_string": b"", "client": ("127.0.0.1", 12345),
            "server": ("testserver", 80), "scheme": "http", "root_path": "",
            "path_params": {}, "env": None,
        }
        if env_vars:
            class Env:
                def __init__(self, vars_dict):
                    for k, v in vars_dict.items():
                        setattr(self, k, v)
            scope["env"] = Env(env_vars)
        if headers:
            for k, v in headers.items():
                scope["headers"].append([k.encode(), v.encode()])
        return type("Request", (), {"scope": scope, "headers": dict(scope["headers"])})()

    def test_missing_authorization_header_raises_401(self):
        from fastapi import HTTPException
        request = self._make_request(env_vars={"CLERK_ISSUER_URL": "https://clerk.example.com"})

        async def run():
            try:
                await get_current_clerk_user(request)
                return None
            except HTTPException as exc:
                return exc

        exc = asyncio.run(run())
        assert exc is not None
        assert exc.status_code == 401
        assert "Missing authorization header" in exc.detail

    def test_invalid_auth_scheme_raises_401(self):
        from fastapi import HTTPException
        request = self._make_request(
            headers={"authorization": "Basic dXNlcjpwYXNz"},
            env_vars={"CLERK_ISSUER_URL": "https://clerk.example.com"},
        )

        async def run():
            try:
                await get_current_clerk_user(request)
                return None
            except HTTPException as exc:
                return exc

        exc = asyncio.run(run())
        assert exc is not None
        assert exc.status_code == 401

    def test_missing_issuer_config_raises_401(self):
        from fastapi import HTTPException
        request = self._make_request(
            headers={"authorization": "Bearer fake.token.here"},
            env_vars={},
        )

        async def run():
            try:
                await get_current_clerk_user(request)
                return None
            except HTTPException as exc:
                return exc

        exc = asyncio.run(run())
        assert exc is not None
        assert exc.status_code == 401

    def test_no_env_raises_401(self):
        from fastapi import HTTPException
        request = self._make_request(
            headers={"authorization": "Bearer fake.token.here"},
            env_vars=None,
        )

        async def run():
            try:
                await get_current_clerk_user(request)
                return None
            except HTTPException as exc:
                return exc

        exc = asyncio.run(run())
        assert exc is not None
        assert exc.status_code == 401
