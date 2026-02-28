"use client"

import { useState } from "react"
import {
  Download,
  Share2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  Lightbulb,
  Building2,
  FileText,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  demoStartup,
  demoCompetitors,
  demoInsights,
  demoRiskSignals,
} from "@/lib/demo-data"
import { MarketPositionChart } from "@/components/market-chart"

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-success/15 text-success border-success/30"
      : score >= 60
      ? "bg-primary/15 text-primary border-primary/30"
      : "bg-warning/15 text-warning-foreground border-warning/30"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-lg font-bold ${color}`}
    >
      <Sparkles className="h-4 w-4" />
      {score}
    </span>
  )
}

function InsightCard({
  title,
  content,
  icon: Icon,
  score,
}: {
  title: string
  content: string
  icon: React.ElementType
  score?: number
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
            {score !== undefined && (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-border">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-primary">{score}/100</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{content}</p>
      )}
    </div>
  )
}

function RiskLevelBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const colorMap = {
    Low: "bg-success/15 text-success border-success/30",
    Medium: "bg-warning/15 text-warning-foreground border-warning/30",
    High: "bg-destructive/15 text-destructive border-destructive/30",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorMap[level]}`}>
      <ShieldAlert className="h-3 w-3" />
      {level} Risk
    </span>
  )
}

function RiskItem({ title, detail }: { title: string; detail: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-background p-3 transition-shadow hover:shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning-foreground" />
          <span className="text-sm font-medium text-card-foreground">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      )}
    </div>
  )
}

const comparisonRows = [
  "targetCustomer",
  "pricingModel",
  "keyFeatures",
  "distribution",
  "marketMaturity",
  "moatStrength",
] as const

const comparisonLabels: Record<string, string> = {
  targetCustomer: "Target Customer",
  pricingModel: "Pricing Model",
  keyFeatures: "Key Features",
  distribution: "Distribution",
  marketMaturity: "Market Maturity",
  moatStrength: "Moat Strength",
}

const startupComparison = {
  targetCustomer: demoStartup.targetCustomer,
  pricingModel: "SaaS subscription + usage-based",
  keyFeatures: "AI workflow learning, auto-optimization, no-code",
  distribution: "Product-led + enterprise sales",
  marketMaturity: "Early",
  moatStrength: "Moderate-High",
}

export function AnalysisPage() {
  const [askQuery, setAskQuery] = useState("")
  const [askResponse, setAskResponse] = useState("")

  const handleAsk = () => {
    if (!askQuery.trim()) return
    setAskResponse(
      "Based on my analysis, FlowAI's primary competitive advantage lies in its AI-native behavioral learning approach. Unlike Zapier's trigger-based model, FlowAI proactively suggests workflows, which significantly reduces time-to-value. The main risk is the enterprise sales cycle at Series A funding levels."
    )
    setAskQuery("")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {demoStartup.name}
            </h2>
            <ScoreBadge score={demoStartup.aiScore} />
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Confidence Level: 82%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{demoStartup.industry}</Badge>
            <Badge variant="outline">{demoStartup.stage}</Badge>
            <span className="text-xs text-muted-foreground">{demoStartup.geography}</span>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">{demoStartup.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button size="sm" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Generate Investment Memo
          </Button>
        </div>
      </div>

      {/* Company Summary */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Problem Statement", value: demoStartup.problem },
          { label: "Product Description", value: demoStartup.product },
          { label: "Target Customer", value: demoStartup.targetCustomer },
          { label: "Business Model", value: demoStartup.businessModel },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {item.label}
            </h4>
            <p className="text-sm leading-relaxed text-card-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Market Intelligence Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Market Intelligence
        </h3>
        <p className="text-sm text-muted-foreground">
          Competitive positioning and market context used for investment evaluation.
        </p>
      </div>

      {/* Competitor Grid */}
      <div className="grid grid-cols-4 gap-4">
        {demoCompetitors.map((comp) => (
          <div
            key={comp.name}
            className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-semibold text-card-foreground">{comp.name}</h4>
            <p className="mb-2 text-xs text-muted-foreground">{comp.positioning}</p>
            <Badge variant="outline" className="text-[10px]">
              {comp.pricingTier}
            </Badge>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {comp.differentiation}
            </p>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-card-foreground">
            Feature Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3 w-40">Dimension</th>
                <th className="px-5 py-3 bg-primary/5 font-semibold text-primary">
                  {demoStartup.name}
                </th>
                {demoCompetitors.map((c) => (
                  <th key={c.name} className="px-5 py-3">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr
                  key={row}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-5 py-3 text-xs font-medium text-card-foreground">
                    {comparisonLabels[row]}
                  </td>
                  <td className="px-5 py-3 bg-primary/5 text-xs text-card-foreground font-medium">
                    {startupComparison[row]}
                  </td>
                  {demoCompetitors.map((c) => (
                    <td
                      key={c.name}
                      className="px-5 py-3 text-xs text-muted-foreground"
                    >
                      {c[row]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Position Chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          Market Position Map
        </h3>
        <MarketPositionChart />
      </div>

      {/* AI Insights */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Investment Insights</h3>
        <p className="text-sm text-muted-foreground">
          AI-generated decision support and strategic recommendations.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InsightCard
          title="Competitive Advantage"
          content={demoInsights.competitiveAdvantage}
          icon={Shield}
        />
        <InsightCard
          title="Market Gaps Identified"
          content={demoInsights.marketGaps}
          icon={Target}
        />
        <InsightCard
          title="Differentiation Score"
          content={demoInsights.suggestedPositioning}
          icon={TrendingUp}
          score={demoInsights.differentiationScore}
        />
        <InsightCard
          title="Suggested Positioning"
          content={demoInsights.suggestedPositioning}
          icon={Lightbulb}
        />
      </div>

      {/* Risk & Diligence Scanner */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Risk & Diligence Signals</h3>
        <p className="text-sm text-muted-foreground">
          Automated risk detection and diligence gap analysis.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Risk Level + Detected Risks */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-card-foreground">Detected Risks</h4>
            <RiskLevelBadge level={demoRiskSignals.riskLevel} />
          </div>
          <div className="flex flex-col gap-2">
            {demoRiskSignals.detectedRisks.map((risk) => (
              <RiskItem key={risk.title} title={risk.title} detail={risk.detail} />
            ))}
          </div>
        </div>

        {/* Missing Metrics + Diligence Questions */}
        <div className="flex flex-col gap-4">
          {/* Missing Investor Metrics */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="mb-3 text-sm font-semibold text-card-foreground">Missing Investor Metrics</h4>
            <div className="flex flex-col gap-2">
              {demoRiskSignals.missingMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center gap-2.5">
                  {metric.present ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <span className={`text-sm ${metric.present ? "text-card-foreground" : "text-muted-foreground"}`}>
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Diligence Questions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-card-foreground">Suggested Diligence Questions</h4>
            </div>
            <ol className="flex flex-col gap-2">
              {demoRiskSignals.diligenceQuestions.map((question, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{question}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Ask AI */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-card-foreground">
          Ask AI about {demoStartup.name}
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about this startup..."
            value={askQuery}
            onChange={(e) => setAskQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <Button onClick={handleAsk} size="sm" className="gap-1.5 shrink-0">
            <Send className="h-3.5 w-3.5" />
            Ask
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "What are the key investment risks?",
            "Is the competitive moat defensible?",
            "What diligence gaps remain?",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setAskQuery(prompt)
              }}
              className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
        {askResponse && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Response</span>
            </div>
            <p className="text-sm leading-relaxed text-card-foreground">{askResponse}</p>
          </div>
        )}
      </div>
    </div>
  )
}
