import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LitTrust AI — Evidence-First Literature Intelligence",
  description:
    "AI research agent with Citation Trust Engine, Publication Lineage Intelligence, Research Evidence Passports, and Research Gap Radar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<div className="h-14 border-b border-slate-900 bg-slate-950/80" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 pb-16">{children}</main>
          <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>LitTrust AI &copy; 2026 — Evidence-First Literature Intelligence & Bibliography Builder</p>
              <p className="text-slate-600">Crossref REST &bull; arXiv Atom &bull; Semantic Scholar Graph &bull; Supabase RLS</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
