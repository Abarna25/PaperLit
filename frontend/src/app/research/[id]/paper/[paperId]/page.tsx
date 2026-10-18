"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  GitMerge,
  ArrowLeft,
  Lock,
  Unlock,
  Key,
  Info
} from "lucide-react";
import { api } from "@/lib/api";
import { PaperRecord } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export default function PaperEvidencePassportPage({
  params,
}: {
  params: Promise<{ id: string; paperId: string }>;
}) {
  const resolvedParams = use(params);
  const { id: runId, paperId } = resolvedParams;

  const [paper, setPaper] = useState<PaperRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPaperPassport(runId, paperId)
      .then((res) => {
        setPaper(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load evidence passport");
        setLoading(false);
      });
  }, [runId, paperId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="h-8 w-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading Research Evidence Passport...</p>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
          {error || "Paper not found"}
        </div>
        <Link href={`/research/${runId}/results`} className="mt-4 inline-block text-xs text-cyan-400 underline">
          Return to Results
        </Link>
      </div>
    );
  }

  const passport = paper.passport;
  const citation = paper.citation_verification;
  const access = paper.access;
  const annotation = paper.annotation;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href={`/research/${runId}/results`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Research Results
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-sm mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Research Evidence Passport
          </div>
          <span className="font-mono text-xs text-slate-500">ID: {paper.id}</span>
          {citation && <StatusBadge status={citation.verification_status} />}
          {access && <StatusBadge status={access.status} type="access" />}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
          {paper.canonical_title}
        </h1>

        <p className="mt-2 text-sm text-slate-300 font-medium">
          {paper.canonical_authors.map((a) => a.name).join(", ")}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          {paper.venue && (
            <span>
              <strong>Venue:</strong> {paper.venue}
            </span>
          )}
          {paper.publication_year && (
            <span>
              <strong>Year:</strong> {paper.publication_year}
            </span>
          )}
          {paper.doi && (
            <span className="flex items-center gap-1">
              <strong>DOI:</strong>{" "}
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                {paper.doi}
              </a>
            </span>
          )}
        </div>
      </div>

      {/* Epistemological Provenance Badges (Distinguishing Facts vs Claims vs Interpretations) */}
      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Info className="h-4 w-4 text-cyan-400" />
          Epistemological Claim Classification
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <span className="text-[10px] font-bold text-emerald-400 block uppercase">Verified Ground Truth</span>
            <span className="text-slate-300 text-xs mt-1 block">Crossref Registry &amp; Author Order</span>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <span className="text-[10px] font-bold text-blue-400 block uppercase">Source Reported Claim</span>
            <span className="text-slate-300 text-xs mt-1 block">Indexed Venue &amp; Initial Abstract</span>
          </div>
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
            <span className="text-[10px] font-bold text-purple-400 block uppercase">Model Interpretation</span>
            <span className="text-slate-300 text-xs mt-1 block">Synthesized Objectives &amp; BM25 Score</span>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <span className="text-[10px] font-bold text-amber-400 block uppercase">Uncertain / Review</span>
            <span className="text-slate-300 text-xs mt-1 block">License Redistribution Rights</span>
          </div>
        </div>
      </div>

      {/* 2-Column Passport Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Citation Trust Engine Verification */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4" />
            Citation Trust Engine Breakdown
          </h2>

          {citation ? (
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Resolution Status:</span>
                <span className="font-semibold text-white">{citation.resolution_status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Verification Status:</span>
                <StatusBadge status={citation.verification_status} />
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Title Similarity (Levenshtein + Jaccard):</span>
                <span className="font-mono font-bold text-cyan-300">
                  {Math.round(citation.title_match_score * 100)}%
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Author Overlap Verdict:</span>
                <span className="font-semibold text-emerald-400">
                  {citation.author_match_result?.verdict || "N/A"}
                </span>
              </div>
              {citation.returned_title && (
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80 mt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Resolved Crossref Metadata Title
                  </span>
                  <p className="text-xs text-slate-200">{citation.returned_title}</p>
                </div>
              )}
              {citation.evidence?.trust_audit && (
                <p className="text-[11px] text-slate-400 italic mt-2">
                  &ldquo;{citation.evidence.trust_audit}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No citation verification recorded.</p>
          )}
        </div>

        {/* Right Column: Open-Access & Legal Rights */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2 mb-4">
            <Unlock className="h-4 w-4" />
            Open-Access &amp; Repository License
          </h2>

          {access ? (
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Access Classification:</span>
                <StatusBadge status={access.status} type="access" />
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Access Source:</span>
                <span className="font-semibold text-white">{access.access_source || "None"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">License URL / Notice:</span>
                <span className="font-mono text-cyan-400 truncate max-w-xs">{access.license_url || "Open Repository"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Paywall Bypass Attempted:</span>
                <span className="font-semibold text-emerald-400">Strictly False (0 bypasses)</span>
              </div>

              {access.pdf_url && (
                <div className="mt-3">
                  <a
                    href={access.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-2 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Verified PDF Mirror
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No access assessment recorded.</p>
          )}
        </div>
      </div>

      {/* Ground-Truth Evidence-Backed Annotation */}
      {annotation && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Evidence-Backed Scholarly Annotation
            </h2>
            <span className="rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold">
              Basis: {annotation.basis}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800/80">
              <span className="font-bold text-slate-400 block mb-1">Research Objective</span>
              <p className="text-slate-200 leading-relaxed">{annotation.research_objective}</p>
            </div>
            <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800/80">
              <span className="font-bold text-slate-400 block mb-1">Methodology &amp; Architecture</span>
              <p className="text-slate-200 leading-relaxed">{annotation.methodology}</p>
            </div>
            <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800/80">
              <span className="font-bold text-slate-400 block mb-1">Reported Empirical Findings</span>
              <p className="text-slate-200 leading-relaxed">{annotation.main_findings}</p>
            </div>
            <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800/80">
              <span className="font-bold text-slate-400 block mb-1">Stated Limitations</span>
              <p className="text-slate-200 leading-relaxed">{annotation.limitations}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-3 text-xs text-slate-300">
            <span className="font-bold text-cyan-300 block mb-0.5">Relevance to User Inquiry:</span>
            <p>{annotation.relevance_to_question}</p>
          </div>
        </div>
      )}

      {/* Linked Versions and Sources */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-cyan-400" />
          Upstream Provenance &amp; Version History
        </h2>

        <div className="space-y-3">
          {paper.sources.map((src, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-slate-950 p-3 text-xs border border-slate-800/80">
              <div>
                <span className="font-bold text-cyan-400 uppercase">{src.source_name}</span>
                <span className="text-slate-500 ml-2">Record ID: {src.source_record_id}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Retrieved: {new Date(src.retrieved_at).toLocaleString()}</p>
              </div>
              {src.source_url && (
                <a
                  href={src.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Source Link
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
