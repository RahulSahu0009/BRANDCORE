"""
M2-07 — Release status event and audit event repositories.

Both are append-only histories. A status change creates a new event; historical
events are never overwritten or deleted. Current release status is derivable
from the latest event for a passport.
"""
from app.domain.models import (AuditEvent, AuditEventCreate, ListResult,
                               ReleaseStatusEvent, ReleaseStatusEventCreate,
                               now_utc)
from app.repositories.base import BaseRepository


class ReleaseStatusEventRepository(BaseRepository):
    async def create(self, event_id: str, workspace_id: str,
                     data: ReleaseStatusEventCreate) -> ReleaseStatusEvent:
        await self._run(
            """
            INSERT INTO release_status_event
                (id, workspace_id, passport_id, passport_workspace, status,
                 reason, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (event_id, workspace_id, data.passport_id, data.passport_workspace,
             data.status, data.reason, data.timestamp),
        )
        return await self.get(event_id, workspace_id)

    async def get(self, event_id: str, workspace_id: str) -> ReleaseStatusEvent | None:
        row = await self._first(
            "SELECT * FROM release_status_event WHERE id = ? AND workspace_id = ?",
            (event_id, workspace_id),
        )
        return ReleaseStatusEvent(**row) if row else None

    async def list_for_passport(self, passport_id: str,
                                workspace_id: str) -> ListResult:
        rows = await self._all(
            """
            SELECT * FROM release_status_event
            WHERE passport_id = ? AND passport_workspace = ?
            ORDER BY timestamp ASC
            """,
            (passport_id, workspace_id),
        )
        return ListResult(items=[ReleaseStatusEvent(**r) for r in rows], total=len(rows))

    async def current_status(self, passport_id: str,
                             workspace_id: str) -> str | None:
        """Current status = latest event for the passport."""
        row = await self._first(
            """
            SELECT status FROM release_status_event
            WHERE passport_id = ? AND passport_workspace = ?
            ORDER BY timestamp DESC, id DESC
            LIMIT 1
            """,
            (passport_id, workspace_id),
        )
        return row["status"] if row else None

    async def latest_event(self, passport_id: str,
                           workspace_id: str) -> ReleaseStatusEvent | None:
        row = await self._first(
            """
            SELECT * FROM release_status_event
            WHERE passport_id = ? AND passport_workspace = ?
            ORDER BY timestamp DESC, id DESC
            LIMIT 1
            """,
            (passport_id, workspace_id),
        )
        return ReleaseStatusEvent(**row) if row else None

    async def has_status_event(self, passport_id: str, workspace_id: str,
                               status: str) -> bool:
        """Whether a status event of the given type already exists for a passport."""
        row = await self._first(
            """
            SELECT COUNT(*) AS n FROM release_status_event
            WHERE passport_id = ? AND passport_workspace = ? AND status = ?
            """,
            (passport_id, workspace_id, status),
        )
        return (row["n"] if row else 0) > 0


class AuditEventRepository(BaseRepository):
    async def create(self, event_id: str, workspace_id: str,
                     data: AuditEventCreate) -> AuditEvent:
        created = now_utc()
        await self._run(
            """
            INSERT INTO audit_event
                (id, workspace_id, actor_id, actor_role, action, entity_type,
                 entity_id, details, correlation_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (event_id, workspace_id, data.actor_id, data.actor_role, data.action,
             data.entity_type, data.entity_id, data.details, data.correlation_id,
             created),
        )
        return await self.get(event_id, workspace_id)

    async def get(self, event_id: str, workspace_id: str) -> AuditEvent | None:
        row = await self._first(
            "SELECT * FROM audit_event WHERE id = ? AND workspace_id = ?",
            (event_id, workspace_id),
        )
        return AuditEvent(**row) if row else None

    async def list_by_workspace(self, workspace_id: str,
                                action: str | None = None) -> ListResult:
        if action is not None:
            rows = await self._all(
                "SELECT * FROM audit_event WHERE workspace_id = ? AND action = ? "
                "ORDER BY created_at DESC",
                (workspace_id, action),
            )
        else:
            rows = await self._all(
                "SELECT * FROM audit_event WHERE workspace_id = ? ORDER BY created_at DESC",
                (workspace_id,),
            )
        return ListResult(items=[AuditEvent(**r) for r in rows], total=len(rows))

    async def list_by_correlation(self, correlation_id: str,
                                  workspace_id: str) -> ListResult:
        rows = await self._all(
            "SELECT * FROM audit_event WHERE correlation_id = ? AND workspace_id = ? "
            "ORDER BY created_at DESC",
            (correlation_id, workspace_id),
        )
        return ListResult(items=[AuditEvent(**r) for r in rows], total=len(rows))
