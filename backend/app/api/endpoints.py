import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import (
    ResearchRequestCreate,
    ResearchRunSummary,
    ApprovalDecisionRequest,
    TestRunSchema,
    ResearchActionSchema
)
from app.services.research_orchestrator import ResearchOrchestrator
from app.services.approval_service import ApprovalService
from app.services.artifact_service import ArtifactService
from app.services.evaluation_lab_service import EvaluationLabService
from app.db.repository import repo
from app.core.config import settings

router = APIRouter()
orchestrator = ResearchOrchestrator()
approval_service = ApprovalService()
artifact_service = ArtifactService(supabase_client=repo._supabase)
lab_service = EvaluationLabService()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "app_env": settings.APP_ENV,
        "supabase_connected": repo._supabase is not None,
        "storage_bucket": settings.SUPABASE_STORAGE_BUCKET,
        "crossref_mailto": settings.CROSSREF_MAILTO,
        "semantic_scholar_configured": bool(settings.SEMANTIC_SCHOLAR_API_KEY),
        "llm_provider": settings.LLM_PROVIDER
    }

@router.get("/api/system/settings")
def get_system_settings():
    return {
        "supabase_url": settings.SUPABASE_URL or settings.NEXT_PUBLIC_SUPABASE_URL or "Not configured (Local Fallback Active)",
        "supabase_connected": repo._supabase is not None,
        "storage_bucket": settings.SUPABASE_STORAGE_BUCKET,
        "crossref_email": settings.CROSSREF_MAILTO,
        "semantic_scholar_api_key_set": bool(settings.SEMANTIC_SCHOLAR_API_KEY),
        "llm_provider": settings.LLM_PROVIDER,
        "max_pdf_size_mb": settings.MAX_PDF_SIZE_BYTES // (1024 * 1024),
        "target_limit_max": settings.MAX_PAPERS_PER_QUERY,
        "mode": "HYBRID_LIVE_WITH_FIXTURE_FALLBACK"
    }

@router.post("/api/research/new")
async def create_research_run(req: ResearchRequestCreate):
    run_id = str(uuid.uuid4())
    user_id = "default_researcher_uid"
    result = await orchestrator.execute_run(run_id, user_id, req)
    repo.save_run(run_id, result)
    return {
        "run_id": run_id,
        "summary": result["summary"],
        "paper_count": len(result["papers"])
    }

@router.get("/api/research/runs")
def list_research_runs():
    return repo.list_runs()

@router.get("/api/research/run/{run_id}")
def get_research_run(run_id: str):
    run_data = repo.get_run(run_id)
    if not run_data:
        raise HTTPException(status_code=404, detail=f"Research run {run_id} not found")
    return run_data

@router.get("/api/research/paper/{run_id}/{paper_id}")
def get_paper_passport(run_id: str, paper_id: str):
    run_data = repo.get_run(run_id)
    if not run_data:
        raise HTTPException(status_code=404, detail="Run not found")
    papers = run_data.get("papers", [])
    for p in papers:
        if p.id == paper_id:
            return p
    raise HTTPException(status_code=404, detail="Paper not found in run")

@router.post("/api/research/actions/stage-download")
def stage_pdf_download(payload: Dict[str, Any]):
    run_id = payload.get("run_id")
    paper_ids = payload.get("paper_ids", [])
    user_id = payload.get("user_id", "default_researcher_uid")

    run_data = repo.get_run(run_id)
    if not run_data:
        raise HTTPException(status_code=404, detail="Run not found")

    all_papers = run_data.get("papers", [])
    target_papers = [p for p in all_papers if p.id in paper_ids] if paper_ids else all_papers

    staged_action, warnings = approval_service.stage_pdf_download_action(user_id, run_id, target_papers)
    repo.save_action(staged_action)

    return {
        "action": staged_action,
        "warnings": warnings,
        "file_count": len(staged_action.proposed_changes.get("proposed_files", []))
    }

@router.get("/api/research/actions/pending")
def list_pending_actions():
    return repo.list_pending_actions()

@router.get("/api/research/actions/{run_id}")
def list_run_actions(run_id: str):
    return repo.list_actions_for_run(run_id)

@router.post("/api/research/actions/decision")
def make_action_decision(req: ApprovalDecisionRequest):
    action = repo.get_action(req.action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    if action.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Action is already in '{action.status}' state.")

    new_status = "APPROVED" if req.decision.upper() == "APPROVE" else "REJECTED"
    updated = repo.update_action_status(req.action_id, new_status)
    return {"action": updated}

@router.post("/api/research/actions/execute/{action_id}")
async def execute_approved_action(action_id: str):
    action = repo.get_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    if action.status != "APPROVED":
        raise HTTPException(status_code=400, detail="Cannot execute unapproved action. Status must be 'APPROVED'.")

    proposed_files = action.proposed_changes.get("proposed_files", [])
    executed_artifacts = []
    errors = []

    for file_info in proposed_files:
        success, artifact, audit = await artifact_service.download_and_verify_pdf(
            user_id=action.user_id,
            run_id=action.research_run_id,
            paper_id=file_info["paper_id"],
            source_url=file_info["source_url"],
            filename=file_info["filename"]
        )
        if success and artifact:
            repo.save_artifact(artifact)
            executed_artifacts.append(artifact)
        else:
            errors.append({"file": file_info["filename"], "error": audit.get("error")})

    final_status = "EXECUTED" if executed_artifacts else "FAILED"
    result_summary = {
        "downloaded_count": len(executed_artifacts),
        "failed_count": len(errors),
        "errors": errors
    }
    updated = repo.update_action_status(
        action_id,
        status=final_status,
        result=result_summary,
        error_details="; ".join(e["error"] for e in errors) if errors else None
    )

    return {
        "action": updated,
        "artifacts": executed_artifacts,
        "summary": result_summary
    }

@router.get("/api/artifacts/{run_id}")
def list_run_artifacts(run_id: str):
    return repo.list_artifacts_for_run(run_id)

@router.get("/api/evaluation/test-cases")
async def list_evaluation_test_cases():
    runs = repo.list_test_runs()
    # If not yet executed, return empty status for all 4
    cases = {"TC1": None, "TC2": None, "TC3": None, "TC4": None}
    for r in runs:
        cases[r.test_case] = r
    return cases

@router.post("/api/evaluation/run/{test_case}")
async def run_evaluation_test_case(test_case: str):
    tc = test_case.upper()
    if tc == "TC1":
        res = await lab_service.run_tc1()
    elif tc == "TC2":
        res = await lab_service.run_tc2()
    elif tc == "TC3":
        res = await lab_service.run_tc3()
    elif tc == "TC4":
        res = await lab_service.run_tc4()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown test case '{test_case}'. Choose TC1, TC2, TC3, or TC4.")

    repo.save_test_run(res)
    return res
