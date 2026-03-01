import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { buildSystemPrompt, persistMessages, type ChatMessage } from "@/lib/chat-helpers"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ─── POST /api/chat/stream ────────────────────────────────────────────────────
/**
 * Streaming chat using Server-Sent Events.
 *
 * Request body:
 * { analysisId: string | null, messages: { role: "user"|"assistant", content: string }[] }
 *
 * Each SSE event:
 *   data: {"delta":"partial text","done":false}
 *   data: {"delta":"","done":true}
 *
 * Client-side usage (copilot-panel.tsx):
 *   const res = await fetch("/api/chat/stream", { method:"POST", body: JSON.stringify({...}) })
 *   const reader = res.body!.getReader()
 *   // append each delta.text to the last assistant message
 */
export async function POST(request: NextRequest) {
  let body: { analysisId?: string | null; messages?: ChatMessage[] }
  try {
    body = await request.json()
  } catch {
    return new Response(
      `data: ${JSON.stringify({ error: "Invalid JSON", done: true })}\n\n`,
      { status: 400, headers: sseHeaders() }
    )
  }

  const { analysisId = null, messages = [] } = body

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return new Response(
      `data: ${JSON.stringify({ error: "Last message must be from user", done: true })}\n\n`,
      { status: 400, headers: sseHeaders() }
    )
  }

  const systemPrompt = await buildSystemPrompt(analysisId ?? null)

  // Build the SSE stream
  let fullAssistantText = ""
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Use Gemini streaming
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash-lite",
          systemInstruction: systemPrompt,
        })

        const history = messages.slice(0, -1).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }))
        const chat = model.startChat({ history })
        const result = await chat.sendMessageStream(
          messages[messages.length - 1].content
        )

        for await (const chunk of result.stream) {
          const delta = chunk.text()
          if (delta) {
            fullAssistantText += delta
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta, done: false })}\n\n`)
            )
          }
        }

        // Signal completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ delta: "", done: true })}\n\n`)
        )
        controller.close()

        // Persist messages after stream completes (fire-and-forget)
        persistMessages(analysisId ?? null, [
          messages[messages.length - 1],
          { role: "assistant", content: fullAssistantText },
        ])
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error"
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: msg, done: true })}\n\n`
          )
        )
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: sseHeaders() })
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // disable Nginx buffering on Vercel
  }
}
