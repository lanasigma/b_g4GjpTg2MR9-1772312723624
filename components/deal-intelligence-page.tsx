"use client"

import { useEffect, useState } from "react"
import {
  BrainCircuit,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Building2,
  BarChart3,
  Globe,
  ShieldCheck,
  ArrowUpRight,
  X,
} from "lucide-react"
import {
  fetchAnalyses,
  fetchAnalysis,
  type AnalysisSummary,
  type AnalysisResult,
} from "@/lib/api"
import { useApp } from "@/lib/app-context"

type RiskLevel = "Low" | "Medium" | "High"
type Outcome = "Term Sheet" | "Under Review" | "Declined" | "Passed" | "Pending"

interface DealRow {
  id: string
  startup: string
  sector: string
  stage: string
  signal: number
  risk: RiskLevel
  outcome: Outcome
}

function deriveRisk(score: number): RiskLevel {
  if (score >= 80) return "Low"
  if (score >= 60) return "Medium"
  return "High"
}

function deriveOutcome(status: string, score: number): Outcome {
  if (status === "In Progress") return "Under Review"
  if (status === "Draft" || status === "Failed" || score === 0) return "Pending"
  if (score >= 85) return "Term Sheet"
  if (score >= 65) return "Passed"
  return "Declined"
}

function mapToDeals(analyses: AnalysisSummary[]): DealRow[] {
  return analyses.map((a) => ({
    id: a.id,
    startup: a.name,
    sector: a.sector,
    stage: a.stage,
    signal: a.aiScore,
    risk: deriveRisk(a.aiScore),
    outcome: deriveOutcome(a.status, a.aiScore),
  }))
}

function getRiskBadge(risk: RiskLevel) {
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
  const highSignalRate =
    highSignalTotal > 0 ? Math.round((highSignalTermSheet / highSignalTotal) * 100) : 0
  const highRiskProceeded = deals.filter(
    (d) => d.risk === "High" && (d.outcome === "Term Sheet" || d.outcome === "Passed")
  ).length

  return {
    pattern:
      highSignalTotal > 0
        ? `Deals with investment signals above 80 have a ${highSignalRate}% term sheet rate in your portfolio history.`
        : "Upload and complete more analyses to see pattern insights.",
    sector: topSector
      ? `${topSectorPct}% of reviewed deals are in ${topSector[0]}. ${
          topSectorPct > 40
            ? "Consider diversifying into underrepresented sectors."
            : "Sector distribution looks balanced."
        }`
      : "No sector data available yet.",
    risk:
      highRiskProceeded > 0
        ? `${highRiskProceeded} High Risk deal${highRiskProceeded > 1 ? "s" : ""} proceeded to term sheet or passed — review diligence depth on these.`
        : "No high-risk deals have proceeded to term sheet yet.",
  }
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-card-foreground">{value || "—"}</p>
    </div>
  )
}

function DealDetailPanel({
  data,
  onClose,
  onViewFull,
}: {
  data: AnalysisResult
  onClose: () => void
  onViewFull: () => void
}) {
  const { startup, marketAnalysis, teamEvaluation, traction, financialHealth, insights, competitors, riskSignals, investmentDecision, impactSustainability } = data

  return (
    <div className="flex flex-col gap-5">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-card-foreground">
            {startup?.name ?? "Deal Intelligence"}
          </h3>
          {startup && (
            <p className="text-sm text-muted-foreground">
              {startup.industry} · {startup.stage} · {startup.geography}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onViewFull}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Full Analysis <ArrowUpRight className="h-3 w-3" />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Investment signal bar */}
      {startup && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Investment Signal</span>
            <span className={`text-lg font-bold ${getSignalColor(startup.aiScore)}`}>
              {startup.aiScore}/100
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                startup.aiScore >= 80
                  ? "bg-success"
                  : startup.aiScore >= 60
                  ? "bg-primary"
                  : "bg-destructive"
              }`}
              style={{ width: `${startup.aiScore}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 border-t border-border pt-3">
            <Stat label="Confidence" value={`${startup.confidenceLevel}%`} />
            <Stat label="Product Maturity" value={startup.productMaturity} />
            <Stat label="Tech Defensibility" value={startup.techDefensibility} />
          </div>
        </div>
      )}

      {/* Company overview */}
      {startup && (
        <Section icon={Building2} title="Company Overview">
          <div className="flex flex-col gap-3">
            {startup.tagline && (
              <p className="text-sm italic text-muted-foreground">"{startup.tagline}"</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Problem" value={startup.problem} />
              <Stat label="Product" value={startup.product} />
              <Stat label="Target Customer" value={startup.targetCustomer} />
              <Stat label="Business Model" value={startup.businessModel} />
            </div>
          </div>
        </Section>
      )}

      {/* Market analysis */}
      {marketAnalysis && (
        <Section icon={Globe} title="Market Analysis">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">TAM</p>
                <p className="mt-1 text-sm font-semibold text-card-foreground">
                  {marketAnalysis.tam || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">SAM</p>
                <p className="mt-1 text-sm font-semibold text-card-foreground">
                  {marketAnalysis.sam || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">SOM</p>
                <p className="mt-1 text-sm font-semibold text-card-foreground">
                  {marketAnalysis.som || "—"}
                </p>
              </div>
            </div>
            <Stat label="Growth Rate" value={marketAnalysis.growthRate} />
            <Stat label="Why Now" value={marketAnalysis.whyNow} />
            {marketAnalysis.industryTrends.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Industry Trends</p>
                <ul className="flex flex-col gap-1.5">
                  {marketAnalysis.industryTrends.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-card-foreground">
                      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {marketAnalysis.customerSegments.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Customer Segments</p>
                <div className="flex flex-wrap gap-2">
                  {marketAnalysis.customerSegments.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Key insights */}
      {insights && (
        <Section icon={Target} title="Key Insights">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
              <span className="text-xs text-muted-foreground">Differentiation Score</span>
              <span className="text-sm font-bold text-primary">{insights.differentiationScore}/100</span>
            </div>
            <Stat label="Competitive Advantage" value={insights.competitiveAdvantage} />
            <Stat label="Market Gaps" value={insights.marketGaps} />
            <Stat label="Suggested Positioning" value={insights.suggestedPositioning} />
          </div>
        </Section>
      )}

      {/* Competitor intelligence */}
      {competitors.length > 0 && (
        <Section icon={BarChart3} title={`Competitor Intelligence (${competitors.length} analyzed)`}>
          <div className="flex flex-col gap-3">
            {competitors.map((c, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-card-foreground">{c.name}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {c.pricingTier}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <Stat label="Positioning" value={c.positioning} />
                  <Stat label="Target Customer" value={c.targetCustomer} />
                  <Stat label="Key Features" value={c.keyFeatures} />
                  <Stat label="Distribution" value={c.distribution} />
                  <Stat label="Moat Strength" value={c.moatStrength} />
                  <Stat label="Market Maturity" value={c.marketMaturity} />
                </div>
                {c.differentiation && (
                  <div className="mt-2 rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">vs. this startup:</p>
                    <p className="mt-0.5 text-xs text-card-foreground">{c.differentiation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Team evaluation */}
      {teamEvaluation && (
        <Section icon={Users} title="Team Evaluation">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
              <span className="text-xs text-muted-foreground">Team Score</span>
              <span className="text-sm font-bold text-primary">{teamEvaluation.teamScore}/100</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Domain Expertise" value={teamEvaluation.domainExpertise} />
              <Stat label="Team Completeness" value={teamEvaluation.teamCompleteness} />
              <Stat label="Founder-Market Fit" value={teamEvaluation.founderMarketFit} />
            </div>
            {teamEvaluation.founders.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Founders</p>
                <div className="flex flex-col gap-2">
                  {teamEvaluation.founders.map((f, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <div className="mb-1 flex items-baseline gap-2">
                        <p className="text-sm font-medium text-card-foreground">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.role}</p>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{f.background}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Traction metrics */}
      {traction && (
        <Section icon={TrendingUp} title="Traction">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
              <span className="text-xs text-muted-foreground">Traction Score</span>
              <span className="text-sm font-bold text-primary">{traction.tractionScore}/100</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="ARR" value={traction.arr} />
              <Stat label="User Growth" value={traction.userGrowth} />
              <Stat label="Retention" value={traction.retention} />
              <Stat label="Gross Margin" value={traction.grossMargin} />
              <Stat label="CAC" value={traction.cac} />
              <Stat label="LTV" value={traction.ltv} />
              <Stat label="LTV:CAC Ratio" value={traction.ltvCacRatio} />
            </div>
            {traction.keyMetrics.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Metric Availability</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {traction.keyMetrics.map((m, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                        m.present
                          ? "border-success/20 bg-success/5 text-success"
                          : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${m.present ? "bg-success" : "bg-muted-foreground"}`}
                      />
                      {m.label}
                      {m.present && m.value && (
                        <span className="ml-auto font-medium">{m.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Financial health */}
      {financialHealth && (
        <Section icon={DollarSign} title="Financial Health">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
              <span className="text-xs text-muted-foreground">Financial Score</span>
              <span className="text-sm font-bold text-primary">{financialHealth.financialScore}/100</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Burn Rate" value={financialHealth.burnRate} />
              <Stat label="Runway" value={financialHealth.runway} />
              <Stat label="Total Raised" value={financialHealth.totalRaised} />
              <Stat label="Funding Stage" value={financialHealth.fundingStage} />
              <Stat label="Future Capital Needs" value={financialHealth.futureCapitalNeeds} />
            </div>
            {financialHealth.notableInvestors.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Notable Investors</p>
                <div className="flex flex-wrap gap-2">
                  {financialHealth.notableInvestors.map((inv, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {inv}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Impact & sustainability */}
      {impactSustainability && (
        <Section icon={ShieldCheck} title="Impact & Sustainability">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
              <span className="text-xs text-muted-foreground">Impact Score</span>
              <span className="text-sm font-bold text-primary">{impactSustainability.impactScore}/100</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Social Impact" value={impactSustainability.socialImpact} />
              <Stat label="Economic Viability" value={impactSustainability.economicViability} />
              <Stat label="Environmental Contribution" value={impactSustainability.environmentalContribution} />
              <Stat label="Ethical Risks" value={impactSustainability.ethicalRisks} />
            </div>
          </div>
        </Section>
      )}

      {/* Risk signals summary */}
      {riskSignals && riskSignals.detectedRisks.length > 0 && (
        <Section icon={Target} title="Risk Summary">
          <div className="flex flex-col gap-2">
            {riskSignals.detectedRisks.map((r, i) => (
              <div key={i} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive">{r.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Investment decision */}
      {investmentDecision && (
        <Section icon={Target} title="Investment Decision">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-4 py-1.5 text-sm font-bold ${
                  investmentDecision.verdict === "STRONG_BUY"
                    ? "border-success/30 bg-success/10 text-success"
                    : investmentDecision.verdict === "BUY"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : investmentDecision.verdict === "HOLD"
                    ? "border-warning/30 bg-warning/10 text-warning-foreground"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {investmentDecision.verdict.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-card-foreground">
              {investmentDecision.verdictRationale}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Return Potential" value={investmentDecision.returnPotential} />
              <Stat label="Timing Readiness" value={investmentDecision.timingReadiness} />
              <Stat label="Strategic Fit" value={investmentDecision.strategicFit} />
            </div>
            {investmentDecision.exitOpportunities.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Exit Opportunities</p>
                <div className="flex flex-col gap-1.5">
                  {investmentDecision.exitOpportunities.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-card-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {e}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function DealIntelligencePage() {
  const { setCurrentPage, setCurrentAnalysisId } = useApp()
  const [deals, setDeals] = useState<DealRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedData, setSelectedData] = useState<AnalysisResult | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchAnalyses({ limit: 100 })
      .then((res) => setDeals(mapToDeals(res.data)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = async (id: string) => {
    if (selectedId === id) {
      setSelectedId(null)
      setSelectedData(null)
      return
    }
    setSelectedId(id)
    setDetailLoading(true)
    setSelectedData(null)
    try {
      const result = await fetchAnalysis(id)
      setSelectedData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const insights = buildInsights(deals)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BrainCircuit className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Deal Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Full intelligence report on every deal — market data, competitive landscape, team,
            traction, and financials. Click a deal to expand.
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: table */}
        <div className={`flex flex-col gap-4 ${selectedId ? "w-2/5 shrink-0" : "w-full"}`}>
          {/* Summary cards */}
          {!selectedId && (
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
          )}

          {/* Deals table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-card-foreground">All Deals</h3>
              <span className="text-xs text-muted-foreground">
                {loading ? "…" : `${deals.length} deals`}
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                    <th className="px-5 py-3">Startup</th>
                    {!selectedId && <th className="px-5 py-3">Sector</th>}
                    <th className="px-5 py-3 text-right">Signal</th>
                    <th className="px-5 py-3">Risk</th>
                    <th className="px-5 py-3">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => handleSelect(deal.id)}
                      className={`cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/50 ${
                        selectedId === deal.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-card-foreground">
                          {deal.startup}
                        </span>
                        {selectedId && (
                          <p className="text-xs text-muted-foreground">{deal.sector}</p>
                        )}
                      </td>
                      {!selectedId && (
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {deal.sector}
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-sm font-semibold ${getSignalColor(deal.signal)}`}>
                          {deal.signal > 0 ? deal.signal : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRiskBadge(deal.risk)}`}
                        >
                          {deal.risk}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getOutcomeBadge(deal.outcome)}`}
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

        {/* Right: detail panel */}
        {selectedId && (
          <div className="flex-1 overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm">Loading deal intelligence…</p>
                </div>
              </div>
            ) : selectedData ? (
              <DealDetailPanel
                data={selectedData}
                onClose={() => {
                  setSelectedId(null)
                  setSelectedData(null)
                }}
                onViewFull={() => {
                  setCurrentAnalysisId(selectedId)
                  setCurrentPage("analysis")
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
