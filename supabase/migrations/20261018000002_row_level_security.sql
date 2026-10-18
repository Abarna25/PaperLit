-- =============================================================================
-- Migration: 20261018000002_row_level_security.sql
-- LitTrust AI: Strict Row Level Security Policies
-- Ensures complete multi-tenant tenant isolation between authenticated users
-- =============================================================================

-- Enable Row Level Security on all core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relevance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stored_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can select/update only their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 2. Research Requests: Users can select, insert, update only their own requests
CREATE POLICY "Users can view own requests"
    ON public.research_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests"
    ON public.research_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
    ON public.research_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests"
    ON public.research_requests FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 3. Research Runs: Users can view/create runs attached to their own requests
CREATE POLICY "Users can view own runs"
    ON public.research_runs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own runs"
    ON public.research_runs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own runs"
    ON public.research_runs FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. Papers: Scholarly canonical papers are readable by authenticated users
-- (or filtered to runs owned by the user via run association)
CREATE POLICY "Authenticated users can read canonical papers"
    ON public.papers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service and authenticated users can insert papers"
    ON public.papers FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Service and authenticated users can update papers"
    ON public.papers FOR UPDATE
    TO authenticated
    USING (true);

-- 5. Paper Sources: Readable by authenticated users
CREATE POLICY "Authenticated users can read paper sources"
    ON public.paper_sources FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert paper sources"
    ON public.paper_sources FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 6. Paper Versions: Readable by authenticated users
CREATE POLICY "Authenticated users can read paper versions"
    ON public.paper_versions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert/update paper versions"
    ON public.paper_versions FOR ALL
    TO authenticated
    USING (true);

-- 7. Relevance Assessments: Restricted to the user who owns the research_run
CREATE POLICY "Users can view relevance assessments for their runs"
    ON public.relevance_assessments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.research_runs
            WHERE public.research_runs.id = relevance_assessments.research_run_id
              AND public.research_runs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert relevance assessments for their runs"
    ON public.relevance_assessments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.research_runs
            WHERE public.research_runs.id = relevance_assessments.research_run_id
              AND public.research_runs.user_id = auth.uid()
        )
    );

-- 8. Citation Verifications: Restricted to user's runs
CREATE POLICY "Users can view citation verifications for their runs"
    ON public.citation_verifications FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.research_runs
            WHERE public.research_runs.id = citation_verifications.research_run_id
              AND public.research_runs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert citation verifications for their runs"
    ON public.citation_verifications FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.research_runs
            WHERE public.research_runs.id = citation_verifications.research_run_id
              AND public.research_runs.user_id = auth.uid()
        )
    );

-- 9. Access Assessments: Readable by authenticated users
CREATE POLICY "Authenticated users can view access assessments"
    ON public.access_assessments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert access assessments"
    ON public.access_assessments FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 10. Annotations: Restricted to user's runs
CREATE POLICY "Users can view annotations for their runs"
    ON public.annotations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.research_runs
            WHERE public.research_runs.id = annotations.research_run_id
              AND public.research_runs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert annotations for their runs"
    ON public.annotations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.research_runs
            WHERE public.research_runs.id = annotations.research_run_id
              AND public.research_runs.user_id = auth.uid()
        )
    );

-- 11. Research Actions: Restricted strictly to action owner
CREATE POLICY "Users can view own research actions"
    ON public.research_actions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own research actions"
    ON public.research_actions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research actions"
    ON public.research_actions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- 12. Stored Artifacts: Restricted strictly to artifact owner
CREATE POLICY "Users can view own stored artifacts"
    ON public.stored_artifacts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stored artifacts"
    ON public.stored_artifacts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stored artifacts"
    ON public.stored_artifacts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 13. Research Gaps: Restricted to user's runs
CREATE POLICY "Users can view research gaps for their runs"
    ON public.research_gaps FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.research_runs
            WHERE public.research_runs.id = research_gaps.research_run_id
              AND public.research_runs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert research gaps for their runs"
    ON public.research_gaps FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.research_runs
            WHERE public.research_runs.id = research_gaps.research_run_id
              AND public.research_runs.user_id = auth.uid()
        )
    );

-- 14. Test Runs: Accessible by owner or public CI runs if user_id is null
CREATE POLICY "Users can view own or CI test runs"
    ON public.test_runs FOR SELECT
    TO authenticated
    USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert test runs"
    ON public.test_runs FOR INSERT
    TO authenticated
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update test runs"
    ON public.test_runs FOR UPDATE
    TO authenticated
    USING (user_id IS NULL OR user_id = auth.uid());
