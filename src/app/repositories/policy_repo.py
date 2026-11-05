"""
M2-05 — Policy repository.

All queries are workspace-scoped. Policies are versioned; old versions preserved.
"""
from app.domain.models import ListResult, Policy
from app.repositories.base import BaseRepository


class PolicyRepository(BaseRepository):
    async def list_by_workspace(self, workspace_id: str,
                                status: str | None = None) -> ListResult:
        if status is not None:
            rows = await self._all(
                "SELECT * FROM policy WHERE workspace_id = ? AND status = ? "
                "ORDER BY name",
                (workspace_id, status),
            )
        else:
            rows = await self._all(
                "SELECT * FROM policy WHERE workspace_id = ? ORDER BY name",
                (workspace_id,),
            )
        return ListResult(items=[Policy(**r) for r in rows], total=len(rows))

    async def get(self, policy_id: str, workspace_id: str) -> Policy | None:
        row = await self._first(
            "SELECT * FROM policy WHERE id = ? AND workspace_id = ?",
            (policy_id, workspace_id),
        )
        return Policy(**row) if row else None
