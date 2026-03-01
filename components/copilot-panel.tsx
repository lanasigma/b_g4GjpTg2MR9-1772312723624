"use client"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
} from "lucide-react"

function BrandMark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/investable-logo.png" alt="investAble.ai" className="h-full w-full object-contain" />
}
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import { streamChat, sendChatMessage, type ChatMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

// Renders basic markdown (bold, italic, bullets) as JSX safely
function MsgMarkdown({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/)
  return (
    <div className="space-y-1.5">
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n").filter(Boolean)
        if (lines.length > 1 && lines.every((l) => /^[-•*]\s/.test(l.trim()))) {
          return (
            <ul key={pi} className="list-disc pl-4 space-y-0.5">
              {lines.map((l, li) => (
                <li key={li}><InlineMd text={l.replace(/^[-•*]\s/, "")} /></li>
              ))}
            </ul>
          )
        }
        if (lines.length > 1 && lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
          return (
            <ol key={pi} className="list-decimal pl-4 space-y-0.5">
              {lines.map((l, li) => (
                <li key={li}><InlineMd text={l.replace(/^\d+\.\s/, "")} /></li>
              ))}
            </ol>
          )
        }
        return <p key={pi}><InlineMd text={para} /></p>
      })}
    </div>
  )
}

function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i}>{part.slice(1, -1)}</em>
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

const DEFAULT_PROMPTS = [
  "What are the biggest risks?",
  "Is this investment defensible?",
  "Compare to market leaders",
  "What diligence questions should we ask?",
]

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Welcome to investAble.ai! I'm your AI analyst. Select or upload a startup to get contextual insights, risk signals, competitor analysis, and investment recommendations.",
}

export function CopilotPanel() {
  const { copilotOpen, setCopilotOpen, currentAnalysisId } = useApp()
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset conversation when a new analysis is selected
  useEffect(() => {
    setMessages([WELCOME_MESSAGE])
  }, [currentAnalysisId])

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim()
    if (!query || isTyping) return

    const userMessage: ChatMessage = { role: "user", content: query }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsTyping(true)

    // Append an empty assistant message that will be filled by streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      await streamChat(
        { analysisId: currentAnalysisId, messages: updatedMessages },
        (delta) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last.role !== "assistant") return prev
            return [...prev.slice(0, -1), { role: "assistant", content: last.content + delta }]
          })
        }
      )
    } catch {
      // Fall back to non-streaming if SSE fails
      try {
        const res = await sendChatMessage({
          analysisId: currentAnalysisId,
          messages: updatedMessages,
        })
        setMessages((prev) => [
          ...prev.slice(0, -1),
          res.message,
        ])
      } catch (err) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ])
      }
    } finally {
      setIsTyping(false)
    }
  }

  if (!copilotOpen) {
    return (
      <button
        onClick={() => setCopilotOpen(true)}
        className="flex h-screen w-12 flex-col items-center justify-center border-l border-border bg-card transition-colors hover:bg-muted"
        aria-label="Open AI copilot"
      >
        <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
      </button>
    )
  }

  return (
    <aside className="flex h-screen w-80 flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7">
            <BrandMark />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">
              invest<span className="text-primary">Able</span>
              <span className="text-muted-foreground">.ai</span> Copilot
            </h3>
            <p className="text-[10px] text-muted-foreground">Contextual AI assistant</p>
          </div>
        </div>
        <button
          onClick={() => setCopilotOpen(false)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close copilot panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
              msg.role === "assistant"
                ? "self-start bg-muted text-card-foreground"
                : "self-end bg-primary text-primary-foreground"
            )}
          >
            {msg.role === "assistant" && msg.content
              ? <MsgMarkdown text={msg.content} />
              : msg.content || (isTyping && i === messages.length - 1 ? null : "…")}
          </div>
        ))}
        {/* Typing indicator shown while waiting for first delta */}
        {isTyping && messages[messages.length - 1]?.content === "" && (
          <div className="self-start rounded-xl bg-muted px-3.5 py-2.5">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Suggested
        </p>
        <div className="flex flex-col gap-1">
          {DEFAULT_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              disabled={isTyping}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-card-foreground transition-colors disabled:opacity-50"
            >
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isTyping}
            className="text-sm"
          />
          <Button
            onClick={() => handleSend()}
            size="icon"
            className="shrink-0"
            disabled={isTyping}
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
