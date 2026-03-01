/**
 * Typed client-side API wrappers.
 *
 * All fetch calls go to Next.js API routes (/api/*) by default.
 * Set NEXT_PUBLIC_API_URL to route to an external backend.
 */

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "")

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ─── Shared types (mirrors backend response shapes) ───────────────────────────

export interface AnalysisSummary {
  id: string
  name: string
  sector: string
  stage: string
  status: string
  aiScore: number
  saved: boolean
  lastUpdated: string
  createdAt: string
}

export interface DashboardStats {
  total: number
  active: number
  complete: number
  highRisk: number
  avgTimeSaved: string
}

export interface AnalysesListResponse {
  data: AnalysisSummary[]
  stats: DashboardStats
  totalCount: number
  page: number
  limit: number
}

export interface MarketPositionPoint {
  name: string
  x: number
  y: number
  z: number
  isSubject?: boolean
}

export interface Competitor {
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

export interface StartupComparison {
  targetCustomer: string
  pricingModel: string
  keyFeatures: string
  distribution: string
  marketMaturity: string
  moatStrength: string
}

export interface Insights {
  competitiveAdvantage: string
  marketGaps: string
  differentiationScore: number
  suggestedPositioning: string
}

export interface RiskSignals {
  riskLevel: "Low" | "Medium" | "High"
  detectedRisks: { title: string; detail: string }[]
  missingMetrics: { label: string; present: boolean }[]
  diligenceQuestions: string[]
}

export interface StartupProfile {
  name: string
  tagline: string
  industry: string
  stage: string
  geography: string
  problem: string
  product: string
  targetCustomer: string
  businessModel: string
  productMaturity: string
  techDefensibility: string
  aiScore: number
  confidenceLevel: number
}

export interface MarketAnalysis {
  tam: string
  sam: string
  som: string
  growthRate: string
  whyNow: string
  industryTrends: string[]
  customerSegments: string[]
}

export interface TeamEvaluation {
  founders: { name: string; role: string; background: string }[]
  domainExpertise: string
  teamCompleteness: string
  founderMarketFit: string
  teamScore: number
}

export interface Traction {
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

export interface FinancialHealth {
  burnRate: string
  runway: string
  totalRaised: string
  fundingStage: string
  notableInvestors: string[]
  futureCapitalNeeds: string
  financialScore: number
}

export interface ImpactSustainability {
  socialImpact: string
  ethicalRisks: string
  environmentalContribution: string
  economicViability: string
  impactScore: number
}

export interface InvestmentDecision {
  returnPotential: string
  exitOpportunities: string[]
  strategicFit: string
  timingReadiness: string
  verdict: "STRONG_BUY" | "BUY" | "HOLD" | "PASS"
  verdictRationale: string
}

export interface AnalysisResult {
  id: string
  status: string
  saved: boolean
  createdAt: string
  updatedAt: string
  startup: StartupProfile | null
  startupComparison: StartupComparison | null
  competitors: Competitor[]
  marketPosition: MarketPositionPoint[]
  insights: Insights | null
  riskSignals: RiskSignals | null
  marketAnalysis: MarketAnalysis | null
  teamEvaluation: TeamEvaluation | null
  traction: Traction | null
  financialHealth: FinancialHealth | null
  impactSustainability: ImpactSustainability | null
  investmentDecision: InvestmentDecision | null
  investmentMemo: string
  suggestedPrompts: string[]
}

export interface AnalysisJob {
  jobId: string
  analysisId: string
  status: "pending" | "processing" | "complete" | "failed"
  currentStep: string | null
  stepIndex: number
  totalSteps: number
  progress: number
  error?: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// ─── Analyses ─────────────────────────────────────────────────────────────────

export function fetchAnalyses(params?: {
  page?: number
  limit?: number
  saved?: boolean
}): Promise<AnalysesListResponse> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set("page", String(params.page))
  if (params?.limit) qs.set("limit", String(params.limit))
  if (params?.saved) qs.set("saved", "true")
  return apiFetch(`/api/analyses${qs.size ? `?${qs}` : ""}`)
}

export function fetchAnalysis(id: string): Promise<AnalysisResult> {
  return apiFetch(`/api/analyses/${id}`)
}

export function fetchAnalysisJob(jobId: string): Promise<AnalysisJob> {
  return apiFetch(`/api/analyses/jobs/${jobId}`)
}

export function submitAnalysis(body: {
  kind: "pdf" | "url" | "manual"
  name: string
  industry?: string
  stage?: string
  geography?: string
  pdfUrl?: string
  url?: string
  problem?: string
  product?: string
  targetCustomer?: string
  businessModel?: string
}): Promise<{ jobId: string; analysisId: string }> {
  return apiFetch("/api/analyses", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function toggleSaved(
  id: string,
  saved: boolean
): Promise<{ id: string; saved: boolean }> {
  return apiFetch(`/api/analyses/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ saved }),
  })
}

// ─── Chat (non-streaming fallback) ───────────────────────────────────────────

export function sendChatMessage(body: {
  analysisId: string | null
  messages: ChatMessage[]
}): Promise<{ message: ChatMessage }> {
  return apiFetch("/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

/**
 * Stream a chat response via SSE and call `onDelta` for each text chunk.
 * Returns the full assistant response string.
 *
 * Usage:
 *   const full = await streamChat({ analysisId, messages }, (delta) => {
 *     setLastMessage(prev => prev + delta)
 *   })
 */
export async function streamChat(
  body: { analysisId: string | null; messages: ChatMessage[] },
  onDelta: (delta: string) => void
): Promise<string> {
  const res = await fetch(`${BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const raw = decoder.decode(value, { stream: true })
    // Each SSE event is "data: {...}\n\n"
    for (const line of raw.split("\n")) {
      if (!line.startsWith("data: ")) continue
      try {
        const parsed = JSON.parse(line.slice(6)) as {
          delta?: string
          done?: boolean
          error?: string
        }
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.delta) {
          fullText += parsed.delta
          onDelta(parsed.delta)
        }
        if (parsed.done) return fullText
      } catch {
        // Skip malformed lines
      }
    }
  }

  return fullText
}
