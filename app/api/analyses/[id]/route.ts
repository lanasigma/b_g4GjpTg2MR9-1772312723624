import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// ─── GET /api/analyses/:id ────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const analysis = await prisma.analysis.findUnique({ where: { id } })

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
  }

  // If still processing, return partial info so the UI can handle loading state
  if (analysis.status !== "DONE") {
    return NextResponse.json({
      id: analysis.id,
      status: mapStatus(analysis.status),
      name: analysis.name,
      industry: analysis.industry,
      stage: analysis.stage,
      geography: analysis.geography,
      saved: analysis.saved,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.lastUpdated.toISOString(),
      startup: null,
      competitors: [],
      marketPosition: [],
      startupComparison: null,
      insights: null,
      riskSignals: null,
      marketAnalysis: null,
      teamEvaluation: null,
      traction: null,
      financialHealth: null,
      impactSustainability: null,
      investmentDecision: null,
      investmentMemo: "",
      suggestedPrompts: [],
    })
  }

  // Analysis is complete — map resultJson to the full response shape
  const result = analysis.resultJson as unknown as ResultJson

  return NextResponse.json({
    id: analysis.id,
    status: "Complete",
    saved: analysis.saved,
    createdAt: analysis.createdAt.toISOString(),
    updatedAt: analysis.lastUpdated.toISOString(),

    startup: {
      name: analysis.name,
      tagline: result?.companySummary?.tagline ?? "",
      industry: analysis.industry,
      stage: analysis.stage,
      geography: analysis.geography,
      problem: result?.companySummary?.problem ?? "",
      product: result?.companySummary?.product ?? "",
      targetCustomer: result?.companySummary?.targetCustomer ?? "",
      businessModel: result?.companySummary?.businessModel ?? "",
      productMaturity: result?.companySummary?.productMaturity ?? "",
      techDefensibility: result?.companySummary?.techDefensibility ?? "",
      aiScore: analysis.investmentSignal ?? 0,
      confidenceLevel: analysis.confidence ?? 0,
    },

    startupComparison: result?.marketIntelligence?.startupComparison ?? null,
    competitors: result?.marketIntelligence?.competitors ?? [],
    marketPosition: result?.marketIntelligence?.marketPosition ?? [],
    insights: result?.insights ?? null,
    riskSignals: result?.riskSignals ?? null,
    marketAnalysis: result?.marketAnalysis ?? null,
    teamEvaluation: result?.teamEvaluation ?? null,
    traction: result?.traction ?? null,
    financialHealth: result?.financialHealth ?? null,
    impactSustainability: result?.impactSustainability ?? null,
    investmentDecision: result?.investmentDecision ?? null,
    investmentMemo: result?.investmentMemo ?? "",
    suggestedPrompts: result?.suggestedPrompts ?? [],
  })
}

// ─── PATCH /api/analyses/:id ─────────────────────────────────────────────────
// Used for save/unsave toggle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  if (typeof body.saved !== "boolean") {
    return NextResponse.json({ error: "saved (boolean) is required" }, { status: 400 })
  }

  const analysis = await prisma.analysis.update({
    where: { id },
    data: { saved: body.saved },
    select: { id: true, saved: true },
  })

  return NextResponse.json(analysis)
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultJson {
  companySummary: {
    tagline: string
    problem: string
    product: string
    targetCustomer: string
    businessModel: string
    productMaturity: string
    techDefensibility: string
  }
  marketAnalysis: {
    tam: string
    sam: string
    som: string
    growthRate: string
    whyNow: string
    industryTrends: string[]
    customerSegments: string[]
  }
  teamEvaluation: {
    founders: { name: string; role: string; background: string }[]
    domainExpertise: string
    teamCompleteness: string
    founderMarketFit: string
    teamScore: number
  }
  traction: {
    arr: string
    userGrowth: string
    retention: string
    cac: string
    ltv: string
    ltvCacRatio: string
    grossMargin: string
    keyMetrics: { label: string; value: string; present: boolean }[]
    tractionScore: number
  }
  financialHealth: {
    burnRate: string
    runway: string
    totalRaised: string
    fundingStage: string
    notableInvestors: string[]
    futureCapitalNeeds: string
    financialScore: number
  }
  impactSustainability: {
    socialImpact: string
    ethicalRisks: string
    environmentalContribution: string
    economicViability: string
    impactScore: number
  }
  investmentDecision: {
    returnPotential: string
    exitOpportunities: string[]
    strategicFit: string
    timingReadiness: string
    verdict: "STRONG_BUY" | "BUY" | "HOLD" | "PASS"
    verdictRationale: string
  }
  marketIntelligence: {
    competitors: Competitor[]
    marketPosition: MarketPositionPoint[]
    startupComparison: StartupComparison
  }
  insights: {
    competitiveAdvantage: string
    marketGaps: string
    differentiationScore: number
    suggestedPositioning: string
  }
  riskSignals: {
    riskLevel: "Low" | "Medium" | "High"
    detectedRisks: { title: string; detail: string }[]
    missingMetrics: { label: string; present: boolean }[]
    diligenceQuestions: string[]
  }
  investmentMemo: string
  investmentSignal: number
  confidence: number
  suggestedPrompts: string[]
}

interface Competitor {
  name: string
  positioning: string
  pricingTier: string
  differentiation: string
  targetCustomer: string
  pricingModel: string
  keyFeatures: string
  distribution: string
  marketMaturity: string
  moatStrength: string
}

interface MarketPositionPoint {
  name: string
  x: number
  y: number
  z: number
  isSubject?: boolean
}

interface StartupComparison {
  targetCustomer: string
  pricingModel: string
  keyFeatures: string
  distribution: string
  marketMaturity: string
  moatStrength: string
}

function mapStatus(status: string): string {
  switch (status) {
    case "DONE":
      return "Complete"
    case "PROCESSING":
    case "PENDING":
      return "In Progress"
    case "FAILED":
      return "Failed"
    default:
      return "Draft"
  }
}
