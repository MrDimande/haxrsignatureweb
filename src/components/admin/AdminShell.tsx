"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

type AdminShellProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export default function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black flex" data-lenis-prevent>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Main Header bar */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Content Area with Top Page info */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-4rem)]">
          {/* Top Page Header (Title, Breadcrumbs & Actions) Maxton Style */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-white/[0.03] pb-6">
            <div className="space-y-1">
              <h1 className="font-serif text-2.5xl font-light text-white tracking-wide">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-grey/65 font-sans leading-relaxed">
                  {subtitle}
                </p>
              )}

              {/* Breadcrumb with Home icon */}
              <div className="flex items-center gap-2 text-[9px] font-mono text-grey-medium opacity-60 uppercase tracking-widest pt-0.5">
                <Home className="w-3 h-3 text-admin-gold/75" strokeWidth={1.5} />
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-white/80">{title.toLowerCase()}</span>
              </div>
            </div>

            {actions && (
              <div className="flex flex-wrap gap-3 shrink-0">
                {actions}
              </div>
            )}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
