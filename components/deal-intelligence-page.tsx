"use client"

import { useEffect, useState } from "react"
import { BrainCircuit } from "lucide-react"
import { fetchAnalyses, type AnalysisSummary } from "@/lib/api"
import { useApp } from "@/lib/app-context"

type RiskLevel = "Low" | "Medium" | "High"
type Outcome = "Term Sheet" | "Under Review" | "Declined" | "Passed" | "Pending"

interface DealRow {
  id: string
  startup: string
  sector: string
  signal: number
  risk: RiskLevel
  outcome: Outcome
}

// Derive risk level from investment signal score
function deriveRisk(score: number): RiskLevel {
  if (score >= 80) return "Low"
  if (score >= 60) return "Medium"
  return "High"
}

// Derive deal outcome from analysis status + score
function deriveOutcome(status: string, score: number): Outcome {
  if (status === "In Progress") return "Under Review"
  if (status === "Draft" || status === "Failed" || score === 0) return "Pending"
  // Complete analyses
  if (score >= 85) return "Term Sheet"
  if (score >= 65) return "Passed"
  return "Declined"
}

function mapToDeals(analyses: AnalysisSummary[]): DealRow[] {
  return analyses.map((a) => ({
    id: a.id,
    startup: a.name,
    sector: a.sector,
    signal: a.aiScore,
    risk: deriveRisk(a.aiScore),
    outcome: deriveOutcome(a.status, a.aiScore),
  }))
}

function getRiskColor(risk: RiskLevel) {
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

function getOutcomeBadge(outcome: Outcome) {
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

// Compute simple portfolio insight text from the loaded deals
function buildInsights(deals: DealRow[]) {
  const total = deals.length
  const bySector = deals.reduce<Record<string, number>>((acc, d) => {
    acc[d.sector] = (acc[d.sector] ?? 0) + 1
    return acc
  }, {})
  const topSector = Object.entries(bySector).sort((a, b) => b[1] - a[1])[0]
  const topSectorPct = total > 0 && topSector ? Math.round((topSector[1] / total) * 100) : 0
  const highSignalTermSheet = deals.filter((d) => d.signal >= 80 && d.outcome === "Term Sheet").length
  const highSignalTotal = deals.filter((d) => d.signal >= 80).length
  const highSignalRate = highSignalTotal > 0 ? Math.round((highSignalTermSheet / highSignalTotal) * 100) : 0
  const highRiskProceeded = deals.filter(
    (d) => d.risk === "High" && (d.outcome === "Term Sheet" || d.outcome === "Passed")
  ).length

  return {
    pattern:
      highSignalTotal > 0
        ? `Deals with investment signals above 80 have a ${highSignalRate}% term sheet rate in your portfolio history.`
        : "Upload and complete more analyses to see pattern insights.",
    sector:
      topSector
        ? `${topSectorPct}% of reviewed deals are in ${topSector[0]}. ${
            topSectorPct > 40 ? "Consider diversifying into underrepresented sectors." : "Sector distribution looks balanced."
          }`
        : "No sector data available yet.",
    risk:
      highRiskProceeded > 0
        ? `${highRiskProceeded} High Risk deal${highRiskProceeded > 1 ? "s" : ""} proceeded to term sheet or passed — review diligence depth on these.`
        : "No high-risk deals have proceeded to term sheet yet.",
  }
}

export function DealIntelligencePage() {
  const { setCurrentPage, setCurrentAnalysisId } = useApp()
  const [deals, setDeals] = useState<DealRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyses({ limit: 100 })
      .then((res) => setDeals(mapToDeals(res.data)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const insights = buildInsights(deals)

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
            {loading ? "…" : `${deals.length} deals tracked`}
          </span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
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
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => {
                      setCurrentAnalysisId(deal.id)
                      setCurrentPage("analysis")
                    }}
                    className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/50"
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
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRiskColor(
                          deal.risk
                        )}`}
                      >
                        {deal.risk}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getOutcomeBadge(
                          deal.outcome
                        )}`}
                      >
                        {deal.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && deals.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-muted-foreground"
                    >
                      No deals yet — complete some analyses to populate this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary Cards — computed from real data */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pattern Detection
          </h4>
          <p className="text-sm leading-relaxed text-card-foreground">{insights.pattern}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sector Concentration
          </h4>
          <p className="text-sm leading-relaxed text-card-foreground">{insights.sector}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Risk Correlation
          </h4>
          <p className="text-sm leading-relaxed text-card-foreground">{insights.risk}</p>
        </div>
      </div>
    </div>
  )
}
