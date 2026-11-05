"""
M2-07 — Release passport repository.

A release passport is an immutable snapshot created at human approval time.
It records the exact content version, content hash, policy version, and
fact/evidence versions used. Status changes are recorded as release_status_event
rows only; the passport row itself is never updated (DB trigger enforces).
"""
import json
from app.domain.models import (ListResult, ReleasePassport, ReleasePassportCreate,
                               now_utc)
from app.repositories.base import BaseRepository


class ReleasePassportRepository(BaseRepository):
    async def create(self, passport_id: str, workspace_id: str,
                     data: ReleasePassportCreate) -> ReleasePassport | None:
        # Verify content version belongs to workspace.
        version = await self._first(
            """
            SELECT cv.id, cv.content_item_id, cv.sha256_hash
            FROM content_version cv
            WHERE cv.id = ? AND cv.workspace_id = ?
            """,
            (data.content_version_id, workspace_id),
        )
        if version is None:
            return None

        created = now_utc()
        await self._run(
            """
            INSERT INTO release_passport
                (id, workspace_id, content_item_id, content_version_id, content_sha256,
                 policy_version_id, fact_evidence_versions, finding_ids_and_dispositions,
                 approver_id, approver_role, decision_timestamp, audit_reference, status,
                 created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', ?)
            """,
            (
                passport_id, workspace_id, version["content_item_id"],
                data.content_version_id, data.content_sha256, data.policy_version_id,
                data.fact_evidence_versions, data.finding_ids_and_dispositions,
                data.approver_id, data.approver_role, data.decision_timestamp,
                data.audit_reference, created,
            ),
        )
        return await self.get(passport_id, workspace_id)

    async def get(self, passport_id: str, workspace_id: str) -> ReleasePassport | None:
        row = await self._first(
            "SELECT * FROM release_passport WHERE id = ? AND workspace_id = ?",
            (passport_id, workspace_id),
        )
        return ReleasePassport(**row) if row else None

    async def get_by_content_version(self, content_version_id: str,
                                     workspace_id: str) -> ReleasePassport | None:
        row = await self._first(
            "SELECT * FROM release_passport WHERE content_version_id = ? AND workspace_id = ?",
            (content_version_id, workspace_id),
        )
        return ReleasePassport(**row) if row else None

    async def list_by_workspace(self, workspace_id: str,
                                status: str | None = None) -> ListResult:
        if status is not None:
            rows = await self._all(
                "SELECT * FROM release_passport WHERE workspace_id = ? AND status = ? "
                "ORDER BY created_at DESC",
                (workspace_id, status),
            )
        else:
            rows = await self._all(
                "SELECT * FROM release_passport WHERE workspace_id = ? "
                "ORDER BY created_at DESC",
                (workspace_id,),
            )
        return ListResult(items=[ReleasePassport(**r) for r in rows], total=len(rows))

    # No update method: release_passport rows are immutable (DB trigger enforces).
