"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Search,
  LayoutDashboard,
  CheckSquare,
  Radar,
  FileText,
  Beaker,
  Settings as SettingsIcon,
  Activity
} from "lucide-react";
import { api } from "@/lib/api";

export const Navbar = () => {
  const pathname = usePathname();
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .getHealth()
      .then(() => setBackendHealthy(true))
      .catch(() => setBackendHealthy(false));
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/research/new", label: "New Query", icon: Search },
    { href: "/evaluation-lab", label: "Evaluation Lab (TC1–TC4)", icon: Beaker, badge: "Tests" },
    { href: "/research/demo-run-transformers-2024/results", label: "Evidence Results", icon: FileText },
    { href: "/research/demo-run-transformers-2024/gap-radar", label: "Gap Radar", icon: Radar },
    { href: "/research/demo-run-transformers-2024/approvals", label: "Approvals", icon: CheckSquare },
    { href: "/research/demo-run-transformers-2024/bibliography", label: "BibTeX", icon: FileText },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              LitTrust <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
            </span>
            <span className="block text-[10px] font-medium tracking-wide text-slate-400 uppercase">
              Evidence-First Literature Agent
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                {item.label}
                {item.badge && (
                  <span className="ml-1 rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-300 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                backendHealthy === true
                  ? "bg-emerald-400 animate-pulse"
                  : backendHealthy === false
                  ? "bg-rose-400"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="text-[11px] font-medium text-slate-300">
              {backendHealthy === true ? "FastAPI Live" : backendHealthy === false ? "Connecting..." : "Checking API"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
