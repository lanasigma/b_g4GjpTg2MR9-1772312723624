"use client"

import { useEffect, useState } from "react"
import { FileText, ExternalLink, Loader2 } from "lucide-react"
import { fetchAnalyses, type AnalysisSummary } from "@/lib/api"
import { useApp } from "@/lib/app-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

function getScoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-primary"
  if (score > 0) return "text-warning-foreground"
  return "text-muted-foreground"
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-success/10 border-success/20"
  if (score >= 60) return "bg-primary/10 border-primary/20"
  if (score > 0) return "bg-warning/10 border-warning/20"
  return "bg-muted border-border"
}

export function ReportsPage() {
  const { setCurrentPage, setCurrentAnalysisId } = useApp()
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyses({ limit: 100 })
      .then((res) => setAnalyses(res.data.filter((a) => a.status === "Complete")))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Reports</h2>
          <p className="text-sm text-muted-foreground">
            All completed investment analyses with memos and scores.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No completed reports yet. Upload and analyse a startup to generate your first report.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {analyses.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-card-foreground">
                    {a.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.sector}
                    {a.stage ? ` · ${a.stage}` : ""}
                  </p>
                </div>
                {a.aiScore > 0 && (
                  <div
                    className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 ${getScoreBg(a.aiScore)}`}
                  >
                    <span className={`text-sm font-bold ${getScoreColor(a.aiScore)}`}>
                      {a.aiScore}
                    </span>
                    <span className={`text-[10px] ${getScoreColor(a.aiScore)}`}>/100</span>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-success/30 bg-success/10 text-success text-xs"
                >
                  Complete
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(a.createdAt), "MMM d, yyyy")}
                </span>
              </div>

              {/* CTA */}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 self-start"
                onClick={() => {
                  setCurrentAnalysisId(a.id)
                  setCurrentPage("analysis")
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full Report
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
