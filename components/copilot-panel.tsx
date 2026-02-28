"use client"

import { useState, useRef, useEffect } from "react"
import {
  Sparkles,
  Send,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useApp } from "@/lib/app-context"
import { demoCopilotMessages, demoSuggestedPrompts } from "@/lib/demo-data"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

const aiResponses: Record<string, string> = {
  "What are the biggest risks?":
    "Key investment risks: (1) Enterprise sales cycle length at Series A capital levels, (2) Zapier is adding AI features which could narrow FlowAI's differentiation window, (3) CAC and retention metrics are not disclosed, creating diligence blind spots, (4) Heavy founder dependency on CTO for core AI engine.",
  "Is this investment defensible?":
    "FlowAI's defensibility hinges on its behavioral learning data moat, which strengthens with usage. However, this moat is early-stage (12-18 months to maturity). The mid-market positioning is strategically sound -- underserved by both Zapier (SMB) and UiPath (enterprise). The key question is whether they can build sufficient data advantage before incumbents add similar AI capabilities.",
  "Compare to market leaders":
    "FlowAI differentiates primarily through its AI-native behavioral learning engine. While Zapier leads in integration breadth (5000+), FlowAI focuses on intelligent workflow suggestion. Make offers stronger visual building, and UiPath dominates enterprise RPA. FlowAI's mid-market positioning fills a notable gap in the $26B workflow automation market.",
  "What diligence questions should we ask?":
    "Priority diligence questions: (1) What are cohort-level retention metrics for the last 6 months? (2) How does CAC scale beyond early adopters? (3) What is the CTO succession plan given key-person risk? (4) Can you provide validated TAM narrowing to SAM? (5) What is the competitive response plan if Zapier launches AI workflows?",
}

export function CopilotPanel() {
  const { copilotOpen, setCopilotOpen } = useApp()
  const [messages, setMessages] = useState<Message[]>(
    demoCopilotMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))
  )
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = (text?: string) => {
    const query = text || input.trim()
    if (!query) return

    const userMessage: Message = { role: "user", content: query }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const response =
        aiResponses[query] ||
        `Based on my analysis of ${query.toLowerCase()}, FlowAI shows promising indicators. The AI-native approach to workflow automation positions them well in the growing mid-market segment. I'd recommend further due diligence on customer acquisition costs and competitive moat durability.`
      setMessages((prev) => [...prev, { role: "assistant", content: response }])
      setIsTyping(false)
    }, 1500)
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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">AI Copilot</h3>
            <p className="text-[10px] text-muted-foreground">Contextual assistant</p>
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
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col gap-3 p-4">
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
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div className="self-start rounded-xl bg-muted px-3.5 py-2.5">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Prompts */}
      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Suggested
        </p>
        <div className="flex flex-col gap-1">
          {demoSuggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-card-foreground transition-colors"
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
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="text-sm"
          />
          <Button
            onClick={() => handleSend()}
            size="icon"
            className="shrink-0"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
