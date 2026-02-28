"use client"

import { BrainCircuit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { demoDealIntelligence } from "@/lib/demo-data"

function getRiskColor(risk: "Low" | "Medium" | "High") {
  switch (risk) {
    case "Low":
      return "bg-success/10 text-success border-success/20"
    case "Medium":
      return "bg-warning/10 text-warning-foreground border-warning/20"
    case "High":
      return "bg-destructive/10 text-destructive border-destructive/20"
  }
}

function getSignalColor(signal: number) {
  if (signal >= 80) return "text-success"
  if (signal >= 60) return "text-primary"
  if (signal > 0) return "text-warning-foreground"
  return "text-muted-foreground"
}

function getOutcomeBadge(outcome: string) {
  switch (outcome) {
    case "Term Sheet":
      return "bg-success/10 text-success border-success/20"
    case "Under Review":
      return "bg-primary/10 text-primary border-primary/20"
    case "Passed":
      return "bg-muted text-muted-foreground border-border"
    case "Declined":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "Pending":
      return "bg-warning/10 text-warning-foreground border-warning/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export function DealIntelligencePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BrainCircuit className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Deal Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            Analyst Copilot learns from prior analyses to build institutional investment knowledge over time.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-card-foreground">
            Historical Deal Analysis
          </h3>
          <span className="text-xs text-muted-foreground">
            {demoDealIntelligence.length} deals tracked
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3">Startup</th>
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3 text-right">Investment Signal</th>
                <th className="px-5 py-3">Risk Level</th>
                <th className="px-5 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {demoDealIntelligence.map((deal) => (
                <tr
                  key={deal.startup}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-card-foreground">
                      {deal.startup}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {deal.sector}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-sm font-semibold ${getSignalColor(deal.signal)}`}>
                      {deal.signal > 0 ? deal.signal : "--"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRiskColor(deal.risk)}`}>
                      {deal.risk}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getOutcomeBadge(deal.outcome)}`}>
                      {deal.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pattern Detection
          </h4>
          <p className="text-sm leading-relaxed text-card-foreground">
            Enterprise SaaS deals with investment signals above 80 have a 73% success rate in your portfolio history.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sector Concentration
          </h4>
          <p className="text-sm leading-relaxed text-card-foreground">
            38% of reviewed deals are in Enterprise SaaS. Consider diversifying into underrepresented sectors like Climate Tech.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Risk Correlation
          </h4>
          <p className="text-sm leading-relaxed text-card-foreground">
            Deals flagged "High Risk" that proceeded to term sheet had 2.1x longer diligence cycles on average.
          </p>
        </div>
      </div>
    </div>
  )
}
