"""
M2-05 — Terminology repository.

All queries are workspace-scoped. One entry per term per workspace.
"""
from app.domain.models import ListResult, Terminology, now_utc
from app.repositories.base import BaseRepository


class TerminologyRepository(BaseRepository):
    async def list_by_workspace(self, workspace_id: str,
                                status: str | None = None) -> ListResult:
        if status is not None:
            rows = await self._all(
                "SELECT * FROM terminology WHERE workspace_id = ? AND status = ? "
                "ORDER BY term",
                (workspace_id, status),
            )
        else:
            rows = await self._all(
                "SELECT * FROM terminology WHERE workspace_id = ? ORDER BY term",
                (workspace_id,),
            )
        return ListResult(items=[Terminology(**r) for r in rows], total=len(rows))

    async def get_by_term(self, workspace_id: str, term: str) -> Terminology | None:
        row = await self._first(
            "SELECT * FROM terminology WHERE workspace_id = ? AND term = ?",
            (workspace_id, term),
        )
        return Terminology(**row) if row else None
