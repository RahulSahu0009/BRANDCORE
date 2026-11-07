"""
BRANDCORE — API protection tests (Phase 8).

Tests that:
- Health endpoint remains public (no auth required)
- Analyze endpoint requires Clerk authentication (401 without token)
- POC routes remain blocked outside development
- All product routes reject unauthenticated requests
"""
import sqlite3
import asyncio
import pytest

from app.api.dependencies import require_development_env
from app.auth.dependencies import require_workspace_access
from app.auth.clerk import get_current_clerk_user, ClerkUser
from app.repositories.base import SqliteD1Wrapper
from app.main import app


# ---------------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------------

def _setup_test_db():
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS workspace (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            slug        TEXT NOT NULL,
            demo_flag   INTEGER NOT NULL DEFAULT 1,
            status      TEXT NOT NULL DEFAULT 'active',
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL,
            UNIQUE (slug)
        );
        CREATE TABLE IF NOT EXISTS workspace_org_mapping (
            id          TEXT NOT NULL,
            workspace_id TEXT NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
            org_id      TEXT NOT NULL,
            created_by  TEXT NOT NULL,
            created_at  TEXT NOT NULL,
            PRIMARY KEY (id),
            UNIQUE (workspace_id),
            UNIQUE (org_id)
        );
    """)
    conn.execute(
        "INSERT INTO workspace (id, name, slug, demo_flag, status, created_at, updated_at) "
        "VALUES ('ws-1', 'Test Workspace', 'ws-1', 1, 'active', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')"
    )
    conn.execute(
        "INSERT INTO workspace_org_mapping (id, workspace_id, org_id, created_by, created_at) "
        "VALUES ('map-1', 'ws-1', 'org-1', 'user-1', '2026-01-01T00:00:00Z')"
    )
    conn.commit()
    return conn


def _make_request(path_params=None, headers=None, env_vars=None):
    scope = {
        "type": "http", "method": "GET", "path": "/api/test",
        "headers": [], "query_string": b"", "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80), "scheme": "http", "root_path": "",
        "path_params": path_params or {}, "env": None,
    }
    if env_vars:
        class Env:
            def __init__(self, vars_dict):
                for k, v in vars_dict.items():
                    setattr(self, k, v)
        scope["env"] = Env(env_vars)
    if headers:
        for k, v in headers.items():
            scope["headers"].append([k.lower().encode(), v.encode()])
    return type("Request", (), {"scope": scope, "headers": dict(scope["headers"]), "path_params": path_params or {}})()


def _run_async(coro):
    return asyncio.run(coro)


# ---------------------------------------------------------------------------
# Health endpoint — public (no auth)
# ---------------------------------------------------------------------------

class TestHealthPublic:
    def test_health_route_exists(self):
        from app.api.health import router as health_router
        routes = [r.path for r in health_router.routes]
        assert "/health" in routes

    def test_health_has_no_auth_dependency(self):
        from app.api.health import router as health_router
        for route in health_router.routes:
            if hasattr(route, "path") and route.path == "/health":
                assert len(route.dependencies) == 0, (
                    "Health endpoint should not require authentication"
                )
                return
        pytest.fail("Health route not found in health router")


# ---------------------------------------------------------------------------
# POC route guard — blocked outside development
# ---------------------------------------------------------------------------

class TestPocGuard:
    def test_require_development_env_blocks_production(self):
        request = _make_request(env_vars={"BRANDCORE_ENV": "production"})
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            _run_async(require_development_env(request))
        assert exc.value.status_code == 404

    def test_require_development_env_blocks_missing_env(self):
        request = _make_request(env_vars={})
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            _run_async(require_development_env(request))
        assert exc.value.status_code == 404

    def test_require_development_env_blocks_disabled(self):
        request = _make_request(env_vars={"BRANDCORE_ENV": "disabled"})
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            _run_async(require_development_env(request))
        assert exc.value.status_code == 404

    def test_require_development_env_passes_development(self):
        conn = _setup_test_db()
        wrapper = SqliteD1Wrapper(conn)
        request = _make_request(env_vars={"BRANDCORE_ENV": "development", "DB": wrapper})
        _run_async(require_development_env(request))  # Should not raise


# ---------------------------------------------------------------------------
# Analyze endpoint — requires authentication
# ---------------------------------------------------------------------------

class TestAnalyzeRequiresAuth:
    def test_missing_auth_header_401(self):
        conn = _setup_test_db()
        wrapper = SqliteD1Wrapper(conn)

        request = _make_request(
            path_params={"workspace_id": "ws-1"},
            env_vars={
                "DB": wrapper,
                "CLERK_ISSUER_URL": "https://clerk.example.com",
            },
        )

        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            _run_async(get_current_clerk_user(request))
        assert exc.value.status_code == 401
        assert "Missing authorization header" in exc.value.detail

    def test_invalid_auth_scheme_401(self):
        conn = _setup_test_db()
        wrapper = SqliteD1Wrapper(conn)

        request = _make_request(
            path_params={"workspace_id": "ws-1"},
            headers={"authorization": "Basic some-token"},
            env_vars={
                "DB": wrapper,
                "CLERK_ISSUER_URL": "https://clerk.example.com",
            },
        )

        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            _run_async(get_current_clerk_user(request))
        assert exc.value.status_code == 401

    def test_valid_user_matching_workspace_passes(self):
        conn = _setup_test_db()
        wrapper = SqliteD1Wrapper(conn)

        request = _make_request(
            path_params={"workspace_id": "ws-1"},
            env_vars={
                "DB": wrapper,
                "CLERK_ISSUER_URL": "https://clerk.example.com",
            },
        )

        user = ClerkUser(
            user_id="user-1",
            email="test@example.com",
            org_id="org-1",
            org_role="org:member",
            org_permissions=["org:system_memberships:read"],
            claims={"sub": "user-1", "org_id": "org-1", "org_role": "org:member"},
        )

        dep = require_workspace_access("workspace_id")
        result = _run_async(dep(request, user))
        assert result is user
        assert result.org_id == "org-1"

    def test_cross_org_workspace_access_403(self):
        conn = _setup_test_db()
        wrapper = SqliteD1Wrapper(conn)

        request = _make_request(
            path_params={"workspace_id": "ws-1"},
            env_vars={
                "DB": wrapper,
                "CLERK_ISSUER_URL": "https://clerk.example.com",
            },
        )

        user = ClerkUser(
            user_id="user-2",
            email="test2@example.com",
            org_id="org-2",
            org_role="org:member",
            org_permissions=["org:system_memberships:read"],
            claims={"sub": "user-2", "org_id": "org-2", "org_role": "org:member"},
        )

        dep = require_workspace_access("workspace_id")
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            _run_async(dep(request, user))
        assert exc.value.status_code == 403
        assert "not mapped" in exc.value.detail


# ---------------------------------------------------------------------------
# Analyze router has auth dependency
# ---------------------------------------------------------------------------

class TestAnalyzeRouterAuth:
    def test_analyze_router_has_auth_dependency(self):
        from app.api.analyze import router as analyze_router
        for route in app.routes:
            if hasattr(route, 'include_context'):
                ctx = route.include_context
                if ctx.included_router is analyze_router:
                    assert len(ctx.dependencies) > 0, (
                        "Analyze router has no auth dependencies"
                    )
                    return
        pytest.fail("Analyze router not found in app")
