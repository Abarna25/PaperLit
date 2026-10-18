-- =============================================================================
-- Migration: 20261018000003_storage_buckets.sql
-- LitTrust AI: Storage Buckets & Policies
-- Configures private storage buckets for Open-Access PDFs, BibTeX exports, and Reports
-- =============================================================================

-- Create private bucket 'littrust-artifacts' if storage extension exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'littrust-artifacts',
    'littrust-artifacts',
    false,
    52428800, -- 50 MB limit per artifact
    ARRAY['application/pdf', 'application/x-bibtex', 'text/plain', 'application/json', 'text/csv']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf', 'application/x-bibtex', 'text/plain', 'application/json', 'text/csv'];

-- Storage RLS: Users can only upload and read files in their own folder (user_id/...)
CREATE POLICY "Users can upload own artifacts to littrust-artifacts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'littrust-artifacts' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read own artifacts from littrust-artifacts"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'littrust-artifacts' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own artifacts from littrust-artifacts"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'littrust-artifacts' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
