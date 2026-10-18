import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Lock, Unlock, FileQuestion } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "verification" | "access" | "lineage" | "gap";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = "verification", className = "" }) => {
  // Verification badges
  if (status === "VERIFIED") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        DOI Verified
      </span>
    );
  }

  if (status === "MISMATCH") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 ${className}`}>
        <XCircle className="w-3.5 h-3.5" />
        DOI Mismatch
      </span>
    );
  }

  if (status === "PENDING_REVIEW") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        Pending Review
      </span>
    );
  }

  if (status === "NO_DOI") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30 ${className}`}>
        <HelpCircle className="w-3.5 h-3.5" />
        No DOI
      </span>
    );
  }

  if (status === "UNVERIFIED") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}>
        <HelpCircle className="w-3.5 h-3.5" />
        Unverified
      </span>
    );
  }

  // Access badges
  if (status === "OPEN_ACCESS_VERIFIED") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 ${className}`}>
        <Unlock className="w-3.5 h-3.5" />
        Open Access
      </span>
    );
  }

  if (status === "PAYWALLED_OR_RESTRICTED") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 ${className}`}>
        <Lock className="w-3.5 h-3.5" />
        Paywalled
      </span>
    );
  }

  if (status === "ACCESS_UNKNOWN" || status === "PDF_UNAVAILABLE") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/30 ${className}`}>
        <FileQuestion className="w-3.5 h-3.5" />
        Access Unknown
      </span>
    );
  }

  // Generic fallback
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
      {status}
    </span>
  );
};
