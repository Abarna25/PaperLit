"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Radar,
  Sparkles,
  Layers,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Flame,
  Cpu,
  BarChart2,
  FileQuestion
} from "lucide-react";
import { api } from "@/lib/api";
import { RunDetailsResponse, ResearchGap } from "@/lib/types";

export default function GapRadarPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const runId = resolvedParams.id;

  const [data, setData] = useState<RunDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRun(runId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load Gap Radar data");
        setLoading(false);
      });
  }, [runId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="h-8 w-8 mx-auto border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Synthesizing multi-dimensional Research Gap Radar...</p>
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

  const { gaps, papers } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-900 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Distinctive Novelty D
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="font-mono text-xs text-slate-400">{runId}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            <Radar className="h-7 w-7 text-purple-400" />
            Research Gap Radar
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Cross-literature dimensional analysis identifying underrepresented problem-method combinations,
            recurring author-stated limitations, and candidate research hypotheses with supporting evidence.
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

      {/* 7-Dimensional Analysis Matrix Overview */}
      <div className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-400" />
          7-Dimensional Scholarly Literature Organization
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {[
            { label: "1. Problem Domain", count: "Long-Context LLMs" },
            { label: "2. Method Family", count: "5 Arch Classes" },
            { label: "3. Eval Context", count: "GLUE, ImageNet, Code" },
            { label: "4. Target Metrics", count: "Perplexity, Latency" },
            { label: "5. Main Findings", count: "25 Extracted" },
            { label: "6. Stated Limits", count: "O(N²) & Memory" },
            { label: "7. Future Work", count: "Cross-Modal Ext." },
          ].map((dim, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">{dim.label}</span>
              <span className="text-xs font-bold text-cyan-300 mt-1 block">{dim.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Gaps Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Synthesized Literature Gaps ({gaps.length})
          </h2>
          <span className="text-xs text-slate-500">
            Tagged as Hypotheses &bull; Linked to ground-truth records
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gaps.map((gap) => (
            <div
              key={gap.id}
              className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900/80 to-purple-950/20 p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between"
            >
              <div>
                {/* Confidence & Type Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {gap.gap_type.replace(/_/g, " ")}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    Confidence: {gap.confidence}
                  </span>
                </div>

                {/* Gap Description */}
                <h3 className="text-sm font-bold text-white leading-snug">
                  {gap.description}
                </h3>

                {/* Supporting Papers */}
                {gap.supporting_paper_titles && gap.supporting_paper_titles.length > 0 && (
                  <div className="mt-4 rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Supporting Literature Evidence ({gap.supporting_paper_titles.length}):
                    </span>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                      {gap.supporting_paper_titles.map((t, idx) => (
                        <li key={idx} className="line-clamp-1 hover:text-cyan-400 transition-colors">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Counterevidence */}
                {gap.counterevidence && gap.counterevidence.length > 0 && (
                  <div className="mt-3 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-200">
                    <span className="font-bold text-[10px] uppercase block mb-1">
                      Counterevidence / Contrasting Work:
                    </span>
                    <p>{gap.counterevidence[0]?.note || "Preliminary contrasting observations documented in corpus."}</p>
                  </div>
                )}
              </div>

              {/* Disclaimer footer */}
              <div className="mt-6 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 italic">
                * Note: Labeled strictly as a scholarly candidate hypothesis based on the retrieved 25-paper corpus.
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
