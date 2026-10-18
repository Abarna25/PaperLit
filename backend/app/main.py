import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import router, orchestrator, repo, lab_service
from app.models.schemas import ResearchRequestCreate

logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("littrust_app")

app = FastAPI(
    title="LitTrust AI — Evidence-First Literature Intelligence & Bibliography Builder",
    description="Production-grade AI research assistant API integrating arXiv, Semantic Scholar, and Crossref with Citation Trust Engine and Publication Lineage Intelligence.",
    version="1.0.0"
)

# CORS Middleware for Next.js frontend (local dev and Vercel production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_origin_regex=r"https:\/\/.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.on_event("startup")
async def startup_seed():
    logger.info("Initializing LitTrust AI backend services...")
    # Seed default demonstration research run so dashboard and evaluation lab have immediate rich data
    try:
        sample_request = ResearchRequestCreate(
            research_question="How do Transformer architectures improve long-context language understanding?",
            year_start=2019,
            year_end=2024,
            keywords=["transformer", "attention", "context"],
            preferred_methodologies=["Linear Attention", "State Space Models"],
            target_count=25
        )
        seed_run_id = "demo-run-transformers-2024"
        run_data = await orchestrator.execute_run(seed_run_id, "demo_user", sample_request)
        repo.save_run(seed_run_id, run_data)
        logger.info(f"Seeded baseline demonstration research run '{seed_run_id}' with {len(run_data['papers'])} papers.")

        # Seed evaluation lab test runs
        tc1 = await lab_service.run_tc1()
        repo.save_test_run(tc1)
        tc2 = await lab_service.run_tc2()
        repo.save_test_run(tc2)
        tc3 = await lab_service.run_tc3()
        repo.save_test_run(tc3)
        tc4 = await lab_service.run_tc4()
        repo.save_test_run(tc4)
        logger.info("Seeded official test cases TC1-TC4 in Evaluation Lab.")
    except Exception as e:
        logger.warning(f"Startup seed encountered non-fatal notice: {e}")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
