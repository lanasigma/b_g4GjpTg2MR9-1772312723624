"use client"

import { useEffect, useState } from "react"
import { ShieldAlert, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { fetchAnalyses, type AnalysisSummary } from "@/lib/api"
import { useApp } from "@/lib/app-context"

function getRisk(score: number): "Low" | "Medium" | "High" {
  if (score >= 80) return "Low"
  if (score >= 60) return "Medium"
  return "High"
}

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

export function RiskSignalsPage() {
  const { setCurrentPage, setCurrentAnalysisId } = useApp()
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyses({ limit: 100 })
      .then((res) => setAnalyses(res.data.filter((a) => a.status === "Complete")))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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
            Centralized view of flagged risks across your portfolio pipeline.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "High Risk Deals",
            count: highRisk.length,
            icon: AlertTriangle,
            color: "text-destructive",
            bg: "bg-destructive/10",
          },
          {
            label: "Medium Risk Deals",
            count: medRisk.length,
            icon: ShieldAlert,
            color: "text-warning-foreground",
            bg: "bg-warning/10",
          },
          {
            label: "Low Risk Deals",
            count: lowRisk.length,
            icon: CheckCircle2,
            color: "text-success",
            bg: "bg-success/10",
          },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold tracking-tight ${color}`}>
              {loading ? "—" : count}
            </p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
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
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
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
                return (
                  <tr
                    key={a.id}
                    onClick={() => {
                      setCurrentAnalysisId(a.id)
                      setCurrentPage("analysis")
                    }}
                    className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-card-foreground">
                      {a.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{a.sector}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {a.stage || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-primary">
                      {a.aiScore}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRiskColor(risk)}`}
                      >
                        {risk} Risk
                      </span>
                    </td>
                  </tr>
                )
              })}

              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No completed analyses yet — finish some analyses to see risk signals here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
