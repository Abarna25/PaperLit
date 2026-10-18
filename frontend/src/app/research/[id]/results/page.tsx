"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Unlock,
  Lock,
  FileText,
  ExternalLink,
  ShieldCheck,
  Radar,
  CheckSquare,
  Sparkles,
  GitMerge,
  Download,
  Info
} from "lucide-react";
import { api } from "@/lib/api";
import { RunDetailsResponse, PaperRecord } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const runId = resolvedParams.id;

  const [data, setData] = useState<RunDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "VERIFIED" | "MISMATCH" | "OPEN_ACCESS" | "PAYWALLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [staging, setStaging] = useState(false);
  const [stagingSuccess, setStagingSuccess] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRun(runId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load research run");
        setLoading(false);
      });
  }, [runId]);

  const handleStageDownloads = async () => {
    if (!data) return;
    setStaging(true);
    setStagingSuccess(null);
    try {
      const res = await api.stagePdfDownload(runId);
      setStagingSuccess(`Staged ${res.file_count} open-access PDFs for human approval review.`);
      setStaging(false);
    } catch (err: any) {
      setError(err.message || "Failed to stage downloads");
      setStaging(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="h-8 w-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading evidence passport results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
          {error || "Run not found"}
        </div>
        <Link href="/dashboard" className="mt-4 inline-block text-xs text-cyan-400 underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { summary, papers, query_plan } = data;

  const filteredPapers = papers.filter((p) => {
    // Search query filter
    const matchesSearch =
      searchQuery === "" ||
      p.canonical_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.canonical_authors.some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filter
    if (filter === "VERIFIED") return p.citation_verification?.verification_status === "VERIFIED";
    if (filter === "MISMATCH") return p.citation_verification?.verification_status === "MISMATCH";
    if (filter === "OPEN_ACCESS") return p.access?.status === "OPEN_ACCESS_VERIFIED";
    if (filter === "PAYWALLED") return p.access?.status === "PAYWALLED_OR_RESTRICTED";
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header & Navigation Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-cyan-400 font-semibold">{runId}</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-xs text-slate-400">{new Date(summary.started_at).toLocaleDateString()}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Literature Intelligence Evidence
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            {query_plan.planned_ranking_criteria}
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/research/${runId}/gap-radar`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors"
          >
            <Radar className="h-3.5 w-3.5" />
            Gap Radar
          </Link>
          <Link
            href={`/research/${runId}/approvals`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Approval Queue
          </Link>
          <Link
            href={`/research/${runId}/bibliography`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            BibTeX Export
          </Link>
        </div>
      </div>

      {stagingSuccess && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{stagingSuccess}</span>
          </div>
          <Link href={`/research/${runId}/approvals`} className="underline font-bold hover:text-white">
            View Approval Queue &rarr;
          </Link>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard title="Discovered" value={summary.papers_discovered} subtitle="From arXiv & S2" icon={FileText} variant="blue" />
        <MetricCard title="Canonical" value={summary.unique_canonical_papers} subtitle="Deduplicated" icon={GitMerge} variant="cyan" />
        <MetricCard title="DOI Verified" value={summary.doi_verified_count} subtitle="Crossref matched" icon={CheckCircle2} variant="emerald" />
        <MetricCard title="Open Access" value={summary.open_access_count} subtitle="Permitted PDFs" icon={Unlock} variant="purple" />
        <MetricCard title="Pending Review" value={summary.pending_review_count} subtitle="Author ambiguity" icon={AlertTriangle} variant="amber" />
        <MetricCard title="Mismatches" value={summary.failed_verification_count} subtitle="Excluded from BibTeX" icon={XCircle} variant="rose" />
      </div>

      {/* Filters and Search Bar */}
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: `All Papers (${papers.length})` },
            { id: "VERIFIED", label: `DOI Verified (${summary.doi_verified_count})` },
            { id: "OPEN_ACCESS", label: `Open Access (${summary.open_access_count})` },
            { id: "PAYWALLED", label: "Paywalled" },
            { id: "MISMATCH", label: `Mismatches (${summary.failed_verification_count})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === tab.id
                  ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input & Action */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button
            onClick={handleStageDownloads}
            disabled={staging}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap border border-slate-700"
            title="Stage all permitted Open-Access PDFs for human approval"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            Stage OA PDFs
          </button>
        </div>
      </div>

      {/* Papers List */}
      <div className="mt-6 space-y-4">
        {filteredPapers.map((paper, idx) => {
          const isVerified = paper.citation_verification?.verification_status === "VERIFIED";
          const isMismatch = paper.citation_verification?.verification_status === "MISMATCH";
          const isOpenAccess = paper.access?.status === "OPEN_ACCESS_VERIFIED";

          return (
            <div
              key={paper.id}
              className={`relative rounded-xl border p-5 shadow-md backdrop-blur-sm transition-all hover:border-slate-700 ${
                isMismatch
                  ? "border-rose-500/30 bg-rose-950/10"
                  : isVerified
                  ? "border-slate-800 bg-slate-900/60"
                  : "border-slate-800/80 bg-slate-900/40"
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Status Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                    {paper.citation_verification && (
                      <StatusBadge status={paper.citation_verification.verification_status} />
                    )}
                    {paper.access && <StatusBadge status={paper.access.status} type="access" />}
                    {paper.versions.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/30">
                        <GitMerge className="h-3 w-3" />
                        {paper.versions.length} Linked Version(s)
                      </span>
                    )}
                    {paper.venue && (
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700/60">
                        {paper.venue} &bull; {paper.publication_year || "N/A"}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white hover:text-cyan-400 transition-colors">
                    {paper.canonical_title}
                  </h3>

                  {/* Authors */}
                  <p className="mt-1 text-xs text-slate-400">
                    {paper.canonical_authors.map((a) => a.name).join(", ")}
                  </p>

                  {/* Abstract Preview */}
                  {paper.abstract && (
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-300 line-clamp-2">
                      {paper.abstract}
                    </p>
                  )}

                  {/* Relevance Explanation & Human Rationale */}
                  {paper.relevance && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-950/80 border border-slate-800/80 p-2.5 text-[11px] text-slate-300">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-cyan-300">
                          Relevance Score: {Math.round(paper.relevance.score * 100)}% &bull;{" "}
                        </span>
                        <span>{paper.relevance.explanation}</span>
                      </div>
                    </div>
                  )}

                  {/* Mismatch Warning Alert if TC4 mismatch */}
                  {isMismatch && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-[11px] text-rose-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                      <span>
                        <strong>FLAGGED MISMATCH:</strong> DOI resolver returned title &quot;
                        {paper.citation_verification?.returned_title}&quot;. Excluded from verified bibliography export.
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Side Actions */}
                <div className="flex lg:flex-col items-center lg:items-end gap-2 shrink-0">
                  <Link
                    href={`/research/${runId}/paper/${paper.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Evidence Passport
                  </Link>

                  {isOpenAccess && paper.access?.pdf_url && (
                    <a
                      href={paper.access.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 font-medium"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open PDF Source
                    </a>
                  )}

                  {paper.canonical_url && !isOpenAccess && (
                    <a
                      href={paper.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                    >
                      <Lock className="h-3 w-3" />
                      Publisher Link
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredPapers.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500 text-xs">
            No papers match the selected filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
