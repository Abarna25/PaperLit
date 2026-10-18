-- =============================================================================
-- Migration: 20261018000001_initial_schema.sql
-- LitTrust AI: Evidence-First Literature Intelligence & Bibliography Builder
-- Normalized, Indexed PostgreSQL Schema for 14 Core Tables
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Research Requests
CREATE TABLE IF NOT EXISTS public.research_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    research_question TEXT NOT NULL,
    year_start INTEGER NOT NULL,
    year_end INTEGER NOT NULL,
    keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    excluded_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_methodologies JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_count INTEGER NOT NULL DEFAULT 25,
    min_relevance_threshold NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_years CHECK (year_start <= year_end),
    CONSTRAINT valid_target_count CHECK (target_count > 0 AND target_count <= 100)
);

-- 3. Research Runs
CREATE TABLE IF NOT EXISTS public.research_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.research_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL')),
    query_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    ranking_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    error_summary TEXT
);

-- 4. Papers (Canonical Paper Records)
CREATE TABLE IF NOT EXISTS public.papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_title TEXT NOT NULL,
    normalized_title TEXT NOT NULL,
    canonical_authors JSONB NOT NULL DEFAULT '[]'::jsonb,
    publication_year INTEGER,
    venue TEXT,
    doi TEXT,
    abstract TEXT,
    canonical_url TEXT,
    canonical_version_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Paper Sources (Provenance & Retrieval Evidence)
CREATE TABLE IF NOT EXISTS public.paper_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL CHECK (source_name IN ('arxiv', 'semantic_scholar', 'crossref', 'manual_fixture')),
    source_record_id TEXT NOT NULL,
    source_url TEXT,
    source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_source_record UNIQUE (source_name, source_record_id)
);

-- 6. Paper Versions (Publication Lineage Intelligence)
CREATE TABLE IF NOT EXISTS public.paper_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    version_paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('PREPRINT', 'JOURNAL_VERSION', 'CONFERENCE_VERSION', 'REVISED_PREPRINT')),
    matching_status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (matching_status IN ('CONFIRMED', 'LIKELY', 'PENDING_REVIEW', 'REJECTED')),
    match_score NUMERIC(5, 4),
    matching_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT version_pair_unique UNIQUE (canonical_paper_id, version_paper_id)
);

-- 7. Relevance Assessments (Transparent Scoring & Explanations)
CREATE TABLE IF NOT EXISTS public.relevance_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    score NUMERIC(5, 4) NOT NULL,
    score_components JSONB NOT NULL DEFAULT '{}'::jsonb,
    explanation TEXT NOT NULL,
    ranking_method TEXT NOT NULL CHECK (ranking_method IN ('HYBRID_EMBEDDING', 'BM25_DETERMINISTIC_FALLBACK')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_run_paper_relevance UNIQUE (research_run_id, paper_id)
);

-- 8. Citation Verifications (Citation Trust Engine)
CREATE TABLE IF NOT EXISTS public.citation_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
    doi TEXT,
    resolution_status TEXT NOT NULL CHECK (resolution_status IN ('RESOLVED', 'UNRESOLVED', 'NO_DOI', 'ERROR')),
    resolved_url TEXT,
    returned_title TEXT,
    returned_authors JSONB NOT NULL DEFAULT '[]'::jsonb,
    title_match_score NUMERIC(5, 4),
    author_match_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('VERIFIED', 'MISMATCH', 'UNVERIFIED', 'NO_DOI', 'PENDING_REVIEW')),
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_run_paper_citation UNIQUE (research_run_id, paper_id)
);

-- 9. Access Assessments (Open-Access Assessment)
CREATE TABLE IF NOT EXISTS public.access_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('OPEN_ACCESS_VERIFIED', 'PAYWALLED_OR_RESTRICTED', 'ACCESS_UNKNOWN', 'PDF_UNAVAILABLE')),
    pdf_url TEXT,
    access_source TEXT,
    license_url TEXT,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Annotations (Evidence-Backed Annotations)
CREATE TABLE IF NOT EXISTS public.annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
    research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
    annotation JSONB NOT NULL DEFAULT '{}'::jsonb,
    evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    basis TEXT NOT NULL CHECK (basis IN ('ABSTRACT', 'FULL_TEXT', 'METADATA_ONLY')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_run_paper_annotation UNIQUE (research_run_id, paper_id)
);

-- 11. Research Actions (Human Approval Queue)
CREATE TABLE IF NOT EXISTS public.research_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('DOWNLOAD_PDF', 'UPDATE_BIBLIOGRAPHY', 'EXPORT_FILES', 'BATCH_DOWNLOAD')),
    proposed_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    action_hash TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Stored Artifacts (PDFs, BibTeX, Reports)
CREATE TABLE IF NOT EXISTS public.stored_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paper_id UUID REFERENCES public.papers(id) ON DELETE SET NULL,
    research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL CHECK (artifact_type IN ('PDF', 'BIBTEX', 'EVALUATION_REPORT', 'EXPORT_JSON', 'EXPORT_CSV')),
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    checksum TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'VALID' CHECK (verification_status IN ('VALID', 'CORRUPT', 'UNVERIFIED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Research Gaps (Research Gap Radar)
CREATE TABLE IF NOT EXISTS public.research_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    gap_type TEXT NOT NULL CHECK (gap_type IN ('METHODOLOGY_UNDERREPRESENTED', 'EVALUATION_CONTEXT_MISSING', 'CONTRADICTING_FINDINGS', 'REPEATED_LIMITATION')),
    evidence_paper_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    counterevidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence TEXT NOT NULL DEFAULT 'HYPOTHESIS' CHECK (confidence IN ('HIGH', 'MEDIUM', 'HYPOTHESIS')),
    status TEXT NOT NULL DEFAULT 'IDENTIFIED' CHECK (status IN ('IDENTIFIED', 'INSUFFICIENT_EVIDENCE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. Test Runs (TC1 - TC4 Verification Log)
CREATE TABLE IF NOT EXISTS public.test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    test_case TEXT NOT NULL CHECK (test_case IN ('TC1', 'TC2', 'TC3', 'TC4')),
    input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    expected_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    actual_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'NOT_RUN' CHECK (status IN ('PASS', 'FAIL', 'BLOCKED', 'NOT_RUN')),
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_requests_user ON public.research_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_research_runs_request ON public.research_runs(request_id);
CREATE INDEX IF NOT EXISTS idx_research_runs_user ON public.research_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_papers_normalized_title ON public.papers(normalized_title);
CREATE INDEX IF NOT EXISTS idx_papers_doi ON public.papers(doi);
CREATE INDEX IF NOT EXISTS idx_paper_sources_paper ON public.paper_sources(paper_id);
CREATE INDEX IF NOT EXISTS idx_relevance_run_score ON public.relevance_assessments(research_run_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_citation_status ON public.citation_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_actions_status ON public.research_actions(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_user ON public.stored_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_run ON public.stored_artifacts(research_run_id);
CREATE INDEX IF NOT EXISTS idx_gaps_run ON public.research_gaps(research_run_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_case ON public.test_runs(test_case);
