"use client"

import { useEffect, useState } from "react"
import { Bookmark, Loader2 } from "lucide-react"
import { fetchAnalyses, toggleSaved, type AnalysisSummary } from "@/lib/api"
import { useApp } from "@/lib/app-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export function SavedPage() {
  const { setCurrentPage, setCurrentAnalysisId } = useApp()
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyses({ saved: true, limit: 100 })
      .then((res) => setAnalyses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleUnsave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleSaved(id, false)
    setAnalyses((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Bookmark className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Saved Analyses</h2>
          <p className="text-sm text-muted-foreground">
            Your bookmarked startup analyses for quick access.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-card-foreground">Saved</h3>
          <span className="text-xs text-muted-foreground">
            {loading ? "…" : `${analyses.length} saved`}
          </span>
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
                <th className="px-5 py-3 text-right">Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
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
                  <td className="px-5 py-3.5">
                    <Badge variant="outline" className="text-xs font-normal">
                      {a.stage || "Unknown"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-sm font-semibold ${getScoreColor(a.aiScore)}`}>
                      {a.aiScore > 0 ? a.aiScore : "--"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">
                    {relativeTime(a.lastUpdated)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleUnsave(a.id, e)}
                    >
                      <Bookmark className="h-3 w-3 fill-current" />
                      Unsave
                    </Button>
                  </td>
                </tr>
              ))}

              {analyses.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No saved analyses yet — click Save on any analysis to bookmark it here.
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
