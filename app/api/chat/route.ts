import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { buildSystemPrompt, persistMessages, type ChatMessage } from "@/lib/chat-helpers"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: systemPrompt,
  })

  // Convert chat history (all but the last user message) to Gemini format.
  // Gemini requires history to start with a "user" turn, so strip any leading
  // "model" turns (e.g., the UI welcome message).
  const rawHistory = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))
  const firstUserIdx = rawHistory.findIndex((m) => m.role === "user")
  const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : []
  const chat = model.startChat({ history })
  const result = await chat.sendMessage(messages[messages.length - 1].content)
  const assistantContent = result.response.text()

  const assistantMessage: ChatMessage = { role: "assistant", content: assistantContent }

  // Persist user + assistant messages (fire-and-forget)
  persistMessages(analysisId ?? null, [
    messages[messages.length - 1],
    assistantMessage,
  ])

  return NextResponse.json({ message: assistantMessage })
}
