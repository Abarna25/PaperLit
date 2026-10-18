"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Calendar,
  Layers,
  Sliders,
  AlertCircle,
  X,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";

export default function NewResearchPage() {
  const router = useRouter();

  const [question, setQuestion] = useState("How do Transformer architectures improve long-context language understanding?");
  const [yearStart, setYearStart] = useState<number>(2019);
  const [yearEnd, setYearEnd] = useState<number>(2024);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["transformer", "attention", "context"]);
  const [excludedInput, setExcludedInput] = useState("");
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [methodologies, setMethodologies] = useState<string[]>(["Linear Attention", "State Space Models"]);
  const [targetCount, setTargetCount] = useState<number>(25);
  const [minRelevance, setMinRelevance] = useState<number>(0.2);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const addExcluded = () => {
    if (excludedInput.trim() && !excludedKeywords.includes(excludedInput.trim())) {
      setExcludedKeywords([...excludedKeywords, excludedInput.trim()]);
      setExcludedInput("");
    }
  };

  const removeExcluded = (kw: string) => {
    setExcludedKeywords(excludedKeywords.filter((k) => k !== kw));
  };

  const toggleMethodology = (m: string) => {
    if (methodologies.includes(m)) {
      setMethodologies(methodologies.filter((x) => x !== m));
    } else {
      setMethodologies([...methodologies, m]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!question.trim()) {
      setError("Please provide a research question.");
      return;
    }
    if (yearStart > yearEnd) {
      setError("Start year must be less than or equal to End year.");
      return;
    }
    if (keywords.length === 0) {
      setError("At least one required search keyword must be provided.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.createRun({
        research_question: question.trim(),
        year_start: yearStart,
        year_end: yearEnd,
        keywords: keywords,
        excluded_keywords: excludedKeywords,
        preferred_methodologies: methodologies,
        target_count: targetCount,
        min_relevance_threshold: minRelevance,
      });

      router.push(`/research/${res.run_id}/results`);
    } catch (err: any) {
      setError(err.message || "Failed to start research run");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          Step 1: Research Request Specification
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Initialize Literature Intelligence Run
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
          Specify scholarly inquiry boundaries. The agent will formulate a query plan, retrieve records from arXiv and Semantic Scholar, and execute 10-step citation verification.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        {/* Research Question */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Research Question <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., How do Transformer architectures improve long-context language understanding?"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            required
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Start Year
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="number"
                min={1950}
                max={2030}
                value={yearStart}
                onChange={(e) => setYearStart(parseInt(e.target.value) || 2019)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 pl-10 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              End Year
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="number"
                min={1950}
                max={2030}
                value={yearEnd}
                onChange={(e) => setYearEnd(parseInt(e.target.value) || 2024)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 pl-10 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Required Keywords */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Required Keywords <span className="text-rose-400">*</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="Type keyword and press Enter or click Add"
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="rounded-xl bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300"
              >
                {kw}
                <button type="button" onClick={() => removeKeyword(kw)} className="text-cyan-400 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Optional Excluded Keywords */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Optional Excluded Keywords
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={excludedInput}
              onChange={(e) => setExcludedInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExcluded();
                }
              }}
              placeholder="e.g., robotics, quantum"
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="button"
              onClick={addExcluded}
              className="rounded-xl bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Exclude
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {excludedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300"
              >
                {kw}
                <button type="button" onClick={() => removeExcluded(kw)} className="text-rose-400 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Preferred Methodologies */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Preferred Methodologies &amp; Model Families
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              "Linear Attention",
              "State Space Models",
              "Rotary Embeddings (RoPE)",
              "Sparse Attention",
              "Recurrent Transformers",
              "Mixture of Experts"
            ].map((m) => {
              const selected = methodologies.includes(m);
              return (
                <button
                  type="button"
                  key={m}
                  onClick={() => toggleMethodology(m)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    selected
                      ? "bg-indigo-600 text-white border border-indigo-500 shadow-sm"
                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {selected && <CheckCircle2 className="inline mr-1 h-3 w-3" />}
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Result Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Target Result Count
              </label>
              <span className="text-xs font-bold text-cyan-400">{targetCount} papers</span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">Default 25 papers per project guidelines.</p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Min Relevance Threshold
              </label>
              <span className="text-xs font-bold text-cyan-400">{Math.round(minRelevance * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={0.8}
              step={0.05}
              value={minRelevance}
              onChange={(e) => setMinRelevance(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">Filters out low-confidence term matches.</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-indigo-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-600 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Retrieving &amp; Verifying Literature...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Execute Research Query &amp; Generate Passport
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
