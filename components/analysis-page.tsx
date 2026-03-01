"use client"

import { useState, useEffect } from "react"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import {
  Download,
  Share2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  Lightbulb,
  Building2,
  FileText,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  Users,
  BarChart3,
  DollarSign,
  Globe,
  Zap,
  Trophy,
  ArrowRight,
  AlertCircle,
  ThumbsDown,
  Rocket,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  fetchAnalysis,
  sendChatMessage,
  toggleSaved,
  type AnalysisResult,
  type InvestmentDecision,
  type StartupProfile,
} from "@/lib/api"
import { useApp } from "@/lib/app-context"
import { MarketPositionChart } from "@/components/market-chart"

// ─── Markdown renderer ────────────────────────────────────────────────────────
function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i}>{part.slice(1, -1)}</em>
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

type MdBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "p"; lines: string[] }

function parseMdBlocks(text: string): MdBlock[] {
  const blocks: MdBlock[] = []
  let cur: MdBlock | null = null

  const flush = () => { if (cur) { blocks.push(cur); cur = null } }

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd()

    // blank line: close a paragraph but let lists continue
    if (!line) {
      if (cur?.type === "p") flush()
      continue
    }

    if (/^# /.test(line)) { flush(); blocks.push({ type: "h1", text: line.slice(2) }); continue }
    if (/^## /.test(line)) { flush(); blocks.push({ type: "h2", text: line.slice(3) }); continue }

    if (/^[-•*] /.test(line.trimStart())) {
      if (cur?.type !== "ul") { flush(); cur = { type: "ul", items: [] } }
      ;(cur as { type: "ul"; items: string[] }).items.push(line.replace(/^\s*[-•*] /, ""))
      continue
    }
    if (/^\d+\. /.test(line.trimStart())) {
      if (cur?.type !== "ol") { flush(); cur = { type: "ol", items: [] } }
      ;(cur as { type: "ol"; items: string[] }).items.push(line.replace(/^\s*\d+\. /, ""))
      continue
    }

    // plain text
    if (cur?.type !== "p") { flush(); cur = { type: "p", lines: [] } }
    ;(cur as { type: "p"; lines: string[] }).lines.push(line)
  }
  flush()
  return blocks
}

function SimpleMarkdown({ text, className }: { text: string; className?: string }) {
  const blocks = parseMdBlocks(text)
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === "h1")
          return (
            <h2 key={i} className="text-sm font-bold text-primary border-b border-primary/20 pb-1 mt-6 mb-2">
              {block.text}
            </h2>
          )
        if (block.type === "h2")
          return <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-1">{block.text}</h3>
        if (block.type === "ul")
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5 mb-3">
              {block.items.map((item, j) => (
                <li key={j} className="text-sm leading-relaxed"><InlineMd text={item} /></li>
              ))}
            </ul>
          )
        if (block.type === "ol")
          return (
            <ol key={i} className="list-decimal pl-5 space-y-1.5 mb-3">
              {block.items.map((item, j) => (
                <li key={j} className="text-sm leading-relaxed"><InlineMd text={item} /></li>
              ))}
            </ol>
          )
        return (
          <p key={i} className="text-sm leading-relaxed mb-3">
            <InlineMd text={(block as { type: "p"; lines: string[] }).lines.join(" ")} />
          </p>
        )
      })}
    </div>
  )
}

// ─── PDF download for investment memo ────────────────────────────────────────
function memoToHtml(memo: string): string {
  const blocks = parseMdBlocks(memo)
  return blocks
    .map((block) => {
      if (block.type === "h1") return `<h2>${escHtml(block.text)}</h2>`
      if (block.type === "h2") return `<h3>${escHtml(block.text)}</h3>`
      if (block.type === "ul") {
        const items = block.items.map((item) => `<li>${inlineHtml(item)}</li>`).join("")
        return `<ul>${items}</ul>`
      }
      if (block.type === "ol") {
        const items = block.items.map((item) => `<li>${inlineHtml(item)}</li>`).join("")
        return `<ol>${items}</ol>`
      }
      return `<p>${inlineHtml((block as { type: "p"; lines: string[] }).lines.join(" "))}</p>`
    })
    .join("\n")
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function inlineHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
}

function downloadMemoAsPDF(startup: StartupProfile, memo: string) {
  const win = window.open("", "_blank", "width=960,height=800")
  if (!win) return
  const bodyHtml = memoToHtml(memo)
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  win.document.write(`<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8">
  <title>${startup.name} — Investment Memo</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Times New Roman',Georgia,serif;max-width:780px;margin:56px auto;line-height:1.75;color:#111;font-size:13.5px;background:#fff}
    /* Cover block */
    .cover{border-bottom:3px solid #E05520;padding-bottom:20px;margin-bottom:32px}
    .cover-badge{display:inline-block;background:#E05520;color:#fff;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:3px 10px;border-radius:3px;margin-bottom:10px}
    .cover h1{font-size:26px;font-weight:700;letter-spacing:-.3px;color:#111;line-height:1.2;margin-bottom:6px}
    .cover .subtitle{font-size:12.5px;color:#555;margin-bottom:14px}
    .cover .meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
    .cover .meta-item{background:#f7f7f7;border:1px solid #e5e5e5;border-radius:4px;padding:8px 10px}
    .cover .meta-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#888;font-weight:700;margin-bottom:2px}
    .cover .meta-value{font-size:12px;font-weight:600;color:#111}
    /* Confidential footer in header area */
    .confidential{font-size:9.5px;color:#aaa;margin-top:10px}
    /* Sections */
    h2{font-size:14.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#E05520;border-bottom:1.5px solid #f0d5cc;padding-bottom:5px;margin:32px 0 12px}
    h3{font-size:13px;font-weight:700;color:#222;margin:18px 0 8px}
    p{margin:0 0 12px;text-align:justify}
    ul,ol{margin:0 0 14px 22px}
    li{margin-bottom:5px}
    strong{font-weight:700}
    em{font-style:italic;color:#555}
    /* Deal at a glance formatted as clean list */
    ul li strong{color:#111}
    @page{size:A4;margin:18mm 22mm}
    @media print{
      body{margin:0;font-size:12px}
      h2{page-break-before:always}
      h2:first-of-type{page-break-before:avoid}
    }
  </style>
</head><body>
  <div class="cover">
    <div class="cover-badge">Investment Memo — Confidential</div>
    <h1>${escHtml(startup.name)}</h1>
    <div class="subtitle">${escHtml(startup.industry)} &nbsp;·&nbsp; ${escHtml(startup.stage)} &nbsp;·&nbsp; ${escHtml(startup.geography)} &nbsp;·&nbsp; ${escHtml(date)}</div>
    <div class="meta-grid">
      <div class="meta-item"><div class="meta-label">AI Signal</div><div class="meta-value">${startup.aiScore} / 100</div></div>
      <div class="meta-item"><div class="meta-label">Confidence</div><div class="meta-value">${startup.confidenceLevel}%</div></div>
      <div class="meta-item"><div class="meta-label">Stage</div><div class="meta-value">${escHtml(startup.stage)}</div></div>
      <div class="meta-item"><div class="meta-label">Geography</div><div class="meta-value">${escHtml(startup.geography)}</div></div>
    </div>
    <div class="confidential">This document contains confidential information prepared by investAble.ai for internal use only. Not for distribution.</div>
  </div>
  ${bodyHtml}
  <script>window.onload=function(){window.print()}</script>
</body></html>`)
  win.document.close()
}

// ─── Brand colours for recharts (CSS vars don't work inside SVG) ──────────────
const BRAND = "#E8521A"
const BRAND_MUTED = "rgba(232,82,26,0.15)"
const SUCCESS = "#22c55e"
const DESTRUCTIVE = "#f87171"
const MUTED = "#94a3b8"

// ─── Basic shared components ──────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-success/15 text-success border-success/30"
      : score >= 60
      ? "bg-primary/15 text-primary border-primary/30"
      : "bg-warning/15 text-warning-foreground border-warning/30"
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-lg font-bold ${color}`}>
      <Sparkles className="h-4 w-4" />
      {score}
    </span>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h4>
      </div>
      <p className="text-sm leading-relaxed text-card-foreground">{value}</p>
    </div>
  )
}

function InsightCard({
  title,
  content,
  icon: Icon,
  score,
}: {
  title: string
  content: string
  icon: React.ElementType
  score?: number
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
            {score !== undefined && (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-border">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
                </div>
                <span className="text-xs font-semibold text-primary">{score}/100</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{content}</p>}
    </div>
  )
}

function RiskLevelBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const colorMap = {
    Low: "bg-success/15 text-success border-success/30",
    Medium: "bg-warning/15 text-warning-foreground border-warning/30",
    High: "bg-destructive/15 text-destructive border-destructive/30",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorMap[level]}`}>
      <ShieldAlert className="h-3 w-3" />
      {level} Risk
    </span>
  )
}

function RiskItem({ title, detail }: { title: string; detail: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-background p-3 transition-shadow hover:shadow-sm">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between gap-2 text-left">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning-foreground" />
          <span className="text-sm font-medium text-card-foreground">{title}</span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      </button>
      {expanded && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>}
    </div>
  )
}

// ─── Visualisation 1: Investment Scorecard Radar ──────────────────────────────

function ScoreRadarChart({ data }: { data: { subject: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(148,163,184,0.25)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: MUTED, fontSize: 11, fontWeight: 500 }} />
        <Radar
          name="Score"
          dataKey="score"
          stroke={BRAND}
          fill={BRAND}
          fillOpacity={0.18}
          strokeWidth={2}
          dot={{ fill: BRAND, r: 3 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ─── Visualisation 2: TAM / SAM / SOM Funnel ─────────────────────────────────

function MarketSizingFunnel({ tam, sam, som }: { tam: string; sam: string; som: string }) {
  const tiers = [
    { label: "TAM", sub: "Total Addressable Market", value: tam, pct: "100%" },
    { label: "SAM", sub: "Serviceable Addressable Market", value: sam, pct: "62%" },
    { label: "SOM", sub: "Obtainable (3-5 yr)", value: som, pct: "32%" },
  ]
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {tiers.map((t, i) => (
        <div key={t.label} className="flex w-full flex-col items-center gap-1">
          <div
            className="flex items-center justify-between rounded-lg px-5 py-3"
            style={{
              width: t.pct,
              background: `rgba(232,82,26,${0.12 + i * 0.1})`,
              border: `1.5px solid rgba(232,82,26,${0.3 + i * 0.15})`,
              transition: "width 0.6s ease",
            }}
          >
            <span className="text-sm font-bold text-primary">{t.label}</span>
            <span className="text-sm font-semibold text-card-foreground">{t.value}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{t.sub}</p>
          {i < tiers.length - 1 && (
            <svg width="12" height="8" viewBox="0 0 12 8" className="text-muted-foreground/40">
              <path d="M6 8L0 0h12z" fill="currentColor" />
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Visualisation 3: Product Maturity Tracker ───────────────────────────────

const MATURITY_STEPS = ["Concept", "MVP", "Beta", "Live", "Scaling"]

function ProductMaturityTracker({ maturity }: { maturity: string }) {
  const currentIdx = MATURITY_STEPS.findIndex(
    (s) => s.toLowerCase() === (maturity ?? "").toLowerCase()
  )
  return (
    <div className="flex items-start gap-0">
      {MATURITY_STEPS.map((step, i) => {
        const isActive = i === currentIdx
        const isPast = i < currentIdx
        return (
          <div key={step} className="flex items-start">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : isPast
                    ? "bg-primary/25 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isPast ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-semibold ${
                  isActive ? "text-primary" : isPast ? "text-primary/60" : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
            {i < MATURITY_STEPS.length - 1 && (
              <div
                className={`mt-4 h-0.5 w-10 ${i < currentIdx ? "bg-primary/40" : "bg-muted"}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Visualisation 4: Metrics Disclosure Donut ───────────────────────────────

function MetricsDisclosureDonut({
  metrics,
}: {
  metrics: { label: string; value: string; present: boolean }[]
}) {
  const present = metrics.filter((m) => m.present).length
  const missing = metrics.length - present
  const pct = metrics.length > 0 ? Math.round((present / metrics.length) * 100) : 0
  const data = [
    { name: "Disclosed", value: present },
    { name: "Missing", value: missing || 0.001 }, // avoid empty pie
  ]
  return (
    <div className="flex items-center gap-5">
      <div className="relative flex shrink-0 items-center justify-center" style={{ width: 110, height: 110 }}>
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={34} outerRadius={50} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
              <Cell fill={SUCCESS} />
              <Cell fill="rgba(148,163,184,0.2)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center">
          <span className="text-lg font-bold text-card-foreground">{pct}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-card-foreground">Metrics Disclosed</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{present} of {metrics.length} investor metrics present</p>
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">{present} disclosed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted" />
            <span className="text-xs text-muted-foreground">{missing} not disclosed</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Visualisation 5: Moat Strength Bar Chart ────────────────────────────────

const moatToValue = (s: string) =>
  s === "Strong" ? 100 : s === "Moderate" ? 60 : 25

const moatColor = (v: number) =>
  v >= 100 ? SUCCESS : v >= 60 ? BRAND : DESTRUCTIVE

interface MoatDatum {
  name: string
  moat: number
  isSubject: boolean
}

function MoatStrengthChart({ data }: { data: MoatDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.15)" />
        <XAxis
          dataKey="name"
          tick={{ fill: MUTED, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          dy={4}
        />
        <YAxis domain={[0, 100]} hide />
        <Tooltip
          formatter={(v: number) => [
            v === 100 ? "Strong" : v === 60 ? "Moderate" : "Weak",
            "Moat",
          ]}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="moat" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isSubject ? BRAND : moatColor(entry.moat)} fillOpacity={entry.isSubject ? 1 : 0.65} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Investment Decision Verdict card ─────────────────────────────────────────

const verdictConfig = {
  STRONG_BUY: {
    label: "Strong Buy",
    bg: "bg-success/10 border-success/40",
    text: "text-success",
    icon: Trophy,
    badge: "bg-success text-white",
  },
  BUY: {
    label: "Buy",
    bg: "bg-primary/10 border-primary/40",
    text: "text-primary",
    icon: TrendingUp,
    badge: "bg-primary text-white",
  },
  HOLD: {
    label: "Hold",
    bg: "bg-warning/10 border-warning/40",
    text: "text-warning-foreground",
    icon: AlertCircle,
    badge: "bg-warning text-warning-foreground",
  },
  PASS: {
    label: "Pass",
    bg: "bg-destructive/10 border-destructive/40",
    text: "text-destructive",
    icon: ThumbsDown,
    badge: "bg-destructive text-white",
  },
}

function VerdictCard({ decision }: { decision: InvestmentDecision }) {
  const cfg = verdictConfig[decision.verdict] ?? verdictConfig.HOLD
  const Icon = cfg.icon

  return (
    <div className={`rounded-xl border-2 p-6 ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${cfg.badge}`}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Investment Verdict</p>
            <h3 className={`text-2xl font-bold ${cfg.text}`}>{cfg.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{decision.verdictRationale}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Return Potential</p>
          <p className={`text-lg font-bold ${cfg.text}`}>{decision.returnPotential}</p>
        </div>
      </div>

      {(decision.strategicFit || decision.timingReadiness) && (
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
          {decision.strategicFit && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategic Fit</p>
              <p className="text-sm text-card-foreground">{decision.strategicFit}</p>
            </div>
          )}
          {decision.timingReadiness && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timing Readiness</p>
              <p className="text-sm text-card-foreground">{decision.timingReadiness}</p>
            </div>
          )}
        </div>
      )}

      {decision.exitOpportunities && decision.exitOpportunities.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exit Opportunities</p>
          <div className="flex flex-wrap gap-2">
            {decision.exitOpportunities.map((exit) => (
              <span key={exit} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-card-foreground">
                <ArrowRight className="h-3 w-3 text-primary" />
                {exit}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Comparison table config ──────────────────────────────────────────────────

const comparisonRows = [
  "targetCustomer",
  "pricingModel",
  "keyFeatures",
  "distribution",
  "marketMaturity",
  "moatStrength",
] as const

const comparisonLabels: Record<string, string> = {
  targetCustomer: "Target Customer",
  pricingModel: "Pricing Model",
  keyFeatures: "Key Features",
  distribution: "Distribution",
  marketMaturity: "Market Maturity",
  moatStrength: "Moat Strength",
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalysisPage() {
  const { currentAnalysisId } = useApp()
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [askQuery, setAskQuery] = useState("")
  const [askResponse, setAskResponse] = useState("")
  const [askLoading, setAskLoading] = useState(false)
  const [memoOpen, setMemoOpen] = useState(false)

  useEffect(() => {
    if (!currentAnalysisId) { setLoading(false); return }
    setLoading(true)
    fetchAnalysis(currentAnalysisId)
      .then((data) => { setAnalysis(data); setSaved(data.saved) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentAnalysisId])

  const handleToggleSaved = async () => {
    if (!currentAnalysisId || saveLoading) return
    setSaveLoading(true)
    try {
      const res = await toggleSaved(currentAnalysisId, !saved)
      setSaved(res.saved)
    } catch (err) {
      console.error("Failed to toggle saved:", err)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleAsk = async () => {
    if (!askQuery.trim() || !currentAnalysisId) return
    const query = askQuery.trim()
    setAskQuery("")
    setAskLoading(true)
    try {
      const res = await sendChatMessage({ analysisId: currentAnalysisId, messages: [{ role: "user", content: query }] })
      setAskResponse(res.message.content)
    } catch {
      setAskResponse("Failed to get a response. Please try again.")
    } finally {
      setAskLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!analysis || !analysis.startup) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-muted-foreground">
        {currentAnalysisId
          ? "Analysis is still processing. Please check back shortly."
          : "No analysis selected. Upload a startup to get started."}
      </div>
    )
  }

  const {
    startup,
    competitors,
    marketPosition,
    startupComparison,
    insights,
    riskSignals,
    suggestedPrompts,
    marketAnalysis,
    teamEvaluation,
    traction,
    financialHealth,
    impactSustainability,
    investmentDecision,
  } = analysis

  // Build radar data from available scores
  const radarData = [
    { subject: "Investment", score: startup.aiScore },
    ...(insights ? [{ subject: "Differentiation", score: insights.differentiationScore }] : []),
    ...(teamEvaluation ? [{ subject: "Team", score: teamEvaluation.teamScore }] : []),
    ...(traction ? [{ subject: "Traction", score: traction.tractionScore }] : []),
    ...(financialHealth ? [{ subject: "Financial", score: financialHealth.financialScore }] : []),
    ...(impactSustainability ? [{ subject: "Impact", score: impactSustainability.impactScore }] : []),
  ]

  // Build moat chart data
  const moatData: MoatDatum[] = [
    ...(startupComparison ? [{ name: startup.name, moat: moatToValue(startupComparison.moatStrength), isSubject: true }] : []),
    ...competitors.map((c) => ({ name: c.name, moat: moatToValue(c.moatStrength), isSubject: false })),
  ]

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{startup.name}</h2>
            <ScoreBadge score={startup.aiScore} />
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Confidence: {startup.confidenceLevel}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{startup.industry}</Badge>
            <Badge variant="outline">{startup.stage}</Badge>
            {startup.productMaturity && (
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                {startup.productMaturity}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{startup.geography}</span>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">{startup.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="h-3.5 w-3.5" />Export
          </Button>
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={() => navigator.clipboard.writeText(`${startup.name} — Investment Analysis | ${window.location.href}`)}
          >
            <Share2 className="h-3.5 w-3.5" />Share
          </Button>
          <Button
            variant={saved ? "default" : "outline"} size="sm" className="gap-1.5"
            onClick={handleToggleSaved} disabled={saveLoading}
          >
            <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
            {saved ? "Saved" : "Save"}
          </Button>
          {analysis.investmentMemo && (
            <Button size="sm" className="gap-1.5" onClick={() => setMemoOpen(true)}>
              <FileText className="h-3.5 w-3.5" />Generate Memo
            </Button>
          )}
        </div>
      </div>

      {/* ── Investment Decision ─────────────────────────────────────────────── */}
      {investmentDecision && (
        <>
          <SectionHeader
            title="Investment Decision"
            description="AI-generated investment verdict based on comprehensive analysis of all factors."
          />
          <VerdictCard decision={investmentDecision} />
        </>
      )}

      {/* ── Investment Scorecard (Radar) ────────────────────────────────────── */}
      {radarData.length >= 3 && (
        <>
          <SectionHeader
            title="Investment Scorecard"
            description="Multi-dimensional view of all evaluated factors scored 0–100."
          />
          <div className="grid grid-cols-3 gap-4">
            {/* Radar chart */}
            <div className="col-span-2 rounded-xl border border-border bg-card p-5">
              <ScoreRadarChart data={radarData} />
            </div>

            {/* Score breakdown */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Score Breakdown
              </h4>
              <div className="flex flex-col gap-3">
                {radarData.map((d) => (
                  <div key={d.subject} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{d.subject}</span>
                      <span className={`text-xs font-bold ${d.score >= 70 ? "text-success" : d.score >= 50 ? "text-primary" : "text-warning-foreground"}`}>
                        {d.score}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border">
                      <div
                        className={`h-1.5 rounded-full transition-all ${d.score >= 70 ? "bg-success" : d.score >= 50 ? "bg-primary" : "bg-warning"}`}
                        style={{ width: `${d.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Company & Product ──────────────────────────────────────────────── */}
      <SectionHeader
        title="Company & Product"
        description="Core business details, problem-solution fit, and product maturity assessment."
      />

      {/* Product Maturity Tracker */}
      {startup.productMaturity && startup.productMaturity !== "Unknown" && (
        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Product Maturity Stage
          </h4>
          <ProductMaturityTracker maturity={startup.productMaturity} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <InfoCard label="Problem Statement" value={startup.problem} />
        <InfoCard label="Product / Solution" value={startup.product} />
        <InfoCard label="Target Customer" value={startup.targetCustomer} />
        <InfoCard label="Business Model" value={startup.businessModel} />
        {startup.techDefensibility && (
          <div className="col-span-2">
            <InfoCard label="Tech Defensibility & Moat" value={startup.techDefensibility} icon={Shield} />
          </div>
        )}
      </div>

      {/* ── Market Analysis ────────────────────────────────────────────────── */}
      {marketAnalysis && (
        <>
          <SectionHeader
            title="Market Analysis"
            description="Market sizing, growth dynamics, and timing factors for this investment opportunity."
          />

          {/* TAM / SAM / SOM funnel */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Market Sizing Funnel
                </h4>
              </div>
              <MarketSizingFunnel tam={marketAnalysis.tam} sam={marketAnalysis.sam} som={marketAnalysis.som} />
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Growth Rate</h4>
                </div>
                <p className="text-sm font-medium text-card-foreground">{marketAnalysis.growthRate}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why Now</h4>
                </div>
                <p className="text-sm leading-relaxed text-card-foreground">{marketAnalysis.whyNow}</p>
              </div>
            </div>
          </div>

          {(marketAnalysis.industryTrends.length > 0 || marketAnalysis.customerSegments.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {marketAnalysis.industryTrends.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Industry Trends</h4>
                  <div className="flex flex-col gap-2">
                    {marketAnalysis.industryTrends.map((trend, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{i + 1}</span>
                        <span className="text-sm text-card-foreground">{trend}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {marketAnalysis.customerSegments.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Segments</h4>
                  <div className="flex flex-wrap gap-2">
                    {marketAnalysis.customerSegments.map((seg) => (
                      <Badge key={seg} variant="secondary">{seg}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Team Evaluation ────────────────────────────────────────────────── */}
      {teamEvaluation && (
        <>
          <SectionHeader
            title="Team Evaluation"
            description="Founder background, domain expertise, and team completeness assessment."
          />
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-card-foreground">Team Score</h4>
              </div>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">{teamEvaluation.teamScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-border">
                <div
                  className={`h-2 rounded-full transition-all ${teamEvaluation.teamScore >= 70 ? "bg-success" : teamEvaluation.teamScore >= 50 ? "bg-primary" : "bg-warning"}`}
                  style={{ width: `${teamEvaluation.teamScore}%` }}
                />
              </div>
            </div>
            <div className="col-span-2 rounded-xl border border-border bg-card p-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Founder-Market Fit</h4>
              <p className="text-sm leading-relaxed text-card-foreground">{teamEvaluation.founderMarketFit}</p>
            </div>
          </div>

          {teamEvaluation.founders && teamEvaluation.founders.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {teamEvaluation.founders.map((founder, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {(founder.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{founder.name}</p>
                      <p className="text-xs text-primary">{founder.role}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{founder.background}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Domain Expertise" value={teamEvaluation.domainExpertise} icon={Users} />
            <InfoCard label="Team Completeness" value={teamEvaluation.teamCompleteness} icon={CheckCircle2} />
          </div>
        </>
      )}

      {/* ── Traction & Metrics ─────────────────────────────────────────────── */}
      {traction && (
        <>
          <SectionHeader
            title="Traction & Metrics"
            description="Key performance indicators, unit economics, and business growth signals."
          />

          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-1 flex items-center gap-2">
                <Rocket className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Traction Score</p>
              </div>
              <p className="text-2xl font-bold text-primary">{traction.tractionScore}</p>
              <div className="mt-2 h-1.5 rounded-full bg-border">
                <div
                  className={`h-1.5 rounded-full ${traction.tractionScore >= 70 ? "bg-success" : traction.tractionScore >= 50 ? "bg-primary" : "bg-warning"}`}
                  style={{ width: `${traction.tractionScore}%` }}
                />
              </div>
            </div>
            {[
              { label: "ARR", value: traction.arr },
              { label: "CAC", value: traction.cac },
              { label: "LTV", value: traction.ltv },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-base font-bold text-card-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "User Growth", value: traction.userGrowth },
              { label: "Retention Rate", value: traction.retention },
              { label: "LTV/CAC Ratio", value: traction.ltvCacRatio },
              { label: "Gross Margin", value: traction.grossMargin },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-sm font-semibold text-card-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Metrics Disclosure: donut + grid */}
          {traction.keyMetrics && traction.keyMetrics.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 text-sm font-semibold text-card-foreground">Investor Metrics Disclosure</h4>
              <div className="grid grid-cols-2 gap-6">
                {/* Donut on the left */}
                <MetricsDisclosureDonut metrics={traction.keyMetrics} />

                {/* Per-metric list on the right */}
                <div className="grid grid-cols-1 gap-2">
                  {traction.keyMetrics.map((metric) => (
                    <div key={metric.label} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                      {metric.present ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                      )}
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <p className={`text-sm ${metric.present ? "text-card-foreground font-medium" : "text-muted-foreground"}`}>
                          {metric.label}
                        </p>
                        {metric.present && metric.value && metric.value !== "Not disclosed" && (
                          <p className="text-xs font-semibold text-primary shrink-0">{metric.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Competitive Landscape ──────────────────────────────────────────── */}
      <SectionHeader
        title="Competitive Landscape"
        description="Competitive positioning and market context used for investment evaluation."
      />

      <div className="grid grid-cols-4 gap-4">
        {competitors.map((comp) => (
          <div key={comp.name} className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-semibold text-card-foreground">{comp.name}</h4>
            <p className="mb-2 text-xs text-muted-foreground">{comp.positioning}</p>
            <Badge variant="outline" className="text-[10px]">{comp.pricingTier}</Badge>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{comp.differentiation}</p>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      {startupComparison && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-card-foreground">Feature Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="px-5 py-3 w-40">Dimension</th>
                  <th className="px-5 py-3 bg-primary/5 font-semibold text-primary">{startup.name}</th>
                  {competitors.map((c) => (
                    <th key={c.name} className="px-5 py-3">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-xs font-medium text-card-foreground">{comparisonLabels[row]}</td>
                    <td className="px-5 py-3 bg-primary/5 text-xs text-card-foreground font-medium">{startupComparison[row]}</td>
                    {competitors.map((c) => (
                      <td key={c.name} className="px-5 py-3 text-xs text-muted-foreground">{c[row]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moat Strength Chart + Market Position Map */}
      <div className="grid grid-cols-2 gap-4">
        {moatData.length > 1 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-1 text-sm font-semibold text-card-foreground">Moat Strength Comparison</h3>
            <p className="mb-4 text-xs text-muted-foreground">Competitive defensibility — orange = {startup.name}</p>
            <MoatStrengthChart data={moatData} />
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: DESTRUCTIVE }} /> Weak</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: BRAND }} /> Moderate</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: SUCCESS }} /> Strong</span>
            </div>
          </div>
        )}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Market Position Map</h3>
          <MarketPositionChart data={marketPosition} />
        </div>
      </div>

      {/* ── AI Insights ────────────────────────────────────────────────────── */}
      {insights && (
        <>
          <SectionHeader
            title="Investment Insights"
            description="AI-generated decision support and strategic recommendations."
          />
          <div className="grid grid-cols-2 gap-4">
            <InsightCard title="Competitive Advantage" content={insights.competitiveAdvantage} icon={Shield} />
            <InsightCard title="Market Gaps Identified" content={insights.marketGaps} icon={Target} />
            <InsightCard title="Differentiation Score" content={insights.suggestedPositioning} icon={TrendingUp} score={insights.differentiationScore} />
            <InsightCard title="Suggested Positioning" content={insights.suggestedPositioning} icon={Lightbulb} />
          </div>
        </>
      )}

      {/* ── Financial Health ───────────────────────────────────────────────── */}
      {financialHealth && (
        <>
          <SectionHeader
            title="Financial Health"
            description="Capital efficiency, funding history, and runway assessment."
          />
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-1 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Score</p>
              </div>
              <p className="text-2xl font-bold text-primary">{financialHealth.financialScore}</p>
              <div className="mt-2 h-1.5 rounded-full bg-border">
                <div
                  className={`h-1.5 rounded-full ${financialHealth.financialScore >= 70 ? "bg-success" : financialHealth.financialScore >= 50 ? "bg-primary" : "bg-warning"}`}
                  style={{ width: `${financialHealth.financialScore}%` }}
                />
              </div>
            </div>
            {[
              { label: "Monthly Burn Rate", value: financialHealth.burnRate },
              { label: "Runway", value: financialHealth.runway },
              { label: "Total Raised", value: financialHealth.totalRaised },
              { label: "Funding Stage", value: financialHealth.fundingStage },
              { label: "Future Capital Needs", value: financialHealth.futureCapitalNeeds },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-sm font-semibold text-card-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
          {financialHealth.notableInvestors && financialHealth.notableInvestors.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notable Investors</h4>
              <div className="flex flex-wrap gap-2">
                {financialHealth.notableInvestors.map((inv) => (
                  <Badge key={inv} variant="secondary">{inv}</Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Risk & Diligence Signals ───────────────────────────────────────── */}
      {riskSignals && (
        <>
          <SectionHeader
            title="Risk & Diligence Signals"
            description="Automated risk detection, regulatory exposure, and diligence gap analysis."
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-card-foreground">Detected Risks</h4>
                <RiskLevelBadge level={riskSignals.riskLevel} />
              </div>
              <div className="flex flex-col gap-2">
                {riskSignals.detectedRisks.map((risk) => (
                  <RiskItem key={risk.title} title={risk.title} detail={risk.detail} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="mb-3 text-sm font-semibold text-card-foreground">Missing Investor Metrics</h4>
                <div className="flex flex-col gap-2">
                  {riskSignals.missingMetrics.map((metric) => (
                    <div key={metric.label} className="flex items-center gap-2.5">
                      {metric.present ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                      )}
                      <span className={`text-sm ${metric.present ? "text-card-foreground" : "text-muted-foreground"}`}>
                        {metric.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-card-foreground">Suggested Diligence Questions</h4>
                </div>
                <ol className="flex flex-col gap-2">
                  {riskSignals.diligenceQuestions.map((question, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                      <span className="text-sm leading-relaxed text-muted-foreground">{question}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Impact & Sustainability ────────────────────────────────────────── */}
      {impactSustainability && (
        <>
          <SectionHeader
            title="Impact & Sustainability"
            description="ESG assessment — social impact, ethical risks, and long-term sustainability."
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center gap-6 rounded-xl border border-border bg-card p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-card-foreground">Overall Impact Score</p>
                  <span className="text-lg font-bold text-primary">{impactSustainability.impactScore}/100</span>
                </div>
                <div className="h-2 w-full rounded-full bg-border">
                  <div
                    className={`h-2 rounded-full transition-all ${impactSustainability.impactScore >= 70 ? "bg-success" : impactSustainability.impactScore >= 50 ? "bg-primary" : "bg-warning"}`}
                    style={{ width: `${impactSustainability.impactScore}%` }}
                  />
                </div>
              </div>
            </div>
            <InfoCard label="Social Impact" value={impactSustainability.socialImpact} icon={Globe} />
            <InfoCard label="Ethical Risks" value={impactSustainability.ethicalRisks} icon={AlertTriangle} />
            <InfoCard label="Environmental Contribution" value={impactSustainability.environmentalContribution} icon={Globe} />
            <InfoCard label="Economic Viability" value={impactSustainability.economicViability} icon={TrendingUp} />
          </div>
        </>
      )}

      {/* ── Investment Memo Dialog ──────────────────────────────────────────── */}
      <Dialog open={memoOpen} onOpenChange={setMemoOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-row items-center justify-between shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {startup.name} — Investment Memo
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 mr-8"
              onClick={() => downloadMemoAsPDF(startup, analysis.investmentMemo)}
            >
              <Download className="h-3.5 w-3.5" />Download PDF
            </Button>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1">
            <SimpleMarkdown
              text={analysis.investmentMemo}
              className="text-card-foreground"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Ask AI ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-card-foreground">Ask AI about {startup.name}</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about this startup…"
            value={askQuery}
            onChange={(e) => setAskQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            disabled={askLoading}
          />
          <Button onClick={handleAsk} size="sm" className="gap-1.5 shrink-0" disabled={askLoading}>
            {askLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Ask
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(suggestedPrompts.length > 0
            ? suggestedPrompts.slice(0, 4)
            : ["What are the key investment risks?", "Is the competitive moat defensible?", "What diligence gaps remain?", "Evaluate the team strength"]
          ).map((prompt) => (
            <button
              key={prompt}
              onClick={() => setAskQuery(prompt)}
              className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
        {askResponse && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Response</span>
            </div>
            <SimpleMarkdown text={askResponse} className="text-card-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}
