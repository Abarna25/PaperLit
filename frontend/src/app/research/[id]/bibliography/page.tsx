"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FileText,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Filter,
  CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api";
import { RunDetailsResponse } from "@/lib/types";

export default function BibliographyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const runId = resolvedParams.id;

  const [data, setData] = useState<RunDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .getRun(runId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load bibliography");
        setLoading(false);
      });
  }, [runId]);

  const copyToClipboard = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBibtexFile = () => {
    if (!data) return;
    const blob = new Blob([data.bibtex], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `littrust_${runId.slice(0, 8)}.bib`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadJsonFile = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data.papers, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `littrust_${runId.slice(0, 8)}_papers.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="h-8 w-8 mx-auto border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Compiling verified bibliography &amp; parsing BibTeX...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
          {error || "Run not found"}
        </div>
      </div>
    );
  }

  const { bibtex, bibtex_excluded, summary } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-900 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Step 11: Export Gateway
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="font-mono text-xs text-slate-400">{runId}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-indigo-400" />
            Annotated Bibliography &amp; BibTeX Export
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Compliant RFC-formatted BibTeX records strictly excluding failed and unverified citations.
          </p>
        </div>
        <Link
          href={`/research/${runId}/results`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Results
        </Link>
      </div>

      {/* Verification Guard Notice */}
      <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Citation Trust Engine Integrity Guarantee:</span>
          <span>
            Only DOIs verified via Crossref metadata comparison ({summary.doi_verified_count} records) are exported.
            Unverified or mismatched records are quarantined and listed separately below.
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-xs font-semibold text-slate-400">
          Generated BibTeX Syntax ({data.papers.filter((p) => p.citation_verification?.verification_status === "VERIFIED").length} Verified Entries)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors border border-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy BibTeX"}
          </button>
          <button
            onClick={downloadBibtexFile}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download .bib
          </button>
          <button
            onClick={downloadJsonFile}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* BibTeX Code Viewer */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
        <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
          {bibtex}
        </pre>
      </div>

      {/* Excluded Citations Notice Section */}
      {bibtex_excluded.length > 0 && (
        <div className="mt-8 rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6 shadow-xl backdrop-blur-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" />
            Quarantined &amp; Excluded From Verified Export ({bibtex_excluded.length})
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            In compliance with Section 4 Step 6, citations with missing or mismatched DOIs are prevented from entering the verified bibliography:
          </p>
          <ul className="space-y-1.5 text-xs text-rose-300 list-disc list-inside">
            {bibtex_excluded.map((item, idx) => (
              <li key={idx} className="line-clamp-1">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
