import logging
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.core.config import settings
from app.models.schemas import (
    ResearchRequestCreate,
    ResearchRunSummary,
    PaperRecord,
    ResearchActionSchema,
    StoredArtifactSchema,
    ResearchGapSchema,
    TestRunSchema
)

logger = logging.getLogger(__name__)

class Repository:
    """
    Hybrid Database Repository:
    Directs operations to Supabase PostgreSQL when credentials are provided.
    Maintains a robust in-memory persistent cache for instant offline execution,
    deterministic local testing, and seamless fixture mode.
    """

    def __init__(self):
        self._runs: Dict[str, Dict[str, Any]] = {}
        self._actions: Dict[str, ResearchActionSchema] = {}
        self._artifacts: Dict[str, StoredArtifactSchema] = {}
        self._test_runs: Dict[str, TestRunSchema] = {}
        self._supabase = None
        
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                from supabase import create_client
                self._supabase = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_ROLE_KEY
                )
                logger.info("Connected to hosted Supabase PostgreSQL.")
            except Exception as e:
                logger.warning(f"Could not connect to Supabase: {e}. Running in robust local/fixture repository mode.")

    def save_run(self, run_id: str, data: Dict[str, Any]):
        self._runs[run_id] = data
        if self._supabase:
            try:
                summary = data.get("summary")
                if summary:
                    self._supabase.table("research_runs").insert({
                        "id": run_id,
                        "status": summary.status,
                        "query_plan": summary.query_plan.dict(),
                        "ranking_configuration": summary.ranking_configuration.dict(),
                        "started_at": summary.started_at,
                        "completed_at": summary.completed_at
                    }).execute()
            except Exception as e:
                logger.warning(f"Supabase write error: {e}")

    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        return self._runs.get(run_id)

    def list_runs(self) -> List[ResearchRunSummary]:
        return [data["summary"] for data in self._runs.values() if "summary" in data]

    def save_action(self, action: ResearchActionSchema):
        self._actions[action.id] = action
        if self._supabase:
            try:
                self._supabase.table("research_actions").insert({
                    "id": action.id,
                    "user_id": action.user_id,
                    "research_run_id": action.research_run_id,
                    "action_type": action.action_type,
                    "proposed_changes": action.proposed_changes,
                    "action_hash": action.action_hash,
                    "idempotency_key": action.idempotency_key,
                    "status": action.status,
                    "created_at": action.created_at
                }).execute()
            except Exception as e:
                logger.warning(f"Supabase action insert error: {e}")

    def get_action(self, action_id: str) -> Optional[ResearchActionSchema]:
        return self._actions.get(action_id)

    def list_actions_for_run(self, run_id: str) -> List[ResearchActionSchema]:
        return [act for act in self._actions.values() if act.research_run_id == run_id]

    def list_pending_actions(self) -> List[ResearchActionSchema]:
        return [act for act in self._actions.values() if act.status == "PENDING"]

    def update_action_status(
        self,
        action_id: str,
        status: str,
        approved_by: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error_details: Optional[str] = None
    ) -> Optional[ResearchActionSchema]:
        action = self._actions.get(action_id)
        if not action:
            return None
        action.status = status
        now_str = datetime.now(timezone.utc).isoformat()
        if status in ("APPROVED", "REJECTED"):
            action.approved_by = approved_by or "reviewer@littrust.ai"
            action.approved_at = now_str
        if status in ("EXECUTED", "FAILED"):
            action.executed_at = now_str
            if result:
                action.result = result
            if error_details:
                action.error_details = error_details
        return action

    def save_artifact(self, artifact: StoredArtifactSchema):
        self._artifacts[artifact.id] = artifact

    def list_artifacts_for_run(self, run_id: str) -> List[StoredArtifactSchema]:
        return [art for art in self._artifacts.values() if art.research_run_id == run_id]

    def save_test_run(self, test_run: TestRunSchema):
        self._test_runs[test_run.test_case] = test_run

    def get_test_run(self, test_case: str) -> Optional[TestRunSchema]:
        return self._test_runs.get(test_case)

    def list_test_runs(self) -> List[TestRunSchema]:
        return list(self._test_runs.values())

repo = Repository()
