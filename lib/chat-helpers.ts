/**
 * Shared helpers used by both /api/chat and /api/chat/stream.
 */
import prisma from "@/lib/prisma"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

/**
 * Build a system prompt that grounds the LLM in the current analysis context.
 * If analysisId is null or the analysis has no resultJson yet, falls back to a
 * generic VC analyst persona.
 */
export async function buildSystemPrompt(analysisId: string | null): Promise<string> {
  const base = `You are an expert venture capital analyst assistant. You help analysts evaluate startups, assess investment risk, and identify competitive dynamics. Be concise, direct, and evidence-based.`

  if (!analysisId) return base

  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
    select: {
      name: true,
      industry: true,
      stage: true,
      geography: true,
      investmentSignal: true,
      confidence: true,
      resultJson: true,
    },
  })

  if (!analysis) return base

  const r = analysis.resultJson as Record<string, any> | null
  if (!r) return base

  const risks = (r.riskSignals?.detectedRisks ?? [])
    .map((risk: { title: string }) => `• ${risk.title}`)
    .join("\n")

  return `${base}

You are currently analysing: **${analysis.name}** (${analysis.industry}, ${analysis.stage}, ${analysis.geography})
Investment Signal: ${analysis.investmentSignal ?? "N/A"}/100  |  Confidence: ${analysis.confidence ?? "N/A"}%

Company Overview:
- Problem: ${r.companySummary?.problem ?? "Unknown"}
- Product: ${r.companySummary?.product ?? "Unknown"}
- Target Customer: ${r.companySummary?.targetCustomer ?? "Unknown"}
- Business Model: ${r.companySummary?.businessModel ?? "Unknown"}

Key Insights:
- Competitive Advantage: ${r.insights?.competitiveAdvantage ?? "N/A"}
- Market Gaps: ${r.insights?.marketGaps ?? "N/A"}
- Differentiation Score: ${r.insights?.differentiationScore ?? "N/A"}/100

Risk Level: ${r.riskSignals?.riskLevel ?? "Unknown"}
Detected Risks:
${risks || "None identified"}

Answer questions using this context. If asked something outside your knowledge, say so clearly.`
}

/**
 * Persist the conversation turn (user + assistant) to the database.
 * Fire-and-forget — we don't await this in the streaming path to avoid latency.
 */
export function persistMessages(
  analysisId: string | null,
  messages: ChatMessage[]
): void {
  if (!analysisId || messages.length === 0) return
  prisma.chatMessage
    .createMany({
      data: messages.map((m) => ({
        analysisId,
        role: m.role,
        content: m.content,
      })),
    })
    .catch((err) => console.error("[chat] failed to persist messages:", err))
}
