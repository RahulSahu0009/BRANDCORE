"""
M2-06 — Verification finding repository.

All queries are workspace-scoped. Findings are grouped by analysis_batch_id.
"""
from app.domain.models import ListResult, VerificationFinding, VerificationFindingCreate, now_utc
from app.repositories.base import BaseRepository


class VerificationFindingRepository(BaseRepository):
    async def create(self, finding_id: str, workspace_id: str, data: VerificationFindingCreate) -> VerificationFinding:
        created = now_utc()
        await self._run(
            """
            INSERT INTO verification_finding
                (id, workspace_id, content_version_id, claim_id, finding_type,
                 severity, explanation, suggested_correction, analysis_batch_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                finding_id, workspace_id, data.content_version_id, data.claim_id,
                data.finding_type, data.severity, data.explanation, data.suggested_correction,
                data.analysis_batch_id, created,
            ),
        )
        return await self.get(finding_id, workspace_id)

    async def get(self, finding_id: str, workspace_id: str) -> VerificationFinding | None:
        row = await self._first(
            "SELECT * FROM verification_finding WHERE id = ? AND workspace_id = ?",
            (finding_id, workspace_id),
        )
        return VerificationFinding(**row) if row else None

    async def list_by_version(
        self, content_version_id: str, workspace_id: str
    ) -> ListResult:
        rows = await self._all(
            """
            SELECT * FROM verification_finding
            WHERE content_version_id = ? AND workspace_id = ?
            ORDER BY created_at
            """,
            (content_version_id, workspace_id),
        )
        return ListResult(items=[VerificationFinding(**r) for r in rows], total=len(rows))

    async def list_by_batch(
        self, analysis_batch_id: str, workspace_id: str
    ) -> ListResult:
        rows = await self._all(
            """
            SELECT * FROM verification_finding
            WHERE analysis_batch_id = ? AND workspace_id = ?
            ORDER BY created_at
            """,
            (analysis_batch_id, workspace_id),
        )
        return ListResult(items=[VerificationFinding(**r) for r in rows], total=len(rows))

    async def list_by_version_and_type(
        self, content_version_id: str, workspace_id: str, finding_type: str
    ) -> ListResult:
        rows = await self._all(
            """
            SELECT * FROM verification_finding
            WHERE content_version_id = ? AND workspace_id = ? AND finding_type = ?
            ORDER BY created_at
            """,
            (content_version_id, workspace_id, finding_type),
        )
        return ListResult(items=[VerificationFinding(**r) for r in rows], total=len(rows))
