"use client"

import { useEffect, useState } from "react"
import { Briefcase, Loader2 } from "lucide-react"
import { fetchAnalyses, type AnalysisSummary } from "@/lib/api"
import { useApp } from "@/lib/app-context"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return iso
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-primary"
  if (score > 0) return "text-warning-foreground"
  return "text-muted-foreground"
}

const COLUMNS = [
  {
    status: "In Progress",
    label: "In Progress",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    status: "Complete",
    label: "Complete",
    color: "bg-success/10 text-success border-success/20",
  },
  {
    status: "Failed",
    label: "Failed",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
] as const

export function DealFlowPage() {
  const { setCurrentPage, setCurrentAnalysisId } = useApp()
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyses({ limit: 100 })
      .then((res) => setAnalyses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const grouped = COLUMNS.reduce<Record<string, AnalysisSummary[]>>(
    (acc, col) => {
      acc[col.status] = analyses.filter((a) => a.status === col.status)
      return acc
    },
    {}
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Deal Flow</h2>
          <p className="text-sm text-muted-foreground">
            Track your entire investment pipeline by status.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {COLUMNS.map((col) => {
            const items = grouped[col.status] ?? []
            return (
              <div key={col.status} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${col.color}`}
                  >
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {items.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        setCurrentAnalysisId(a.id)
                        setCurrentPage("analysis")
                      }}
                      className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-card-foreground leading-tight">
                          {a.name}
                        </span>
                        {a.aiScore > 0 && (
                          <span
                            className={`shrink-0 text-sm font-bold ${getScoreColor(a.aiScore)}`}
                          >
                            {a.aiScore}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{a.sector}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {a.stage || "Unknown stage"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {relativeTime(a.lastUpdated)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center text-xs text-muted-foreground">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
