import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from app.models.schemas import ResearchActionSchema, PaperRecord
from app.core.ssrf_guard import is_safe_external_url

class ApprovalService:
    """
    Human-in-the-Loop Approval Queue:
    Manages proposed consequential actions (PDF downloads, bibliography exports, batch storage).
    Enforces cryptographic hashing (SHA-256), idempotency, SSRF pre-flight validation,
    and records immutable audit trails.
    """

    def compute_action_hash(self, action_type: str, run_id: str, proposed_changes: Dict[str, Any]) -> str:
        """
        Calculates SHA-256 hash over canonical serialized proposed changes.
        """
        payload = {
            "action_type": action_type,
            "run_id": run_id,
            "changes": proposed_changes
        }
        serialized = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def stage_pdf_download_action(
        self,
        user_id: str,
        run_id: str,
        papers: List[PaperRecord]
    ) -> Tuple[ResearchActionSchema, List[str]]:
        """
        Stages a PDF download action for human review.
        Evaluates open-access eligibility, checks for paywalls, runs SSRF security checks.
        Returns:
            (staged_action, list_of_warnings)
        """
        warnings: List[str] = []
        proposed_files: List[Dict[str, Any]] = []

        for paper in papers:
            # Check access status
            access_status = paper.access.status if paper.access else "ACCESS_UNKNOWN"
            pdf_url = paper.access.pdf_url if paper.access else None

            if access_status != "OPEN_ACCESS_VERIFIED" or not pdf_url:
                warnings.append(
                    f"Skipping PDF for '{paper.canonical_title[:40]}...': Status is {access_status}. "
                    f"Direct download prohibited without verified open-access repository rights."
                )
                continue

            # SSRF check on target PDF URL
            is_safe, reason = is_safe_external_url(pdf_url)
            if not is_safe:
                warnings.append(
                    f"Security Block for '{paper.canonical_title[:40]}...': SSRF violation ({reason})."
                )
                continue

            # Propose target storage path
            sanitized_title = "".join(c for c in paper.canonical_title[:30] if c.isalnum() or c in (' ', '_', '-')).strip()
            filename = f"{sanitized_title.replace(' ', '_')}_{paper.id[:8]}.pdf"
            storage_path = f"{user_id}/{run_id}/{filename}"

            proposed_files.append({
                "paper_id": paper.id,
                "title": paper.canonical_title,
                "source_url": pdf_url,
                "destination_bucket": "littrust-artifacts",
                "destination_path": storage_path,
                "filename": filename,
                "access_source": paper.access.access_source if paper.access else "Open Repository",
                "license": paper.access.license_url if paper.access else "Open"
            })

        proposed_changes = {
            "proposed_files": proposed_files,
            "file_count": len(proposed_files),
            "warnings": warnings,
            "destination_storage": "Supabase Private Storage (littrust-artifacts)"
        }

        action_hash = self.compute_action_hash("DOWNLOAD_PDF", run_id, proposed_changes)
        idempotency_key = f"action_{run_id}_{action_hash[:16]}"

        action = ResearchActionSchema(
            id=str(uuid.uuid4()),
            user_id=user_id,
            research_run_id=run_id,
            action_type="DOWNLOAD_PDF",
            proposed_changes=proposed_changes,
            action_hash=action_hash,
            idempotency_key=idempotency_key,
            status="PENDING",
            created_at=datetime.now(timezone.utc).isoformat()
        )

        return action, warnings
