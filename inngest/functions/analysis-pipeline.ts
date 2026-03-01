import { GoogleGenerativeAI } from "@google/generative-ai"
import { inngest } from "@/inngest/client"
import prisma from "@/lib/prisma"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ─── Step label constants (must match UI's analysisSteps array) ───────────────
const STEPS = {
  PARSE: "Parsing pitch materials",
  STRUCTURE: "Structuring company intelligence",
  MARKET: "Mapping market landscape",
  RISKS: "Detecting risks & gaps",
  MEMO: "Generating investment memo",
} as const

// ─── Inngest function ─────────────────────────────────────────────────────────
export const analysisPipeline = inngest.createFunction(
  {
    id: "analysis-pipeline",
    retries: 2,
    onFailure: async ({ event, error }: { event: { data: { analysisId: string; jobId: string } }; error: Error }) => {
      const { analysisId, jobId } = event.data
      await Promise.all([
        prisma.job.update({
          where: { id: jobId },
          data: { status: "FAILED", error: error.message, step: null },
        }),
        prisma.analysis.update({
          where: { id: analysisId },
          data: { status: "FAILED" },
        }),
      ])
    },
  },
  { event: "analyst-copilot/analysis.started" },
  async ({ event, step }) => {
    const { analysisId, jobId } = event.data as {
      analysisId: string
      jobId: string
    }

    // ── Mark job as running ──────────────────────────────────────────────────
    await step.run("init", async () => {
      await Promise.all([
        prisma.job.update({
          where: { id: jobId },
          data: { status: "PROCESSING", step: STEPS.PARSE, progress: 5 },
        }),
        prisma.analysis.update({
          where: { id: analysisId },
          data: { status: "PROCESSING" },
        }),
      ])
    })

    // ── Step 1: Parse pitch materials ────────────────────────────────────────
    const sourceText = await step.run("parse-pitch-materials", async () => {
      await prisma.job.update({
        where: { id: jobId },
        data: { step: STEPS.PARSE, progress: 10 },
      })

      const source = await prisma.source.findFirst({ where: { analysisId } })
      if (!source) throw new Error("No source found for analysis")

      let text = ""

      if (source.kind === "pdf" && source.url) {
        // Download and extract text — pdf-parse runs server-side only
        const pdfParse = (await import("pdf-parse")).default
        const res = await fetch(source.url)
        if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.statusText}`)
        const buffer = Buffer.from(await res.arrayBuffer())
        const parsed = await pdfParse(buffer)
        text = parsed.text.trim()
      } else if (source.kind === "website" && source.url) {
        // Basic HTML fetch + strip tags for website sources
        const res = await fetch(source.url, {
          headers: { "User-Agent": "AnalystCopilot/1.0 (startup analysis bot)" },
        })
        if (!res.ok) throw new Error(`Failed to fetch URL: ${res.statusText}`)
        const html = await res.text()
        // Strip HTML tags and compress whitespace
        text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 60_000)
      } else {
        // Manual entry — text already stored in source.text
        text = source.text ?? ""
      }

      // Persist extracted text
      await prisma.source.update({
        where: { id: source.id },
        data: { text: text.slice(0, 100_000) }, // cap at 100k chars
      })

      await prisma.job.update({ where: { id: jobId }, data: { progress: 22 } })
      return text
    })

    // ── Step 2: Structure company intelligence ───────────────────────────────
    await step.run("structure-company-intelligence", async () => {
      await prisma.job.update({
        where: { id: jobId },
        data: { step: STEPS.STRUCTURE, progress: 35 },
      })
      // Progress marker — actual structuring is done in the LLM call (step 5)
      await prisma.job.update({ where: { id: jobId }, data: { progress: 45 } })
    })

    // ── Step 3: Map market landscape ─────────────────────────────────────────
    await step.run("map-market-landscape", async () => {
      await prisma.job.update({
        where: { id: jobId },
        data: { step: STEPS.MARKET, progress: 55 },
      })
      await prisma.job.update({ where: { id: jobId }, data: { progress: 62 } })
    })

    // ── Step 4: Detect risks & gaps ──────────────────────────────────────────
    await step.run("detect-risks-gaps", async () => {
      await prisma.job.update({
        where: { id: jobId },
        data: { step: STEPS.RISKS, progress: 70 },
      })
      await prisma.job.update({ where: { id: jobId }, data: { progress: 77 } })
    })

    // ── Step 5: Generate investment memo (LLM) ───────────────────────────────
    const analysisResult = await step.run("generate-investment-memo", async () => {
      await prisma.job.update({
        where: { id: jobId },
        data: { step: STEPS.MEMO, progress: 82 },
      })

      const analysis = await prisma.analysis.findUniqueOrThrow({
        where: { id: analysisId },
        select: { name: true, industry: true, stage: true, geography: true },
      })

      const result = await runLLMAnalysis({
        name: analysis.name,
        industry: analysis.industry,
        stage: analysis.stage,
        geography: analysis.geography,
        sourceText,
      })

      await prisma.job.update({ where: { id: jobId }, data: { progress: 97 } })
      return result
    })

    // ── Persist results ──────────────────────────────────────────────────────
    await step.run("save-results", async () => {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: "DONE",
          resultJson: analysisResult as object,
          investmentSignal: analysisResult.investmentSignal,
          confidence: analysisResult.confidence,
        },
      })
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "DONE", step: null, progress: 100 },
      })
    })

    return { analysisId, success: true }
  }
)

// ─── LLM analysis ─────────────────────────────────────────────────────────────

interface AnalysisInput {
  name: string
  industry: string
  stage: string
  geography: string
  sourceText: string
}

async function runLLMAnalysis(input: AnalysisInput): Promise<AnalysisResultJson> {
  const prompt = buildAnalysisPrompt(input)

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    systemInstruction: `You are a senior venture capital analyst. You produce structured investment analysis in strict JSON format.
Return ONLY a single valid JSON object — no markdown fences, no prose, no trailing commas.`,
  })

  const result = await model.generateContent(prompt)
  const raw = result.response.text()

  // Extract the first JSON object from the response
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("LLM did not return valid JSON")

  let parsed: AnalysisResultJson
  try {
    parsed = JSON.parse(jsonMatch[0]) as AnalysisResultJson
  } catch (err) {
    throw new Error(`Failed to parse LLM JSON: ${(err as Error).message}`)
  }

  // Apply defaults for any missing fields to prevent UI crashes
  return applyDefaults(parsed, input)
}

function buildAnalysisPrompt(input: AnalysisInput): string {
  const truncated = input.sourceText.slice(0, 50_000)

  return `Analyse the following startup and return a single JSON object with this EXACT structure.

Startup:
  Name: ${input.name}
  Industry: ${input.industry}
  Funding Stage: ${input.stage}
  Geography: ${input.geography}

Source Material:
${truncated || "(No source material provided — infer from name, industry, stage, and geography)"}

Required JSON structure (fill every field — do NOT omit any):
{
  "companySummary": {
    "tagline": "one-line value proposition",
    "problem": "problem the startup solves",
    "product": "product/solution description",
    "targetCustomer": "ideal customer profile",
    "businessModel": "how they make money",
    "productMaturity": "Concept|MVP|Beta|Live|Scaling",
    "techDefensibility": "IP, data moat, network effect, or technical barrier description"
  },
  "marketAnalysis": {
    "tam": "Total Addressable Market with size estimate (e.g. $12B globally)",
    "sam": "Serviceable Addressable Market (e.g. $3B in North America)",
    "som": "Serviceable Obtainable Market in 3-5 years (e.g. $200M)",
    "growthRate": "Annual market growth rate (e.g. 22% CAGR)",
    "whyNow": "2-3 sentences explaining why this market opportunity is timely right now",
    "industryTrends": ["Trend 1", "Trend 2", "Trend 3"],
    "customerSegments": ["Primary customer segment", "Secondary customer segment"]
  },
  "teamEvaluation": {
    "founders": [
      { "name": "Founder Name or Unknown", "role": "CEO", "background": "prior relevant experience summary" }
    ],
    "domainExpertise": "assessment of team depth in the problem domain",
    "teamCompleteness": "which key roles are present vs missing (technical, sales, ops, domain)",
    "founderMarketFit": "how well-suited founders are for this specific market opportunity",
    "teamScore": 70
  },
  "traction": {
    "arr": "Annual Recurring Revenue or 'Not disclosed'",
    "userGrowth": "user/customer growth metric or 'Not disclosed'",
    "retention": "retention or churn rate or 'Not disclosed'",
    "cac": "Customer Acquisition Cost or 'Not disclosed'",
    "ltv": "Customer Lifetime Value or 'Not disclosed'",
    "ltvCacRatio": "LTV/CAC ratio or 'Not disclosed'",
    "grossMargin": "gross margin % or 'Not disclosed'",
    "keyMetrics": [
      { "label": "ARR", "value": "Not disclosed", "present": false },
      { "label": "MoM Growth", "value": "Not disclosed", "present": false },
      { "label": "Retention Rate", "value": "Not disclosed", "present": false },
      { "label": "CAC", "value": "Not disclosed", "present": false },
      { "label": "LTV", "value": "Not disclosed", "present": false },
      { "label": "Gross Margin", "value": "Not disclosed", "present": false },
      { "label": "Churn Rate", "value": "Not disclosed", "present": false }
    ],
    "tractionScore": 50
  },
  "financialHealth": {
    "burnRate": "monthly burn rate or 'Not disclosed'",
    "runway": "runway in months or 'Not disclosed'",
    "totalRaised": "total capital raised to date or 'Not disclosed'",
    "fundingStage": "${input.stage}",
    "notableInvestors": ["Investor name or empty array if none mentioned"],
    "futureCapitalNeeds": "estimated additional capital needed for next milestone",
    "financialScore": 60
  },
  "impactSustainability": {
    "socialImpact": "positive societal or community impact description",
    "ethicalRisks": "potential ethical concerns (data privacy, bias, job displacement, etc.)",
    "environmentalContribution": "environmental sustainability impact or footprint",
    "economicViability": "long-term economic sustainability and business durability assessment",
    "impactScore": 65
  },
  "investmentDecision": {
    "returnPotential": "expected return multiple and timeline (e.g. 10-20x in 5-7 years)",
    "exitOpportunities": ["Exit path 1 (e.g. IPO in 5-7 years)", "Exit path 2 (e.g. Strategic acquisition by...)"],
    "strategicFit": "how this fits a diversified VC portfolio and why it is attractive",
    "timingReadiness": "assessment of whether now is the right time to invest in this company",
    "verdict": "STRONG_BUY",
    "verdictRationale": "2 clear sentences justifying the investment verdict"
  },
  "marketIntelligence": {
    "competitors": [
      {
        "name": "CompetitorName",
        "positioning": "their market position",
        "pricingTier": "Freemium|Mid-market|Enterprise|Free",
        "differentiation": "what makes them different",
        "targetCustomer": "who they target",
        "pricingModel": "how they charge",
        "keyFeatures": "top 2-3 features",
        "distribution": "how they reach customers",
        "marketMaturity": "Early|Growing|Mature",
        "moatStrength": "Weak|Moderate|Strong"
      }
    ],
    "marketPosition": [
      {
        "name": "${input.name}",
        "x": 50,
        "y": 50,
        "z": 400,
        "isSubject": true
      }
    ],
    "startupComparison": {
      "targetCustomer": "startup's target customer",
      "pricingModel": "startup's pricing model",
      "keyFeatures": "startup's key features",
      "distribution": "startup's distribution",
      "marketMaturity": "startup's market maturity",
      "moatStrength": "startup's moat strength"
    }
  },
  "insights": {
    "competitiveAdvantage": "main competitive advantage",
    "marketGaps": "underserved segments or needs the startup can capture",
    "differentiationScore": 75,
    "suggestedPositioning": "recommended positioning statement"
  },
  "riskSignals": {
    "riskLevel": "Low|Medium|High",
    "detectedRisks": [
      { "title": "Risk title", "detail": "Detailed explanation of the risk and its potential impact" }
    ],
    "missingMetrics": [
      { "label": "Metric name", "present": false }
    ],
    "diligenceQuestions": [
      "Question 1?",
      "Question 2?"
    ]
  },
  "investmentMemo": "4-5 paragraph investment memo covering: executive thesis, market opportunity, team assessment, traction & financials, key risks, and final recommendation",
  "investmentSignal": 75,
  "confidence": 80,
  "suggestedPrompts": [
    "What are the biggest risks?",
    "Is this investment defensible?",
    "Compare to market leaders",
    "What diligence questions should we ask?"
  ]
}

Rules:
- marketPosition x/y axes: 0-100 (x = market sophistication, y = innovation level)
- marketPosition z: relative bubble size (200-500)
- Include 3-5 competitors in marketIntelligence.competitors
- Include all competitors plus ${input.name} in marketPosition array
- investmentSignal and confidence: integers 0-100
- All score fields (differentiationScore, teamScore, tractionScore, financialScore, impactScore): integers 0-100
- keyMetrics: mark present=true only if actual data values are found in source material; set value to the actual data if present
- verdict must be exactly one of: STRONG_BUY, BUY, HOLD, PASS
- notableInvestors: empty array [] if no investors mentioned in source
- missingMetrics: list 4-8 key investor metrics with present=true/false based on source material
- Include 4-6 diligenceQuestions
- If source material lacks specific data, use reasonable inference based on industry/stage, or state "Not disclosed"
- Return ONLY the JSON object, nothing else`
}

function applyDefaults(r: Partial<AnalysisResultJson>, input: AnalysisInput): AnalysisResultJson {
  return {
    companySummary: r.companySummary ?? {
      tagline: `${input.name} — ${input.industry}`,
      problem: "Information not available",
      product: "Information not available",
      targetCustomer: "Information not available",
      businessModel: "Information not available",
      productMaturity: "Unknown",
      techDefensibility: "Information not available",
    },
    marketAnalysis: r.marketAnalysis ?? {
      tam: "Not available",
      sam: "Not available",
      som: "Not available",
      growthRate: "Not available",
      whyNow: "Analysis pending",
      industryTrends: [],
      customerSegments: [],
    },
    teamEvaluation: r.teamEvaluation ?? {
      founders: [],
      domainExpertise: "Analysis pending",
      teamCompleteness: "Analysis pending",
      founderMarketFit: "Analysis pending",
      teamScore: 50,
    },
    traction: r.traction ?? {
      arr: "Not disclosed",
      userGrowth: "Not disclosed",
      retention: "Not disclosed",
      cac: "Not disclosed",
      ltv: "Not disclosed",
      ltvCacRatio: "Not disclosed",
      grossMargin: "Not disclosed",
      keyMetrics: [],
      tractionScore: 50,
    },
    financialHealth: r.financialHealth ?? {
      burnRate: "Not disclosed",
      runway: "Not disclosed",
      totalRaised: "Not disclosed",
      fundingStage: input.stage,
      notableInvestors: [],
      futureCapitalNeeds: "Not disclosed",
      financialScore: 50,
    },
    impactSustainability: r.impactSustainability ?? {
      socialImpact: "Analysis pending",
      ethicalRisks: "Analysis pending",
      environmentalContribution: "Analysis pending",
      economicViability: "Analysis pending",
      impactScore: 50,
    },
    investmentDecision: r.investmentDecision ?? {
      returnPotential: "Not determined",
      exitOpportunities: [],
      strategicFit: "Analysis pending",
      timingReadiness: "Analysis pending",
      verdict: "HOLD",
      verdictRationale: "Insufficient data available for a confident investment verdict.",
    },
    marketIntelligence: r.marketIntelligence ?? {
      competitors: [],
      marketPosition: [{ name: input.name, x: 50, y: 50, z: 400, isSubject: true }],
      startupComparison: {
        targetCustomer: "Unknown",
        pricingModel: "Unknown",
        keyFeatures: "Unknown",
        distribution: "Unknown",
        marketMaturity: "Unknown",
        moatStrength: "Unknown",
      },
    },
    insights: r.insights ?? {
      competitiveAdvantage: "Analysis pending",
      marketGaps: "Analysis pending",
      differentiationScore: 50,
      suggestedPositioning: "Analysis pending",
    },
    riskSignals: r.riskSignals ?? {
      riskLevel: "Medium",
      detectedRisks: [],
      missingMetrics: [],
      diligenceQuestions: [],
    },
    investmentMemo: r.investmentMemo ?? "Investment memo generation is pending.",
    investmentSignal: r.investmentSignal ?? 50,
    confidence: r.confidence ?? 50,
    suggestedPrompts: r.suggestedPrompts ?? [
      "What are the biggest risks?",
      "Is this investment defensible?",
      "Compare to market leaders",
      "What diligence questions should we ask?",
    ],
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResultJson {
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
    competitors: {
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
    }[]
    marketPosition: {
      name: string
      x: number
      y: number
      z: number
      isSubject?: boolean
    }[]
    startupComparison: {
      targetCustomer: string
      pricingModel: string
      keyFeatures: string
      distribution: string
      marketMaturity: string
      moatStrength: string
    }
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
