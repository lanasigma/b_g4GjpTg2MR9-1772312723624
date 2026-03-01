"use client"

import {
  LayoutDashboard,
  Upload,
  FileText,
  Bookmark,
  Settings,
  Bell,
  Search,
  Briefcase,
  ShieldAlert,
  BrainCircuit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"

// ── investAble.ai logo mark (inline SVG — no file dependency) ──────────────
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="9" fill="#E8521A" />
      {/* underscore */}
      <rect x="7" y="29" width="11" height="2.5" rx="1" fill="white" />
      {/* i stem */}
      <rect x="9.5" y="17" width="3" height="11" rx="1" fill="white" />
      {/* i dot */}
      <rect x="9.5" y="13" width="3" height="2.5" rx="1" fill="white" />
      {/* A left leg */}
      <polygon points="21,11 25.5,30 23.5,30 20,14" fill="white" />
      {/* A right leg */}
      <polygon points="33,11 28.5,30 30.5,30 34,14" fill="white" />
      {/* A crossbar */}
      <rect x="22.5" y="22" width="10" height="2.5" rx="1" fill="white" />
    </svg>
  )
}

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "deal-flow" as const, label: "Deal Flow", icon: Briefcase },
  { id: "upload" as const, label: "Upload Startup", icon: Upload },
  { id: "analysis" as const, label: "Market Intelligence", icon: Search },
  { id: "risk-signals" as const, label: "Risk Signals", icon: ShieldAlert },
  { id: "deal-intelligence" as const, label: "Deal Intelligence", icon: BrainCircuit },
  { id: "reports" as const, label: "Reports", icon: FileText },
  { id: "saved" as const, label: "Saved Analyses", icon: Bookmark },
]

export function AppSidebar() {
  const { currentPage, setCurrentPage } = useApp()

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">

      {/* ── Brand / Logo ───────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <LogoMark className="h-9 w-9 shrink-0 drop-shadow-lg" />
        <div>
          <h1 className="text-sm font-bold leading-tight tracking-tight text-sidebar-foreground">
            invest<span className="text-primary">Able</span>
            <span className="text-sidebar-foreground/50">.ai</span>
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
            VC Intelligence
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-sidebar-border" />

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
          Workspace
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-sidebar-accent text-primary"
                      : "text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                  )}
                >
                  {/* Active left-border accent */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80"
                    )}
                  />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>

        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
          System
        </p>
        <ul className="flex flex-col gap-0.5">
          <li>
            <button
              onClick={() => setCurrentPage("settings")}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                currentPage === "settings"
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              )}
            >
              {currentPage === "settings" && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Settings
                className={cn(
                  "h-4 w-4 shrink-0",
                  currentPage === "settings"
                    ? "text-primary"
                    : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80"
                )}
              />
              Settings
            </button>
          </li>
        </ul>
      </nav>

      {/* ── User / Bottom ──────────────────────────────────── */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-sidebar-accent/70">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-md shadow-primary/30">
            AV
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
              Acme Ventures
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/40">
              alex@acmevc.com
            </p>
          </div>
          <button
            className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/35 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
