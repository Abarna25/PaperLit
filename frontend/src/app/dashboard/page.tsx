"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Unlock,
  Layers,
  ArrowRight,
  Clock,
  Search,
  Plus
} from "lucide-react";
import { api } from "@/lib/api";
import { ResearchRunSummary } from "@/lib/types";
import { MetricCard } from "@/components/MetricCard";

export default function DashboardPage() {
  const [runs, setRuns] = useState<ResearchRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRuns()
      .then((data) => {
        setRuns(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load runs from database");
        setLoading(false);
      });
  }, []);

  // Aggregated totals computed dynamically from real database records
  const totalDiscovered = runs.reduce((acc, r) => acc + (r.papers_discovered || 0), 0);
  const totalCanonical = runs.reduce((acc, r) => acc + (r.unique_canonical_papers || 0), 0);
  const totalVerified = runs.reduce((acc, r) => acc + (r.doi_verified_count || 0), 0);
  const totalOpenAccess = runs.reduce((acc, r) => acc + (r.open_access_count || 0), 0);
  const totalPending = runs.reduce((acc, r) => acc + (r.pending_review_count || 0), 0);
  const totalFailed = runs.reduce((acc, r) => acc + (r.failed_verification_count || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Research Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time literature intelligence metrics loaded from persistent research records.
          </p>
        </div>
        <Link
          href="/research/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Research Query
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="Discovered"
          value={loading ? "..." : totalDiscovered}
          subtitle="Total raw sources"
          icon={FileText}
          variant="blue"
        />
        <MetricCard
          title="Canonical"
          value={loading ? "..." : totalCanonical}
          subtitle="Deduplicated works"
          icon={Layers}
          variant="cyan"
        />
        <MetricCard
          title="DOI Verified"
          value={loading ? "..." : totalVerified}
          subtitle="Crossref confirmed"
          icon={CheckCircle2}
          variant="emerald"
        />
        <MetricCard
          title="Open Access"
          value={loading ? "..." : totalOpenAccess}
          subtitle="Permitted PDFs"
          icon={Unlock}
          variant="purple"
        />
        <MetricCard
          title="Pending Review"
          value={loading ? "..." : totalPending}
          subtitle="Lineage ambiguity"
          icon={AlertTriangle}
          variant="amber"
        />
        <MetricCard
          title="Mismatches"
          value={loading ? "..." : totalFailed}
          subtitle="Excluded citations"
          icon={XCircle}
          variant="rose"
        />
      </div>

      {/* Recent Research Runs */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Research Run History</h2>
          <span className="text-xs text-slate-500">{runs.length} active runs in database</span>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg backdrop-blur-sm">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Run ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Discovered</th>
                <th className="px-4 py-3">Canonical</th>
                <th className="px-4 py-3">DOI Verified</th>
                <th className="px-4 py-3">Open Access</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {runs.map((r) => (
                <tr key={r.run_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-white">
                    <span className="font-mono text-[11px] text-cyan-400">{r.run_id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">{r.papers_discovered}</td>
                  <td className="px-4 py-3.5">{r.unique_canonical_papers}</td>
                  <td className="px-4 py-3.5 text-emerald-400 font-semibold">{r.doi_verified_count}</td>
                  <td className="px-4 py-3.5 text-cyan-400">{r.open_access_count}</td>
                  <td className="px-4 py-3.5 text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.started_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/research/${r.run_id}/results`}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      View Results
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No research runs found in database. Create your first research query above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
