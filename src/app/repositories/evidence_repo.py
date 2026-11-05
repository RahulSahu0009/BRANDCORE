"""
M2-05 — Evidence repository.

All queries are workspace-scoped.
"""
from app.domain.models import Evidence, EvidenceCreate, ListResult, now_utc
from app.repositories.base import BaseRepository


class EvidenceRepository(BaseRepository):
    async def create(self, evidence_id: str, workspace_id: str, data: EvidenceCreate) -> Evidence:
        created = now_utc()
        await self._run(
            """
            INSERT INTO evidence (id, workspace_id, title, source_type, summary,
                source_url, version, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, 'active', ?)
            """,
            (evidence_id, workspace_id, data.title, data.source_type, data.summary,
             data.source_url, created),
        )
        return await self.get(evidence_id, workspace_id)

    async def get(self, evidence_id: str, workspace_id: str) -> Evidence | None:
        row = await self._first(
            "SELECT * FROM evidence WHERE id = ? AND workspace_id = ?",
            (evidence_id, workspace_id),
        )
        return Evidence(**row) if row else None

    async def list_by_workspace(self, workspace_id: str, status: str | None = None) -> ListResult:
        if status is not None:
            rows = await self._all(
                "SELECT * FROM evidence WHERE workspace_id = ? AND status = ? "
                "ORDER BY title",
                (workspace_id, status),
            )
        else:
            rows = await self._all(
                "SELECT * FROM evidence WHERE workspace_id = ? ORDER BY title",
                (workspace_id,),
            )
        return ListResult(items=[Evidence(**r) for r in rows], total=len(rows))

    async def update(self, evidence_id: str, workspace_id: str, data: EvidenceCreate) -> Evidence | None:
        current = await self._first(
            """
            SELECT * FROM evidence
            WHERE workspace_id = ? AND status = 'active'
              AND (id = ? OR id LIKE ? || '-v%')
            ORDER BY version DESC
            LIMIT 1
            """,
            (workspace_id, evidence_id, evidence_id),
        )
        if current is None:
            return None
        new_id = f"{evidence_id}-v{current['version'] + 1}"
        await self._run(
            """
            INSERT INTO evidence (id, workspace_id, title, source_type, summary,
                source_url, version, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
            """,
            (new_id, workspace_id, data.title, data.source_type, data.summary,
             data.source_url, current["version"] + 1, now_utc()),
        )
        await self._run(
            "UPDATE evidence SET status = 'superseded' WHERE id = ? AND workspace_id = ?",
            (current["id"], workspace_id),
        )
        return await self.get(new_id, workspace_id)

    async def list_versions(self, evidence_id: str, workspace_id: str) -> ListResult:
        rows = await self._all(
            "SELECT * FROM evidence WHERE id = ? AND workspace_id = ? "
            "ORDER BY version DESC",
            (evidence_id, workspace_id),
        )
        return ListResult(items=[Evidence(**r) for r in rows], total=len(rows))
