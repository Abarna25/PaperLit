import hashlib
import httpx
import logging
import uuid
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from app.models.schemas import StoredArtifactSchema
from app.core.config import settings
from app.core.ssrf_guard import is_safe_external_url

logger = logging.getLogger(__name__)

class ArtifactService:
    """
    Artifact Storage and PDF Verification Service:
    Executes approved downloads, validates magic bytes (%PDF-), computes SHA-256 hashes,
    and coordinates storage in Supabase private storage or local fallback with signed URLs.
    """

    def __init__(self, supabase_client: Optional[Any] = None):
        self.supabase = supabase_client
        self.local_storage_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage_local")
        os.makedirs(self.local_storage_dir, exist_ok=True)

    async def download_and_verify_pdf(
        self,
        user_id: str,
        run_id: str,
        paper_id: str,
        source_url: str,
        filename: str
    ) -> Tuple[bool, Optional[StoredArtifactSchema], Dict[str, Any]]:
        """
        Executes verified download of an approved open-access PDF.
        Returns:
            (success_bool, stored_artifact_schema, execution_audit_dict)
        """
        audit_trail: Dict[str, Any] = {"source_url": source_url, "started_at": datetime.now(timezone.utc).isoformat()}

        # 1. SSRF pre-flight validation
        is_safe, reason = is_safe_external_url(source_url)
        if not is_safe:
            audit_trail["error"] = f"SSRF violation: {reason}"
            return False, None, audit_trail

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(source_url)
                if response.status_code != 200:
                    audit_trail["error"] = f"HTTP error {response.status_code} fetching remote PDF"
                    return False, None, audit_trail

                content = response.content
                size_bytes = len(content)

                # 2. Check size constraints
                if size_bytes == 0:
                    audit_trail["error"] = "Downloaded file is empty (0 bytes)"
                    return False, None, audit_trail
                if size_bytes > settings.MAX_PDF_SIZE_BYTES:
                    audit_trail["error"] = f"PDF exceeded maximum size limit ({size_bytes} > {settings.MAX_PDF_SIZE_BYTES})"
                    return False, None, audit_trail

                # 3. Magic Bytes check for legitimate PDF (%PDF-)
                if not content.startswith(b"%PDF-"):
                    # Check if HTML error page was returned
                    if b"<html" in content[:200].lower() or b"<!doctype html" in content[:200].lower():
                        audit_trail["error"] = "Received HTML webpage instead of binary PDF (likely redirect or captcha challenge)"
                    else:
                        audit_trail["error"] = "Invalid PDF signature: file does not begin with '%PDF-'"
                    return False, None, audit_trail

                # 4. Compute SHA-256 checksum
                checksum = hashlib.sha256(content).hexdigest()
                storage_path = f"{user_id}/{run_id}/{filename}"

                # 5. Save to local fallback storage and/or Supabase Storage
                local_file_path = os.path.join(self.local_storage_dir, f"{run_id}_{filename}")
                with open(local_file_path, "wb") as f:
                    f.write(content)

                download_url = f"/api/artifacts/download/{run_id}_{filename}"

                # If Supabase client configured, attempt upload to Supabase storage
                if self.supabase and settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
                    try:
                        self.supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                            path=storage_path,
                            file=content,
                            file_options={"content-type": "application/pdf"}
                        )
                        # Generate signed URL valid for 1 hour
                        signed_res = self.supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_url(
                            path=storage_path,
                            expires_in=3600
                        )
                        if signed_res and "signedURL" in signed_res:
                            download_url = signed_res["signedURL"]
                    except Exception as s_err:
                        logger.warning(f"Supabase storage upload skipped/fallback: {s_err}")

                artifact = StoredArtifactSchema(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    paper_id=paper_id,
                    research_run_id=run_id,
                    artifact_type="PDF",
                    storage_path=storage_path,
                    original_filename=filename,
                    checksum=checksum,
                    size_bytes=size_bytes,
                    verification_status="VALID",
                    download_url=download_url,
                    created_at=datetime.now(timezone.utc).isoformat()
                )

                audit_trail["status"] = "SUCCESS"
                audit_trail["size_bytes"] = size_bytes
                audit_trail["checksum"] = checksum
                audit_trail["verified_magic_bytes"] = "%PDF-"

                return True, artifact, audit_trail

        except httpx.RequestError as exc:
            audit_trail["error"] = f"Network exception during PDF download: {str(exc)}"
            return False, None, audit_trail
