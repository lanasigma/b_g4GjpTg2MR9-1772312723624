"use client"

import { useEffect, useState } from "react"
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
  XCircle,
  CheckCircle,
  HelpCircle,
} from "lucide-react"
import { fetchAnalyses, fetchAnalysis, type AnalysisSummary, type AnalysisResult } from "@/lib/api"
import { useApp } from "@/lib/app-context"

function getRisk(score: number): "Low" | "Medium" | "High" {
  if (score >= 80) return "Low"
  if (score >= 60) return "Medium"
  return "High"
}

function getRiskBadge(risk: "Low" | "Medium" | "High") {
  switch (risk) {
    case "Low":
      return "bg-success/10 text-success border-success/20"
    case "Medium":
      return "bg-warning/10 text-warning-foreground border-warning/20"
    case "High":
      return "bg-destructive/10 text-destructive border-destructive/20"
  }
}

function getRiskPanelBorder(risk: "Low" | "Medium" | "High") {
  switch (risk) {
    case "Low":
      return "border-success/30 bg-success/5"
    case "Medium":
      return "border-warning/30 bg-warning/5"
    case "High":
      return "border-destructive/30 bg-destructive/5"
  }
}

export function RiskSignalsPage() {
  const { setCurrentPage, setCurrentAnalysisId } = useApp()
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cache, setCache] = useState<Record<string, AnalysisResult>>({})
  const [expandLoading, setExpandLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyses({ limit: 100 })
      .then((res) => setAnalyses(res.data.filter((a) => a.status === "Complete")))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (cache[id]) return
    setExpandLoading(id)
    try {
      const result = await fetchAnalysis(id)
      setCache((prev) => ({ ...prev, [id]: result }))
    } catch (err) {
      console.error(err)
    } finally {
      setExpandLoading(null)
    }
  }

  const highRisk = analyses.filter((a) => a.aiScore > 0 && a.aiScore < 60)
  const medRisk = analyses.filter((a) => a.aiScore >= 60 && a.aiScore < 80)
  const lowRisk = analyses.filter((a) => a.aiScore >= 80)
  const sorted = [...highRisk, ...medRisk, ...lowRisk]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Risk Signals</h2>
          <p className="text-sm text-muted-foreground">
            Detailed risk breakdown across your portfolio pipeline. Click any company to expand its full risk analysis.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "High Risk Deals", count: highRisk.length, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Medium Risk Deals", count: medRisk.length, icon: ShieldAlert, color: "text-warning-foreground", bg: "bg-warning/10" },
          { label: "Low Risk Deals", count: lowRisk.length, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold tracking-tight ${color}`}>{loading ? "—" : count}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Table with expandable rows */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-card-foreground">
            Completed Analyses by Risk Level
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No completed analyses yet — finish some analyses to see risk signals here.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="w-8 px-3 py-3" />
                <th className="px-5 py-3">Startup</th>
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3 text-right">Investment Signal</th>
                <th className="px-5 py-3">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const risk = getRisk(a.aiScore)
                const isExpanded = expandedId === a.id
                const isLoadingThis = expandLoading === a.id
                const data = cache[a.id]

                return (
                  <>
                    <tr
                      key={a.id}
                      onClick={() => handleToggle(a.id)}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                    >
                      <td className="px-3 py-3.5 text-center">
                        {isLoadingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-card-foreground">
                        {a.name}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{a.sector}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{a.stage || "—"}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-primary">
                        {a.aiScore}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRiskBadge(risk)}`}
                        >
                          {risk} Risk
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${a.id}-detail`} className="border-b border-border last:border-0">
                        <td colSpan={6} className="p-4">
                          {isLoadingThis || !data ? (
                            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading risk details…
                            </div>
                          ) : !data.riskSignals ? (
                            <p className="py-2 text-sm text-muted-foreground">
                              No detailed risk data available for this analysis.
                            </p>
                          ) : (
                            <div
                              className={`rounded-xl border p-5 ${getRiskPanelBorder(data.riskSignals.riskLevel)}`}
                            >
                              <div className="flex flex-col gap-6">
                                {/* Risk summary header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getRiskBadge(data.riskSignals.riskLevel)}`}
                                    >
                                      {data.riskSignals.riskLevel} Risk
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {data.riskSignals.detectedRisks.length} risk factor
                                      {data.riskSignals.detectedRisks.length !== 1 ? "s" : ""} detected
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCurrentAnalysisId(a.id)
                                      setCurrentPage("analysis")
                                    }}
                                    className="text-xs font-medium text-primary hover:underline"
                                  >
                                    View full analysis →
                                  </button>
                                </div>

                                {/* Detected risks with full details */}
                                {data.riskSignals.detectedRisks.length > 0 && (
                                  <div>
                                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      Detected Risk Factors
                                    </h4>
                                    <div className="flex flex-col gap-3">
                                      {data.riskSignals.detectedRisks.map((r, i) => (
                                        <div
                                          key={i}
                                          className="rounded-lg border border-border bg-card p-4"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                                              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-card-foreground">
                                                {r.title}
                                              </p>
                                              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                                {r.detail}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Data completeness / missing metrics */}
                                {data.riskSignals.missingMetrics.length > 0 && (
                                  <div>
                                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      Data Completeness
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                      {data.riskSignals.missingMetrics.map((m, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
                                        >
                                          {m.present ? (
                                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-success" />
                                          ) : (
                                            <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                                          )}
                                          <span className="text-xs text-card-foreground">{m.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Diligence questions */}
                                {data.riskSignals.diligenceQuestions.length > 0 && (
                                  <div>
                                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      Key Diligence Questions
                                    </h4>
                                    <ul className="flex flex-col gap-2.5">
                                      {data.riskSignals.diligenceQuestions.map((q, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                            {i + 1}
                                          </span>
                                          <span className="text-sm leading-relaxed text-card-foreground">
                                            {q}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Competitive context if available */}
                                {data.insights && (
                                  <div>
                                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      Competitive Context
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="rounded-lg border border-border bg-card p-4">
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                                          Competitive Advantage
                                        </p>
                                        <p className="text-sm leading-relaxed text-card-foreground">
                                          {data.insights.competitiveAdvantage}
                                        </p>
                                      </div>
                                      <div className="rounded-lg border border-border bg-card p-4">
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                                          Market Gaps
                                        </p>
                                        <p className="text-sm leading-relaxed text-card-foreground">
                                          {data.insights.marketGaps}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Investment decision context */}
                                {data.investmentDecision && (
                                  <div className="rounded-lg border border-border bg-card p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                                          Investment Verdict Rationale
                                        </p>
                                        <p className="text-sm leading-relaxed text-card-foreground">
                                          {data.investmentDecision.verdictRationale}
                                        </p>
                                      </div>
                                      <span
                                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                                          data.investmentDecision.verdict === "STRONG_BUY"
                                            ? "border-success/30 bg-success/10 text-success"
                                            : data.investmentDecision.verdict === "BUY"
                                            ? "border-primary/30 bg-primary/10 text-primary"
                                            : data.investmentDecision.verdict === "HOLD"
                                            ? "border-warning/30 bg-warning/10 text-warning-foreground"
                                            : "border-destructive/30 bg-destructive/10 text-destructive"
                                        }`}
                                      >
                                        {data.investmentDecision.verdict.replace("_", " ")}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
