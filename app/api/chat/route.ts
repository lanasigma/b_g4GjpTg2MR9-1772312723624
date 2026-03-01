import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { buildSystemPrompt, persistMessages, type ChatMessage } from "@/lib/chat-helpers"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── POST /api/chat ───────────────────────────────────────────────────────────
/**
 * Non-streaming chat fallback.
 *
 * Request body:
 * { analysisId: string | null, messages: { role: "user"|"assistant", content: string }[] }
 *
 * Response:
 * { message: { role: "assistant", content: string } }
 */
export async function POST(request: NextRequest) {
  let body: { analysisId?: string | null; messages?: ChatMessage[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { analysisId = null, messages = [] } = body

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Last message must be from user" }, { status: 400 })
  }

  const systemPrompt = await buildSystemPrompt(analysisId ?? null)

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  const assistantContent =
    response.content[0]?.type === "text" ? response.content[0].text : ""

  const assistantMessage: ChatMessage = { role: "assistant", content: assistantContent }

  // Persist user + assistant messages (fire-and-forget)
  persistMessages(analysisId ?? null, [
    messages[messages.length - 1],
    assistantMessage,
  ])

  return NextResponse.json({ message: assistantMessage })
}
