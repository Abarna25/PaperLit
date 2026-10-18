"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  Download,
  Lock,
  ArrowRight,
  Hash,
  Key,
  Database
} from "lucide-react";
import { api } from "@/lib/api";
import { ResearchAction, StoredArtifact } from "@/lib/types";

export default function ApprovalsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const runId = resolvedParams.id;

  const [actions, setActions] = useState<ResearchAction[]>([]);
  const [artifacts, setArtifacts] = useState<StoredArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  const loadData = () => {
    Promise.all([api.getRunActions(runId), api.getArtifacts(runId)])
      .then(([acts, arts]) => {
        setActions(acts);
        setArtifacts(arts);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load approval actions");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [runId]);

  const handleDecision = async (actionId: string, decision: "APPROVE" | "REJECT", idempotencyKey: string) => {
    try {
      await api.makeActionDecision(actionId, decision, idempotencyKey);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to submit decision");
    }
  };

  const handleExecute = async (actionId: string) => {
    setExecuting(actionId);
    try {
      await api.executeAction(actionId);
      setExecuting(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to execute action");
      setExecuting(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-900 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-amber-400 font-semibold">Human-in-the-Loop Gateway</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Consequential Action Approval Queue
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Per policy Step 9, no PDFs or files are downloaded to storage without explicit human sign-off, SHA-256 verification, and SSRF audit.
          </p>
        </div>
        <Link
          href={`/research/${runId}/results`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
        >
          &larr; Back to Results
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-6">
        {actions.map((act) => {
          const proposed = act.proposed_changes || {};
          const files = proposed.proposed_files || [];
          const warnings = proposed.warnings || [];

          return (
            <div
              key={act.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm"
            >
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Action: {act.action_type}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>ID: {act.id.slice(0, 8)}...</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Hash: {act.action_hash.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      act.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : act.status === "APPROVED"
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                        : act.status === "EXECUTED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
              </div>

              {/* Proposed File Changes */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Target Destination: {proposed.destination_storage}
                </h4>

                <div className="space-y-2 mt-3">
                  {files.map((f: any, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg bg-slate-950 p-3 text-xs border border-slate-800/80 gap-2"
                    >
                      <div>
                        <p className="font-semibold text-white">{f.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Destination Path: {f.destination_path}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold border border-emerald-500/20">
                          {f.access_source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security and Access Warnings */}
              {warnings.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                  <h5 className="text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Security &amp; Paywall Compliance Warnings ({warnings.length})
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                    {warnings.map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Approval Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-500 font-mono">
                  Idempotency Key: {act.idempotency_key}
                </div>

                <div className="flex items-center gap-3">
                  {act.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleDecision(act.id, "REJECT", act.idempotency_key)}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 transition-colors"
                      >
                        Reject Action
                      </button>
                      <button
                        onClick={() => handleDecision(act.id, "APPROVE", act.idempotency_key)}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-colors"
                      >
                        Approve Plan
                      </button>
                    </>
                  )}

                  {act.status === "APPROVED" && (
                    <button
                      onClick={() => handleExecute(act.id)}
                      disabled={executing === act.id}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
                    >
                      {executing === act.id ? (
                        <>
                          <span className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Executing Downloads &amp; Verifying Magic Bytes...
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Execute Verified Downloads Now
                        </>
                      )}
                    </button>
                  )}

                  {act.status === "EXECUTED" && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Successfully Executed &bull; {act.result?.downloaded_count || 0} Artifacts Saved
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {actions.length === 0 && !loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <CheckSquare className="mx-auto h-8 w-8 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No actions pending approval</h3>
            <p className="mt-1 text-xs text-slate-500">
              Go to the Results page and click &quot;Stage OA PDFs&quot; to queue downloads.
            </p>
          </div>
        )}
      </div>

      {/* Artifact Manager Preview */}
      {artifacts.length > 0 && (
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-4">
            <Database className="h-4 w-4" />
            Verified Stored Artifacts ({artifacts.length})
          </h3>
          <div className="divide-y divide-slate-800 text-xs">
            {artifacts.map((art) => (
              <div key={art.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{art.original_filename}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    SHA-256: {art.checksum.slice(0, 24)}... &bull; {(art.size_bytes / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold border border-emerald-500/20">
                    Magic %PDF- Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
