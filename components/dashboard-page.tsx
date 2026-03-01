"use client"

import { useEffect, useState } from "react"
import {
  BarChart3,
  FileText,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  ShieldAlert,
} from "lucide-react"
import { fetchAnalyses, type AnalysisSummary, type DashboardStats } from "@/lib/api"
import { useApp } from "@/lib/app-context"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  trend: string
  trendUp: boolean
}) {
  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            trendUp ? "text-success" : "text-destructive"
          }`}
        >
          {trendUp ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "Complete":
      return "bg-success/10 text-success border-success/20"
    case "In Progress":
      return "bg-primary/10 text-primary border-primary/20"
    case "Draft":
      return "bg-muted text-muted-foreground border-border"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-primary"
  if (score > 0) return "text-warning-foreground"
  return "text-muted-foreground"
}

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return iso
  }
}

// Derive a simple activity feed from the analyses list
function deriveActivities(analyses: AnalysisSummary[]) {
  return analyses.slice(0, 5).map((a) => ({
    action:
      a.status === "Complete"
        ? "Analysis completed"
        : a.status === "In Progress"
        ? "AI analysis in progress"
        : "Startup uploaded",
    target: a.name,
    time: relativeTime(a.lastUpdated),
  }))
}

export function DashboardPage() {
  const { setCurrentPage, setCurrentAnalysisId } = useApp()
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyses({ limit: 6 })
      .then((res) => {
        setAnalyses(res.data)
        setStats(res.stats)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const activities = deriveActivities(analyses)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Investment intelligence overview and diligence workflow status.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard
          label="Startups Reviewed"
          value={loading ? "—" : (stats?.total ?? 0)}
          icon={BarChart3}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          label="Analyses Generated"
          value={loading ? "—" : (stats?.complete ?? 0)}
          icon={FileText}
          trend="+8%"
          trendUp={true}
        />
        <MetricCard
          label="Avg Time Saved"
          value={loading ? "—" : (stats?.avgTimeSaved ?? "—")}
          icon={Clock}
          trend="+23%"
          trendUp={true}
        />
        <MetricCard
          label="Active Deals"
          value={loading ? "—" : (stats?.active ?? 0)}
          icon={Briefcase}
          trend="-2%"
          trendUp={false}
        />
        <MetricCard
          label="Deals Flagged High Risk"
          value={loading ? "—" : (stats?.highRisk ?? 0)}
          icon={ShieldAlert}
          trend="+3"
          trendUp={false}
        />
      </div>

      {/* Table + Activity Feed */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Analyses Table */}
        <div className="col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-card-foreground">Recent Analyses</h3>
            <button
              onClick={() => setCurrentPage("deal-flow")}
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="overflow-hidden">
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
                    <th className="px-5 py-3">Stage</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Investment Signal</th>
                    <th className="px-5 py-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setCurrentAnalysisId(item.id)
                        setCurrentPage("analysis")
                      }}
                      className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-card-foreground">
                          {item.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {item.sector}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className="text-xs font-normal">
                          {item.stage}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`text-sm font-semibold ${getScoreColor(
                            item.aiScore
                          )}`}
                        >
                          {item.aiScore > 0 ? item.aiScore : "--"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-muted-foreground">
                        {relativeTime(item.lastUpdated)}
                      </td>
                    </tr>
                  ))}
                  {analyses.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-sm text-muted-foreground"
                      >
                        No analyses yet — upload your first startup to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-card-foreground">Activity</h3>
          </div>
          <div className="flex flex-col gap-0">
            {activities.map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-border px-5 py-3.5 last:border-0"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-card-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.target} &middot; {activity.time}
                  </p>
                </div>
              </div>
            ))}
            {!loading && activities.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
