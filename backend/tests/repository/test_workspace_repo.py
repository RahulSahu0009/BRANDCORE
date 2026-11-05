"""
M2-05 workspace repository tests.

Runs the real WorkspaceRepository against an in-memory SQLite database through
the SqliteD1Wrapper (same async D1 interface used at runtime). Async repository
methods are executed with asyncio.run(); no pytest-asyncio plugin required.
"""
import asyncio
import os
import sqlite3

import pytest

from app.domain.models import WorkspaceCreate, WorkspaceUpdate
from app.repositories.base import SqliteD1Wrapper
from app.repositories.workspace_repo import WorkspaceRepository


def _db():
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    mig_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "database", "migrations")
    )
    for name in ("0001_poc_records.sql", "0002_core_data_foundation.sql"):
        with open(os.path.join(mig_dir, name), encoding="utf-8") as f:
            conn.executescript(f.read())
    return SqliteD1Wrapper(conn)


def _run(coro):
    return asyncio.run(coro)


@pytest.fixture
def repo():
    return WorkspaceRepository(_db())


def test_create_and_get_workspace(repo):
    w = _run(repo.create("ws-1", WorkspaceCreate(name="Demo Brand", slug="demo-brand")))
    assert w.id == "ws-1"
    assert w.name == "Demo Brand"
    assert w.slug == "demo-brand"
    fetched = _run(repo.get("ws-1"))
    assert fetched is not None
    assert fetched.id == "ws-1"


def test_get_missing_workspace(repo):
    assert _run(repo.get("nope")) is None


def test_get_by_slug(repo):
    _run(repo.create("ws-1", WorkspaceCreate(name="Demo Brand", slug="demo-brand")))
    w = _run(repo.get_by_slug("demo-brand"))
    assert w is not None and w.id == "ws-1"
    assert _run(repo.get_by_slug("missing")) is None


def test_list_workspaces(repo):
    _run(repo.create("ws-1", WorkspaceCreate(name="Brand B", slug="brand-b", status="archived")))
    _run(repo.create("ws-2", WorkspaceCreate(name="Brand A", slug="brand-a")))
    all_ws = _run(repo.list())
    assert all_ws.total == 2
    active = _run(repo.list(status="active"))
    assert active.total == 1
    assert active.items[0].name == "Brand A"


def test_update_workspace(repo):
    _run(repo.create("ws-1", WorkspaceCreate(name="Demo", slug="demo")))
    updated = _run(repo.update("ws-1", WorkspaceUpdate(name="Renamed")))
    assert updated is not None
    assert updated.name == "Renamed"
    assert updated.slug == "demo"


def test_workspace_isolation(repo):
    _run(repo.create("ws-1", WorkspaceCreate(name="One", slug="one")))
    _run(repo.create("ws-2", WorkspaceCreate(name="Two", slug="two")))
    w = _run(repo.get("ws-1"))
    assert w.id == "ws-1" and w.name == "One"
