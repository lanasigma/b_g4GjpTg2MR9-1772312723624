"use client"

import { Settings, Sun, Moon, Monitor, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your workspace preferences.</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-1 text-sm font-semibold text-card-foreground">Appearance</h3>
        <p className="mb-4 text-xs text-muted-foreground">Choose how the interface looks.</p>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={theme === value ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setTheme(value)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Workspace */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-1 text-sm font-semibold text-card-foreground">Workspace</h3>
        <p className="mb-4 text-xs text-muted-foreground">Your workspace details.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Firm name</p>
            <p className="mt-0.5 text-sm font-medium text-card-foreground">Acme Ventures</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contact</p>
            <p className="mt-0.5 text-sm font-medium text-card-foreground">alex@acmevc.com</p>
          </div>
        </div>
      </div>

      {/* AI Model */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-1 text-sm font-semibold text-card-foreground">AI Model</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Model used for analysis and chat responses.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">claude-sonnet-4-6</p>
            <p className="text-xs text-muted-foreground">Anthropic · Latest</p>
          </div>
          <span className="ml-auto inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            Active
          </span>
        </div>
      </div>

      {/* Pipeline */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-1 text-sm font-semibold text-card-foreground">Analysis Pipeline</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Background job queue configuration.
        </p>
        <div className="flex flex-col gap-2 text-sm">
          {[
            { step: "1. Parse pitch materials", note: "PDF / website / manual text" },
            { step: "2. Structure company intelligence", note: "Company summary extraction" },
            { step: "3. Map market landscape", note: "Competitor identification" },
            { step: "4. Detect risks & gaps", note: "Risk signal detection" },
            { step: "5. Generate investment memo", note: "LLM memo + investment signal" },
          ].map(({ step, note }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <div>
                <span className="text-card-foreground">{step}</span>
                <span className="ml-2 text-xs text-muted-foreground">— {note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
