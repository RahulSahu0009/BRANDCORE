"""
POC route guard tests — M1 security control.

The Cloudflare Workers ASGI runtime injects bindings into request.scope["env"].
These tests replicate that mechanism using a thin ASGI middleware wrapper that
sets scope["env"] before the request reaches FastAPI, so the dependency under
test (require_development_env) sees exactly what it would see in production.

No AI inference is made. No real Cloudflare bindings are used.
"""
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from app.api.poc import router as poc_router
from app.api.dependencies import require_development_env


def _make_fresh_app():
    app = FastAPI()
    app.include_router(
        poc_router, prefix="/api",
        dependencies=[Depends(require_development_env)],
    )
    return app


class _FakeEnv:
    """Minimal env object carrying only BRANDCORE_ENV, like a Workers binding."""
    def __init__(self, brandcore_env):
        self.BRANDCORE_ENV = brandcore_env


class _ScopeEnvMiddleware:
    """
    ASGI middleware that injects a fake env object into scope["env"].
    Mirrors what the Cloudflare Workers ASGI runtime does before handing
    the request to the FastAPI app.
    """
    def __init__(self, app, env):
        self._app = app
        self._env = env

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            scope["env"] = self._env
        await self._app(scope, receive, send)


def _client_with_env(brandcore_env, raise_server_exceptions: bool = True) -> TestClient:
    app = _make_fresh_app()
    wrapped = _ScopeEnvMiddleware(app, _FakeEnv(brandcore_env))
    return TestClient(wrapped, raise_server_exceptions=raise_server_exceptions)


def _client_with_no_env() -> TestClient:
    """Simulates a request where scope['env'] is absent (no Workers runtime)."""
    app = _make_fresh_app()
    return TestClient(app)


# --- development: guard passes, route is reached (binding error = 500, not 404) ---

def test_poc_d1_accessible_in_development():
    # Guard passes → route handler runs → env.DB missing → 500, not 404.
    client = _client_with_env("development", raise_server_exceptions=False)
    assert client.post("/api/poc/d1").status_code != 404


def test_poc_r2_accessible_in_development():
    client = _client_with_env("development", raise_server_exceptions=False)
    assert client.post("/api/poc/r2").status_code != 404


def test_poc_ai_accessible_in_development():
    client = _client_with_env("development", raise_server_exceptions=False)
    assert client.post("/api/poc/ai").status_code != 404


# --- production: POC routes must return 404 ---

def test_poc_d1_hidden_in_production():
    client = _client_with_env("production")
    assert client.post("/api/poc/d1").status_code == 404


def test_poc_r2_hidden_in_production():
    client = _client_with_env("production")
    assert client.post("/api/poc/r2").status_code == 404


def test_poc_ai_hidden_in_production():
    client = _client_with_env("production")
    assert client.post("/api/poc/ai").status_code == 404


# --- missing env: must fail closed ---

def test_poc_hidden_when_env_missing():
    """No scope['env'] at all — must return 404, not 500."""
    client = _client_with_no_env()
    assert client.post("/api/poc/d1").status_code == 404


# --- unknown environment value: must fail closed ---

def test_poc_hidden_for_unknown_env_value():
    client = _client_with_env("staging")
    assert client.post("/api/poc/d1").status_code == 404


# --- disabled (top-level wrangler.jsonc default): must fail closed ---

def test_poc_hidden_when_disabled():
    """BRANDCORE_ENV='disabled' is the wrangler.jsonc top-level default. Must return 404."""
    client = _client_with_env("disabled")
    assert client.post("/api/poc/d1").status_code == 404


def test_poc_r2_hidden_when_disabled():
    client = _client_with_env("disabled")
    assert client.post("/api/poc/r2").status_code == 404


def test_poc_ai_hidden_when_disabled():
    client = _client_with_env("disabled")
    assert client.post("/api/poc/ai").status_code == 404
