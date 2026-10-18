"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Beaker,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertTriangle,
  Info
} from "lucide-react";
import { api } from "@/lib/api";
import { TestRun } from "@/lib/types";

const TEST_DEFINITIONS = [
  {
    key: "TC1" as const,
    title: "TC1: Topic Query & 25-Paper Coverage",
    badge: "Topic Query",
    description:
      "Discovers relevant scholarly papers from arXiv and Semantic Scholar across year constraints, scoring with BM25 explanations, verifying DOIs, and accounting for qualifying records without fabrication.",
    expected: ">= 20 qualifying records with matching DOIs/authors; never invent papers to force 25."
  },
  {
    key: "TC2" as const,
    title: "TC2: Preprint & Journal Lineage Merging",
    badge: "Lineage Intelligence",
    description:
      "Evaluates two controlled records of the same work (arXiv preprint vs peer-reviewed proceedings). Merges into one canonical bibliography record while preserving both versions and provenance.",
    expected: "1 canonical record; 2 preserved sources; preferred peer-reviewed venue; linked version relationship."
  },
  {
    key: "TC3" as const,
    title: "TC3: Paywalled Access Integrity",
    badge: "Access Policy",
    description:
      "Tests a controlled record behind a commercial publisher paywall. Asserts legitimate article link is retained, paywall bypass is strictly prohibited, and zero unauthorized downloads are staged.",
    expected: "PAYWALLED_OR_RESTRICTED status; legitimate URL retained; 0 download actions staged."
  },
  {
    key: "TC4" as const,
    title: "TC4: DOI Title Mismatch Quarantine",
    badge: "Citation Trust",
    description:
      "Candidate metadata claims 'Attention Is All You Need', but its DOI resolves to an incongruent chemistry paper. Asserts mismatch is flagged and candidate is excluded from verified exports.",
    expected: "MISMATCH verification status; title similarity < 20%; excluded from verified BibTeX export."
  }
];

export default function EvaluationLabPage() {
  const [testRuns, setTestRuns] = useState<Record<string, TestRun | null>>({});
  const [loading, setLoading] = useState(true);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>("TC1");
  const [error, setError] = useState<string | null>(null);

  const fetchTests = () => {
    api
      .getTestCases()
      .then((data) => {
        setTestRuns(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load test cases");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleRunTest = async (tc: "TC1" | "TC2" | "TC3" | "TC4") => {
    setRunningTest(tc);
    setError(null);
    try {
      const res = await api.runTestCase(tc);
      setTestRuns((prev) => ({ ...prev, [tc]: res }));
      setExpandedTest(tc);
      setRunningTest(null);
    } catch (err: any) {
      setError(`Failed to execute ${tc}: ${err.message}`);
      setRunningTest(null);
    }
  };

  const handleRunAll = async () => {
    setError(null);
    for (const def of TEST_DEFINITIONS) {
      setRunningTest(def.key);
      try {
        const res = await api.runTestCase(def.key);
        setTestRuns((prev) => ({ ...prev, [def.key]: res }));
      } catch (err: any) {
        setError(`Error running ${def.key}: ${err.message}`);
        break;
      }
    }
    setRunningTest(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-900 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Section 8 Specification
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            <Beaker className="h-7 w-7 text-cyan-400" />
            Evaluation Lab (TC1–TC4)
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Deterministic automated testing laboratory executing the four official acceptance test cases
            with reproducible input snapshots, expected assertions, and cryptographic evidence trails.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={runningTest !== null}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <RotateCcw className={`h-4 w-4 ${runningTest ? "animate-spin" : ""}`} />
          Run All 4 Test Cases
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Test Cases Grid */}
      <div className="space-y-6">
        {TEST_DEFINITIONS.map((def) => {
          const run = testRuns[def.key];
          const isRunning = runningTest === def.key;
          const isExpanded = expandedTest === def.key;
          const status = run?.status || "NOT_RUN";

          return (
            <div
              key={def.key}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm transition-all"
            >
              {/* Card Header Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`rounded-xl p-2.5 border mt-0.5 ${
                      status === "PASS"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : status === "FAIL"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {status === "PASS" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : status === "FAIL" ? (
                      <XCircle className="h-6 w-6" />
                    ) : (
                      <Beaker className="h-6 w-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{def.key}</span>
                      <span className="text-slate-600">&bull;</span>
                      <h3 className="text-base font-bold text-white">{def.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-300 max-w-2xl">{def.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                  {/* Status Pill */}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      status === "PASS"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : status === "FAIL"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {status}
                  </span>

                  {/* Run Test Button */}
                  <button
                    onClick={() => handleRunTest(def.key)}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors border border-slate-700 disabled:opacity-50"
                  >
                    <Play className={`h-3.5 w-3.5 text-cyan-400 ${isRunning ? "animate-spin" : ""}`} />
                    {isRunning ? "Running..." : "Execute Test"}
                  </button>

                  {/* Expand/Collapse Toggle */}
                  <button
                    onClick={() => setExpandedTest(isExpanded ? null : def.key)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable Evidence Drawer */}
              {isExpanded && run && (
                <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4">
                  {/* Assertion Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                        Expected Assertion
                      </span>
                      <pre className="text-slate-300 font-mono whitespace-pre-wrap">
                        {JSON.stringify(run.expected_result, null, 2)}
                      </pre>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                        Actual Observed Result
                      </span>
                      <pre className="text-emerald-300 font-mono whitespace-pre-wrap">
                        {JSON.stringify(run.actual_result, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Input Snapshot & Raw Evidence */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs">
                    <span className="font-bold text-cyan-400 uppercase tracking-wider text-[10px] block mb-1">
                      Verifiable Evidence Snapshot &amp; Audit Log
                    </span>
                    <pre className="overflow-x-auto text-[11px] font-mono text-slate-400 max-h-48 leading-relaxed">
                      {JSON.stringify(
                        {
                          test_case: run.test_case,
                          started_at: run.started_at,
                          completed_at: run.completed_at,
                          input_snapshot: run.input_snapshot,
                          evidence: run.evidence
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
