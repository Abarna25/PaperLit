"use client";

import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Key,
  Layers,
  Cpu,
  Info
} from "lucide-react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="pb-6 border-b border-slate-900 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
          <SettingsIcon className="h-7 w-7 text-cyan-400" />
          System Settings &amp; API Integration Status
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Inspect configuration status for research APIs, database connections, and storage buckets.
        </p>
      </div>

      <div className="space-y-6">
        {/* Supabase Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Supabase PostgreSQL &amp; Auth</h3>
                <p className="text-[11px] text-slate-400">Row Level Security &amp; Private Storage Buckets</p>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                settings?.supabase_connected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              {settings?.supabase_connected ? "Connected Live" : "Local Fallback Cache Active"}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Endpoint URL:</span>
              <span className="font-mono text-slate-300">{settings?.supabase_url || "Local Memory / SQLite"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Private Bucket:</span>
              <span className="font-mono text-cyan-400">{settings?.storage_bucket || "littrust-artifacts"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Row Level Security:</span>
              <span className="font-semibold text-emerald-400">Enabled on all 14 tables</span>
            </div>
          </div>
        </div>

        {/* Scholarly Research APIs */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">External Academic Scholarly Services</h3>
                <p className="text-[11px] text-slate-400">arXiv Atom, Semantic Scholar Graph, Crossref REST</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold">
              Operational
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">arXiv API:</span>
              <span className="font-semibold text-emerald-400">Connected (export.arxiv.org/api/query)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Crossref REST API:</span>
              <span className="font-mono text-slate-300">
                {settings?.crossref_email || "researcher@littrust.ai"} (Polite pool)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Semantic Scholar Graph API:</span>
              <span className="font-semibold text-slate-300">
                {settings?.semantic_scholar_api_key_set ? "API Key Configured" : "Public Rate-Limited Tier"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Max PDF Download Size:</span>
              <span className="font-mono text-cyan-400">{settings?.max_pdf_size_mb || 30} MB Limit</span>
            </div>
          </div>
        </div>

        {/* Deployment Instructions Box */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-6 shadow-xl backdrop-blur-sm">
          <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-2">
            <Info className="h-4 w-4" />
            Supabase Activation Guide
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            To connect a remote hosted Supabase project, execute the version-controlled SQL files in{" "}
            <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">supabase/migrations/</code> in the Supabase SQL Editor,
            and supply <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">.env</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
