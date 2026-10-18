import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Beaker,
  FileCheck,
  Radar,
  GitMerge,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  Layers
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 mb-6 backdrop-blur-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>Scholarly Research Integrity &bull; Zero Hallucinated Citations</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
          Evidence-First Literature Intelligence &amp;{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">
            Bibliography Builder
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
          An AI research agent for faculty and students to query scholarly literature across arXiv and
          Semantic Scholar with cryptographic DOI verification, preprint-to-journal lineage intelligence,
          human-in-the-loop approvals, and a verifiable Research Gap Radar.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/research/new"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all hover:scale-102"
          >
            <Search className="h-4 w-4" />
            Start Research Query
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/evaluation-lab"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-sm"
          >
            <Beaker className="h-4 w-4 text-cyan-400" />
            Evaluation Lab (TC1–TC4)
          </Link>
          <Link
            href="/research/demo-run-transformers-2024/results"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-5 py-3.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
          >
            Explore Active Demo Run
          </Link>
        </div>
      </section>

      {/* Novelties Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Core System Novelties</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">Engineered for Scholarly Rigor</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Novelty A */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Research Evidence Passport</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Granular audit trail for every paper distinguishing verified facts, source claims, model interpretations,
              and uncertainties with full provenance.
            </p>
          </div>

          {/* Novelty B */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Citation Trust Engine</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              10-step verification resolving DOIs through Crossref, normalizing Unicode titles, comparing author order,
              and isolating mismatches.
            </p>
          </div>

          {/* Novelty C */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <GitMerge className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Publication Lineage</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Detects preprints, revisions, and journal versions. Merges canonical records while retaining source links
              and preferring peer-reviewed venues.
            </p>
          </div>

          {/* Novelty D */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Radar className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Research Gap Radar</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Organizes literature across 7 dimensions (problem, method, dataset, metrics, findings, limitations, future work)
              to synthesize candidate gap hypotheses.
            </p>
          </div>
        </div>
      </section>

      {/* Acceptance Tests Showcase Banner */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Official Acceptance Tests</span>
              <h3 className="mt-1 text-2xl font-bold text-white">TC1 to TC4 Verification Suite</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                Inspect live reproducible results for Topic Queries (TC1), Preprint/Journal Merging (TC2),
                Paywalled Access Integrity (TC3), and DOI Mismatch Exclusion (TC4).
              </p>
            </div>
            <Link
              href="/evaluation-lab"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-5 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all whitespace-nowrap"
            >
              <Beaker className="h-4 w-4" />
              Open Evaluation Lab
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
