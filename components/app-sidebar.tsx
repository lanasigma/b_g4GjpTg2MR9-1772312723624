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
  Sparkles,
  ShieldAlert,
  BrainCircuit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"

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
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sidebar-foreground">Analyst Copilot</h1>
          <p className="text-[11px] text-muted-foreground">VC Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          System
        </div>
        <ul className="flex flex-col gap-0.5">
          <li>
            <button
              onClick={() => setCurrentPage("settings")}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                currentPage === "settings"
                  ? "bg-sidebar-accent text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              Settings
            </button>
          </li>
        </ul>
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            AV
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Acme Ventures</p>
            <p className="truncate text-[11px] text-muted-foreground">alex@acmevc.com</p>
          </div>
          <button className="relative shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              3
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}
