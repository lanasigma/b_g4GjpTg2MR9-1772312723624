# Analyst Copilot — Backend API Contract

> **Status:** ✅ **Implemented** — all routes live in `app/api/**/route.ts`.
> See [SETUP.md](SETUP.md) for installation and deployment instructions.

> **Scope:** This document defines the data requirements the frontend satisfies with
> API calls to Next.js App Router Route Handlers. All mock data in `lib/demo-data.ts`
> has been replaced.
>
> **Stack:** Next.js App Router · Prisma (SQLite dev / Postgres prod) · Vercel Blob ·
> Inngest · Anthropic claude-sonnet-4-6
>
> **Upload constraint:** PDF bytes are uploaded **directly to Vercel Blob** from the browser.
> API routes never buffer file content — only the resulting Blob URL is sent to the backend.

---

## Implemented endpoints (7 total)

| Method | Path | File | Status |
|---|---|---|---|
| `POST` | `/api/uploads` | `app/api/uploads/route.ts` | ✅ |
| `POST` | `/api/analyses` | `app/api/analyses/route.ts` | ✅ |
| `GET` | `/api/analyses` | `app/api/analyses/route.ts` | ✅ |
| `GET` | `/api/analyses/:id` | `app/api/analyses/[id]/route.ts` | ✅ |
| `PATCH` | `/api/analyses/:id` | `app/api/analyses/[id]/route.ts` | ✅ |
| `GET` | `/api/analyses/jobs/:jobId` | `app/api/analyses/jobs/[jobId]/route.ts` | ✅ |
| `POST` | `/api/chat` | `app/api/chat/route.ts` | ✅ |
| `POST` | `/api/chat/stream` | `app/api/chat/stream/route.ts` | ✅ |
| `GET/POST/PUT` | `/api/inngest` | `app/api/inngest/route.ts` | ✅ (infrastructure) |

---

## PDF upload flow (Vercel Blob)

```
Browser                         /api/uploads            Vercel Blob
   │                                  │                       │
   │── POST /api/uploads ────────────▶│                       │
   │   { filename, contentType }      │                       │
   │                                  │── handleUpload() ────▶│
   │◀─ { uploadUrl, token } ──────────│◀─ token ──────────────│
   │                                  │                       │
   │── PUT {uploadUrl} (PDF bytes) ──────────────────────────▶│
   │◀─ { url: "https://blob.vercel..." } ────────────────────│
   │                                  │                       │
   │── POST /api/analyses ────────────▶│
   │   { kind:"pdf", pdfUrl, name, industry, stage, geography }
   │◀─ { jobId, analysisId } ─────────│
```

**Client-side code (in `upload-page.tsx`):**
```typescript
import { upload } from "@vercel/blob/client"

const blob = await upload(file.name, file, {
  access: "public",
  handleUploadUrl: "/api/uploads",
})
// blob.url → POST /api/analyses as pdfUrl
```

---

## Analysis job polling flow

```
Browser                     /api/analyses/jobs/:jobId
   │                                  │
   │── POST /api/analyses ────────────▶│  → creates Analysis + Job
   │◀─ { jobId, analysisId } ─────────│  → fires Inngest event
   │                                  │
   │  [every 1.5s while status ≠ complete/failed]
   │── GET /api/analyses/jobs/:jobId ─▶│
   │◀─ { status, currentStep, stepIndex, progress } ─│
   │                                  │
   │  [status === "complete"]
   │── GET /api/analyses/:analysisId ─▶│  → full result
```

**Step name → stepIndex mapping:**

| stepIndex | currentStep |
|---|---|
| 0 | `"Parsing pitch materials"` |
| 1 | `"Structuring company intelligence"` |
| 2 | `"Mapping market landscape"` |
| 3 | `"Detecting risks & gaps"` |
| 4 | `"Generating investment memo"` |
| 5 | `null` (complete) |

---

## Inngest pipeline

File: `inngest/functions/analysis-pipeline.ts`

Event: `analyst-copilot/analysis.started`
Payload: `{ analysisId: string, jobId: string }`

```
Step 1: parse-pitch-materials         → fetch PDF from Blob URL, extract text with pdf-parse
                                         OR fetch website HTML and strip tags
                                         → saves text to Source.text
Step 2: structure-company-intelligence → progress marker (35% → 45%)
Step 3: map-market-landscape           → progress marker (55% → 62%)
Step 4: detect-risks-gaps              → progress marker (70% → 77%)
Step 5: generate-investment-memo       → ONE LLM call to claude-sonnet-4-6
                                         → returns structured JSON (resultJson)
save-results                           → Analysis.status = DONE
                                         → Analysis.resultJson = full structured blob
                                         → Analysis.investmentSignal, .confidence denormalized
```

---

---

## 1. Route & Component Inventory

| Page (route key) | Component file | Status |
|---|---|---|
| `dashboard` | `components/dashboard-page.tsx` | Implemented |
| `upload` | `components/upload-page.tsx` | Implemented |
| `analysis` | `components/analysis-page.tsx` | Implemented |
| `deal-intelligence` | `components/deal-intelligence-page.tsx` | Implemented |
| `risk-signals` | `components/placeholder-page.tsx` | Placeholder |
| `deal-flow` | `components/placeholder-page.tsx` | Placeholder |
| `reports` | `components/placeholder-page.tsx` | Placeholder |
| `saved` | `components/placeholder-page.tsx` | Placeholder |
| `settings` | `components/placeholder-page.tsx` | Placeholder |
| *(global)* | `components/copilot-panel.tsx` | Implemented |
| *(global)* | `components/market-chart.tsx` | Implemented |

---

## 2. Per-Page Data Requirements

### 2.1 Dashboard (`dashboard-page.tsx`)

**Displays**
- 5 KPI metric cards: Startups Reviewed, Analyses Generated, Avg Time Saved, Active Deals, Deals Flagged High Risk
- Recent Analyses table (columns: Startup, Sector, Stage, Status, Investment Signal / AI Score, Last Updated)
- Activity feed (Action, Target, Relative Timestamp)

**User actions**
- Click a table row → navigates to `analysis` page (will need to carry `analysisId`)
- "View all" button → navigates to full analysis list (not yet wired)

**Current data source**
- `demoMetrics`, `demoAnalyses`, `demoActivities` — all from `lib/demo-data.ts`
- "Deals Flagged High Risk" value `7` is hardcoded inline in the JSX

---

### 2.2 Upload Startup (`upload-page.tsx`)

**Displays**
- Three-tab intake form: Pitch Deck (drag-drop), Website URL, Manual Entry
- Shared metadata fields: Startup Name, Industry, Funding Stage, Geography
- Progress stepper (5 steps): Parsing → Structuring → Market Mapping → Risk Detection → Memo Generation

**User actions**
- File drag-and-drop / Browse files button (PDF, PPTX ≤25 MB)
- Website URL text input
- Form field text inputs (name, industry, stage, geography)
- "Generate Analysis" button → starts analysis job → polls for completion → navigates to `analysis`

**Current data source**
- No API calls. `handleAnalyze` calls `setIsAnalyzing(true)` which triggers a client-side timer
  animation. Analysis always "completes" with `demoStartup` data visible on the Analysis page.

---

### 2.3 Analysis Results (`analysis-page.tsx`)

**Displays**
- Header: Company name, AI Score (0-100), Confidence Level (%), Industry badge, Stage badge, Geography, Tagline
- Company Summary cards (×4): Problem Statement, Product Description, Target Customer, Business Model
- Competitor grid (×N cards): Name, Positioning, Pricing Tier, Differentiation blurb
- Feature Comparison table: rows = [Target Customer, Pricing Model, Key Features, Distribution, Market Maturity, Moat Strength]; columns = startup + competitors
- Market Position Map (scatter chart): each company plotted on Market Sophistication (x) vs Innovation Level (y) axes, with bubble size (z)
- Investment Insights (×4 expandable cards): Competitive Advantage, Market Gaps, Differentiation Score (progress bar 0-100), Suggested Positioning
- Risk & Diligence Signals panel:
  - Detected Risks list (expandable, with overall Risk Level badge: Low/Medium/High)
  - Missing Investor Metrics checklist (present/absent flags)
  - Suggested Diligence Questions (ordered list)
- Ask AI inline Q&A box (suggested prompts, free-text input, single-turn response)

**User actions**
- Export / Share / Save / Generate Investment Memo buttons (currently no-ops)
- Expand/collapse InsightCard rows
- Expand/collapse RiskItem rows
- Click a suggested prompt chip or type free-text in "Ask AI" → fires single-turn chat

**Current data source**
- `demoStartup`, `demoCompetitors`, `demoInsights`, `demoRiskSignals` from `lib/demo-data.ts`
- Market chart data is hardcoded in `components/market-chart.tsx` (not from demo-data)
- `startupComparison` (the startup's own column in the feature table) is hardcoded inline in the component

---

### 2.4 Deal Intelligence (`deal-intelligence-page.tsx`)

**Displays**
- Historical Deal table (columns: Startup, Sector, Investment Signal, Risk Level, Outcome)
- 3 summary insight cards (hardcoded text): Pattern Detection, Sector Concentration, Risk Correlation

**User actions**
- Row hover (no click action yet)

**Current data source**
- `demoDealIntelligence` from `lib/demo-data.ts`
- Summary card text is hardcoded strings

---

### 2.5 AI Copilot Chat Panel (`copilot-panel.tsx`)

**Displays**
- Message thread (user bubbles right, assistant bubbles left)
- Typing indicator (3-dot animation)
- Suggested prompt chips (×4)
- Text input + Send button
- Open/Collapse toggle

**User actions**
- Send free-text message
- Click suggested prompt chip (fires as user message)
- Toggle panel open/closed

**Current data source**
- `demoCopilotMessages` (initial assistant messages) from `lib/demo-data.ts`
- `demoSuggestedPrompts` from `lib/demo-data.ts`
- `aiResponses` map (×4 hard-coded responses) defined inside `copilot-panel.tsx`
- All responses use a 1.5 s `setTimeout` to fake streaming

---

### 2.6 Market Intelligence (Placeholder)
No data displayed yet. Shares placeholder with Risk Signals, Deal Flow, Reports, Saved Analyses.

---

## 3. TypeScript Types (extracted / inferred from UI)

```typescript
// ─────────────────────────────────────────────
// Primitive enumerations
// ─────────────────────────────────────────────

type FundingStage =
  | "Pre-seed"
  | "Seed"
  | "Series A"
  | "Series B"
  | "Series C"
  | "Growth"
  | string          // open for unlisted stages

type AnalysisStatus = "Complete" | "In Progress" | "Draft" | "Failed"

type RiskLevel = "Low" | "Medium" | "High"

type DealOutcome =
  | "Under Review"
  | "Passed"
  | "Term Sheet"
  | "Declined"
  | "Pending"

type ChatRole = "user" | "assistant"

type AnalysisJobStep =
  | "Parsing pitch materials"
  | "Structuring company intelligence"
  | "Mapping market landscape"
  | "Detecting risks & gaps"
  | "Generating investment memo"

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

interface DashboardMetrics {
  startupsReviewed: number          // e.g. 142
  analysesGenerated: number         // e.g. 89
  avgTimeSaved: string              // e.g. "4.2 hrs"
  activeDeals: number               // e.g. 23
  flaggedHighRisk: number           // e.g. 7  (currently hardcoded)
  // Trend deltas returned so the UI can render +12% / -2% chips
  trends: {
    startupsReviewed: string        // e.g. "+12%"
    analysesGenerated: string       // e.g. "+8%"
    avgTimeSaved: string            // e.g. "+23%"
    activeDeals: string             // e.g. "-2%"
    flaggedHighRisk: string         // e.g. "+3"
  }
  trendDirections: {
    startupsReviewed: boolean       // true = up
    analysesGenerated: boolean
    avgTimeSaved: boolean
    activeDeals: boolean
    flaggedHighRisk: boolean
  }
}

interface AnalysisSummary {
  id: string                        // UUID — needed for row click navigation
  name: string                      // "FlowAI"
  sector: string                    // "Enterprise SaaS"
  stage: FundingStage               // "Series A"
  status: AnalysisStatus
  aiScore: number                   // 0–100 (0 = not yet scored)
  lastUpdated: string               // relative string OR ISO-8601; UI renders as-is
}

interface Activity {
  id: string
  action: string                    // "AI generated competitor map"
  target: string                    // startup name
  time: string                      // relative string OR ISO-8601
}

interface DashboardResponse {
  metrics: DashboardMetrics
  recentAnalyses: AnalysisSummary[]
  activities: Activity[]
}

// ─────────────────────────────────────────────
// Startup (full analysis)
// ─────────────────────────────────────────────

interface StartupProfile {
  name: string
  tagline: string
  industry: string
  stage: FundingStage
  geography: string
  aiScore: number                   // 0–100
  confidenceLevel: number           // 0–100 (currently hardcoded at 82)
  problem: string
  product: string
  targetCustomer: string
  businessModel: string
}

// For the startup's own column in the Feature Comparison table
interface StartupComparison {
  targetCustomer: string
  pricingModel: string
  keyFeatures: string
  distribution: string
  marketMaturity: string
  moatStrength: string
}

// ─────────────────────────────────────────────
// Competitors
// ─────────────────────────────────────────────

interface Competitor {
  name: string
  positioning: string
  pricingTier: string               // "Freemium" | "Mid-market" | "Enterprise" | "Free / Self-hosted"
  differentiation: string
  targetCustomer: string
  pricingModel: string
  keyFeatures: string
  distribution: string
  marketMaturity: string            // "Mature" | "Growing" | "Early"
  moatStrength: string              // "Strong" | "Moderate" | "Weak"
}

// ─────────────────────────────────────────────
// Market Position Chart
// ─────────────────────────────────────────────

interface MarketPositionPoint {
  name: string                      // company label
  x: number                         // Market Sophistication 0–100
  y: number                         // Innovation Level 0–100
  z: number                         // Bubble size (relative)
  isSubject?: boolean               // true = the startup being analysed (rendered larger)
}

// ─────────────────────────────────────────────
// Investment Insights
// ─────────────────────────────────────────────

interface Insights {
  competitiveAdvantage: string
  marketGaps: string
  differentiationScore: number      // 0–100
  suggestedPositioning: string
}

// ─────────────────────────────────────────────
// Risk & Diligence Signals
// ─────────────────────────────────────────────

interface RiskSignalItem {
  title: string
  detail: string
}

interface MetricCheck {
  label: string
  present: boolean
}

interface RiskSignals {
  riskLevel: RiskLevel
  detectedRisks: RiskSignalItem[]
  missingMetrics: MetricCheck[]
  diligenceQuestions: string[]
}

// ─────────────────────────────────────────────
// Full Analysis Response (Analysis page)
// ─────────────────────────────────────────────

interface AnalysisResult {
  id: string
  status: AnalysisStatus
  createdAt: string                 // ISO-8601
  updatedAt: string
  startup: StartupProfile
  startupComparison: StartupComparison
  competitors: Competitor[]
  marketPosition: MarketPositionPoint[]
  insights: Insights
  riskSignals: RiskSignals
  suggestedPrompts: string[]        // for Analysis-page inline "Ask AI" chips
}

// ─────────────────────────────────────────────
// Analysis Job (upload → polling)
// ─────────────────────────────────────────────

type AnalysisJobStatus = "pending" | "processing" | "complete" | "failed"

interface AnalysisJob {
  jobId: string                     // same as analysisId once complete
  status: AnalysisJobStatus
  currentStep: AnalysisJobStep | null
  stepIndex: number                 // 0-based index into the 5 steps
  totalSteps: number                // 5
  error?: string                    // populated when status = "failed"
}

// ─────────────────────────────────────────────
// Deal Intelligence
// ─────────────────────────────────────────────

interface Deal {
  id: string
  startup: string
  sector: string
  signal: number                    // 0–100
  risk: RiskLevel
  outcome: DealOutcome
}

interface DealPatternInsight {
  title: string                     // e.g. "Pattern Detection"
  body: string                      // AI-generated insight text
}

interface DealIntelligenceResponse {
  deals: Deal[]
  insights: DealPatternInsight[]    // 3 summary cards (currently hardcoded)
}

// ─────────────────────────────────────────────
// Copilot Chat
// ─────────────────────────────────────────────

interface ChatMessage {
  role: ChatRole
  content: string
}

interface ChatRequest {
  analysisId: string | null         // null = general, otherwise scoped to a startup
  messages: ChatMessage[]           // full conversation history
}

// Non-streaming response shape
interface ChatResponse {
  message: ChatMessage
  suggestedPrompts?: string[]       // optional follow-up prompt chips
}

// Streaming: Server-Sent Events — each event is:
// data: {"delta":"partial text","done":false}
// data: {"delta":"","done":true}
interface ChatStreamChunk {
  delta: string
  done: boolean
}

// ─────────────────────────────────────────────
// Upload submission
// ─────────────────────────────────────────────

// Pitch Deck tab: multipart/form-data
// FormData fields:
//   file: File (PDF | PPTX)
//   name: string
//   industry: string
//   stage: string
//   geography: string

// URL tab: application/json
interface SubmitUrlPayload {
  url: string
  name: string
  industry: string
  stage: string
  geography: string
}

// Manual tab: application/json
interface SubmitManualPayload {
  name: string
  industry: string
  stage: string
  geography: string
  problem?: string
  product?: string
  targetCustomer?: string
  businessModel?: string
}

interface SubmitResponse {
  jobId: string                     // poll this to track progress
}
```

---

## 4. Backend API Contract

Base URL: `process.env.NEXT_PUBLIC_API_URL` (e.g. `https://api.analystcopilot.com`) or Next.js API
routes at `/api/*`.

All requests/responses use `Content-Type: application/json` unless noted. Auth header:
`Authorization: Bearer <token>` (scheme TBD).

---

### 4.1 Dashboard

#### `GET /api/dashboard`

Returns all data the Dashboard page needs in a single call.

**Response `200 OK`**
```json
{
  "metrics": {
    "startupsReviewed": 142,
    "analysesGenerated": 89,
    "avgTimeSaved": "4.2 hrs",
    "activeDeals": 23,
    "flaggedHighRisk": 7,
    "trends": {
      "startupsReviewed": "+12%",
      "analysesGenerated": "+8%",
      "avgTimeSaved": "+23%",
      "activeDeals": "-2%",
      "flaggedHighRisk": "+3"
    },
    "trendDirections": {
      "startupsReviewed": true,
      "analysesGenerated": true,
      "avgTimeSaved": true,
      "activeDeals": false,
      "flaggedHighRisk": false
    }
  },
  "recentAnalyses": [
    {
      "id": "uuid",
      "name": "FlowAI",
      "sector": "Enterprise SaaS",
      "stage": "Series A",
      "status": "Complete",
      "aiScore": 87,
      "lastUpdated": "2 hours ago"
    }
  ],
  "activities": [
    {
      "id": "uuid",
      "action": "AI generated competitor map",
      "target": "FlowAI",
      "time": "2 hours ago"
    }
  ]
}
```

TypeScript response type: `DashboardResponse`

---

### 4.2 Analyses List

#### `GET /api/analyses`

Returns the full paginated list of analyses (used by "View all" on the Dashboard and the Saved
Analyses page filter).

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | — | Filter by `Complete`, `In Progress`, `Draft` |
| `saved` | `boolean` | — | `true` = saved/bookmarked only |
| `page` | `number` | `1` | |
| `limit` | `number` | `20` | |

**Response `200 OK`**
```json
{
  "data": [ /* AnalysisSummary[] */ ],
  "total": 89,
  "page": 1,
  "limit": 20
}
```

---

### 4.3 Single Analysis

#### `GET /api/analyses/:id`

Returns the complete analysis used by the Analysis Results page.

**Response `200 OK`** — `AnalysisResult`
```json
{
  "id": "uuid",
  "status": "Complete",
  "createdAt": "2026-02-28T10:00:00Z",
  "updatedAt": "2026-02-28T10:05:00Z",
  "startup": {
    "name": "FlowAI",
    "tagline": "AI workflow automation platform",
    "industry": "Enterprise SaaS",
    "stage": "Series A",
    "geography": "San Francisco, CA",
    "aiScore": 87,
    "confidenceLevel": 82,
    "problem": "...",
    "product": "...",
    "targetCustomer": "...",
    "businessModel": "..."
  },
  "startupComparison": {
    "targetCustomer": "Mid-market operations teams...",
    "pricingModel": "SaaS subscription + usage-based",
    "keyFeatures": "AI workflow learning, auto-optimization, no-code",
    "distribution": "Product-led + enterprise sales",
    "marketMaturity": "Early",
    "moatStrength": "Moderate-High"
  },
  "competitors": [
    {
      "name": "Zapier",
      "positioning": "No-code automation leader",
      "pricingTier": "Freemium",
      "differentiation": "...",
      "targetCustomer": "SMBs and individual users",
      "pricingModel": "Usage-based (tasks/month)",
      "keyFeatures": "Pre-built integrations, Zaps, multi-step workflows",
      "distribution": "Product-led growth, marketplace",
      "marketMaturity": "Mature",
      "moatStrength": "Strong"
    }
  ],
  "marketPosition": [
    { "name": "FlowAI", "x": 35, "y": 90, "z": 400, "isSubject": true },
    { "name": "Zapier",  "x": 80, "y": 45, "z": 350, "isSubject": false }
  ],
  "insights": {
    "competitiveAdvantage": "...",
    "marketGaps": "...",
    "differentiationScore": 78,
    "suggestedPositioning": "..."
  },
  "riskSignals": {
    "riskLevel": "Medium",
    "detectedRisks": [
      { "title": "Unclear go-to-market strategy", "detail": "..." }
    ],
    "missingMetrics": [
      { "label": "CAC not specified", "present": false },
      { "label": "Gross margin documented", "present": true }
    ],
    "diligenceQuestions": [
      "How does customer acquisition scale beyond early adopters?"
    ]
  },
  "suggestedPrompts": [
    "What are the key investment risks?",
    "Is the competitive moat defensible?",
    "What diligence gaps remain?"
  ]
}
```

**Response `404 Not Found`**
```json
{ "error": "Analysis not found" }
```

---

### 4.4 Submit Startup for Analysis

#### `POST /api/analyses` — Pitch Deck upload

`Content-Type: multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `file` | `File` (PDF/PPTX ≤25 MB) | Yes |
| `name` | `string` | No |
| `industry` | `string` | No |
| `stage` | `string` | No |
| `geography` | `string` | No |

**Response `202 Accepted`**
```json
{ "jobId": "uuid" }
```

#### `POST /api/analyses` — Website URL

`Content-Type: application/json` — body: `SubmitUrlPayload`

**Response `202 Accepted`**
```json
{ "jobId": "uuid" }
```

#### `POST /api/analyses` — Manual Entry

`Content-Type: application/json` — body: `SubmitManualPayload`

**Response `202 Accepted`**
```json
{ "jobId": "uuid" }
```

---

### 4.5 Analysis Job Status (Polling)

The UI's `AnalysisLoading` component advances through 5 named steps. The frontend should poll
this endpoint every **1 – 2 s** while `status` is `"pending"` or `"processing"`.

#### `GET /api/analyses/jobs/:jobId`

**Response `200 OK`** — `AnalysisJob`
```json
{
  "jobId": "uuid",
  "status": "processing",
  "currentStep": "Mapping market landscape",
  "stepIndex": 2,
  "totalSteps": 5,
  "error": null
}
```

When `status === "complete"`, `jobId` equals the `analysisId` the UI should navigate to:

```json
{
  "jobId": "uuid",
  "status": "complete",
  "currentStep": null,
  "stepIndex": 5,
  "totalSteps": 5
}
```

When `status === "failed"`:
```json
{
  "jobId": "uuid",
  "status": "failed",
  "currentStep": null,
  "stepIndex": 1,
  "totalSteps": 5,
  "error": "Failed to parse PDF: unsupported format"
}
```

**Step name → index mapping** (must match the UI's `analysisSteps` array):

| stepIndex | currentStep |
|---|---|
| 0 | `"Parsing pitch materials"` |
| 1 | `"Structuring company intelligence"` |
| 2 | `"Mapping market landscape"` |
| 3 | `"Detecting risks & gaps"` |
| 4 | `"Generating investment memo"` |

---

### 4.6 Analysis Actions

#### `POST /api/analyses/:id/save`
Bookmark/un-bookmark an analysis.

**Request body**
```json
{ "saved": true }
```
**Response `200 OK`**
```json
{ "id": "uuid", "saved": true }
```

#### `POST /api/analyses/:id/report`
Trigger investment memo / report generation.

**Response `202 Accepted`**
```json
{ "reportJobId": "uuid", "reportUrl": null }
```

#### `GET /api/analyses/:id/report`
Get generated report download URL.

**Response `200 OK`**
```json
{ "reportUrl": "https://storage.example.com/reports/uuid.pdf", "generatedAt": "2026-02-28T10:10:00Z" }
```

#### `GET /api/analyses/:id/share`
Get a shareable link for the analysis.

**Response `200 OK`**
```json
{ "shareUrl": "https://app.analystcopilot.com/shared/uuid", "expiresAt": "2026-03-07T10:10:00Z" }
```

---

### 4.7 AI Copilot Chat

The Copilot panel is global (not scoped to a page) but should send the current `analysisId` when
one is in context.

#### Option A — Non-streaming (simple)

#### `POST /api/chat`

**Request body** — `ChatRequest`
```json
{
  "analysisId": "uuid-or-null",
  "messages": [
    { "role": "user", "content": "What are the biggest risks?" }
  ]
}
```

**Response `200 OK`** — `ChatResponse`
```json
{
  "message": {
    "role": "assistant",
    "content": "Key investment risks: (1) Enterprise sales cycle..."
  },
  "suggestedPrompts": [
    "Is this investment defensible?",
    "Compare to market leaders"
  ]
}
```

---

#### Option B — Streaming (recommended for better UX)

#### `POST /api/chat/stream`

Same request body as Option A.

`Content-Type: text/event-stream` response (Server-Sent Events).

Each event:
```
data: {"delta":"Key investment","done":false}
data: {"delta":" risks: (1)","done":false}
data: {"delta":" Enterprise sales cycle...","done":false}
data: {"delta":"","done":true,"suggestedPrompts":["Is this investment defensible?"]}
```

The frontend replaces the `setTimeout`/`setIsTyping` pattern with streaming token appending.
This is the **recommended** approach — the UI already shows a typing indicator that is a
natural match for streaming.

---

### 4.8 Copilot Context / Suggested Prompts

#### `GET /api/chat/prompts?analysisId=:id`

Returns context-appropriate suggested prompts (currently hardcoded in `lib/demo-data.ts`).

**Response `200 OK`**
```json
{
  "prompts": [
    "What are the biggest risks?",
    "Is this investment defensible?",
    "Compare to market leaders",
    "What diligence questions should we ask?"
  ]
}
```

---

### 4.9 Deal Intelligence

#### `GET /api/deal-intelligence`

**Query params**

| Param | Type | Default |
|---|---|---|
| `page` | `number` | `1` |
| `limit` | `number` | `50` |

**Response `200 OK`** — `DealIntelligenceResponse`
```json
{
  "deals": [
    {
      "id": "uuid",
      "startup": "FlowAI",
      "sector": "Enterprise SaaS",
      "signal": 87,
      "risk": "Medium",
      "outcome": "Under Review"
    }
  ],
  "insights": [
    {
      "title": "Pattern Detection",
      "body": "Enterprise SaaS deals with investment signals above 80 have a 73% success rate..."
    },
    {
      "title": "Sector Concentration",
      "body": "38% of reviewed deals are in Enterprise SaaS..."
    },
    {
      "title": "Risk Correlation",
      "body": "Deals flagged 'High Risk' that proceeded to term sheet had 2.1x longer diligence cycles..."
    }
  ]
}
```

---

### 4.10 Saved Analyses

#### `GET /api/analyses?saved=true`

Reuses the analyses list endpoint (§4.2) with `saved=true` filter. No new endpoint needed.

---

### 4.11 Reports (future page)

#### `GET /api/reports`

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "uuid",
      "analysisId": "uuid",
      "startupName": "FlowAI",
      "generatedAt": "2026-02-28T10:10:00Z",
      "reportUrl": "https://storage.example.com/reports/uuid.pdf"
    }
  ]
}
```

---

### 4.12 Risk Signals (future page)

#### `GET /api/risk-signals`

**Query params:** `riskLevel` (Low/Medium/High), `page`, `limit`

**Response `200 OK`**
```json
{
  "data": [
    {
      "analysisId": "uuid",
      "startupName": "FlowAI",
      "riskLevel": "Medium",
      "topRisk": "Unclear go-to-market strategy",
      "flaggedAt": "2026-02-28T10:00:00Z"
    }
  ],
  "total": 7
}
```

---

## 5. Error Response Shape (all endpoints)

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

| HTTP | When |
|---|---|
| `400` | Invalid request payload / validation failure |
| `401` | Missing or invalid auth token |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `413` | File upload exceeds 25 MB |
| `422` | Unprocessable entity (e.g. unsupported file format) |
| `429` | Rate limited |
| `500` | Unexpected server error |

---

## 6. Frontend Files That Need Edits to Swap Mock Data for API Calls

The following files import from `lib/demo-data.ts` or use hardcoded values and must be updated
to fetch from the backend API instead.

### Priority 1 — Core data consumers

| File | Mock imported | API endpoint to call |
|---|---|---|
| `components/dashboard-page.tsx` | `demoMetrics`, `demoAnalyses`, `demoActivities`; hardcoded `7` for flaggedHighRisk | `GET /api/dashboard` |
| `components/analysis-page.tsx` | `demoStartup`, `demoCompetitors`, `demoInsights`, `demoRiskSignals`; hardcoded `startupComparison`, `82` confidence | `GET /api/analyses/:id` |
| `components/deal-intelligence-page.tsx` | `demoDealIntelligence`; hardcoded insight card strings | `GET /api/deal-intelligence` |
| `components/copilot-panel.tsx` | `demoCopilotMessages`, `demoSuggestedPrompts`; `aiResponses` map; `setTimeout` fake stream | `POST /api/chat/stream` (streaming) or `POST /api/chat`; `GET /api/chat/prompts` |
| `components/market-chart.tsx` | hardcoded `data` array (5 points) | `GET /api/analyses/:id` → `marketPosition[]` field |

### Priority 2 — Upload / job flow

| File | Change needed | API endpoint |
|---|---|---|
| `components/upload-page.tsx` | Replace `handleAnalyze` timer simulation with real API call + polling loop | `POST /api/analyses`, `GET /api/analyses/jobs/:jobId` |
| `lib/app-context.tsx` | Add `analysisId` to context state so the selected analysis ID is globally available | n/a (state change only) |

### Priority 3 — New data service layer (create, don't modify existing files)

| New file to create | Purpose |
|---|---|
| `lib/api.ts` | Typed fetch wrappers for every endpoint (handles auth header, base URL, error parsing) |
| `lib/hooks/use-dashboard.ts` | `useDashboard()` — SWR or React Query hook for `GET /api/dashboard` |
| `lib/hooks/use-analysis.ts` | `useAnalysis(id)` — hook for `GET /api/analyses/:id` |
| `lib/hooks/use-analysis-job.ts` | `useAnalysisJob(jobId)` — polling hook for `GET /api/analyses/jobs/:jobId` |
| `lib/hooks/use-deal-intelligence.ts` | `useDealIntelligence()` — hook for `GET /api/deal-intelligence` |

### Priority 4 — Placeholder pages (implement when backend is ready)

| File | Page | API endpoint |
|---|---|---|
| *(new)* `components/risk-signals-page.tsx` | Risk Signals | `GET /api/risk-signals` |
| *(new)* `components/deal-flow-page.tsx` | Deal Flow | `GET /api/analyses?status=In Progress` |
| *(new)* `components/reports-page.tsx` | Reports | `GET /api/reports` |
| *(new)* `components/saved-page.tsx` | Saved Analyses | `GET /api/analyses?saved=true` |

---

## 7. Notes & Decisions

1. **Single-page analysis context** — Currently the `analysis` page always shows `demoStartup`
   (FlowAI). After the backend integration, `lib/app-context.tsx` must store a `currentAnalysisId`
   string so `AnalysisPage` knows which `GET /api/analyses/:id` to call. The dashboard table's
   `onClick` must set this ID before navigating.

2. **Relative timestamps** — The UI renders timestamps as strings (e.g. `"2 hours ago"`). The
   backend can return ISO-8601 and let the frontend format with `date-fns/formatDistanceToNow`,
   OR return pre-formatted strings. ISO-8601 is preferred for correctness.

3. **Streaming chat** — The copilot panel's current `isTyping` state maps cleanly to a streaming
   response. Replace the `setTimeout` with a `ReadableStream` reader that appends `delta` chunks
   to the last assistant message in real-time. No UI component structure change is needed — just
   the data source changes.

4. **Market chart data** — The chart component (`market-chart.tsx`) has its own local `data`
   const. This should be replaced with props sourced from `AnalysisResult.marketPosition[]`.

5. **File upload** — The drag-and-drop area currently only sets `isDragging` state and ignores
   the dropped file. The `handleDrop` handler must capture `e.dataTransfer.files[0]` and pass it
   to `POST /api/analyses` as `multipart/form-data`.

6. **Auth** — No auth mechanism exists in the frontend yet. A global fetch wrapper in `lib/api.ts`
   should attach the bearer token from session/cookie before any real API calls go out.

7. **`demoCopilotMessages`** — These two initial assistant messages are context-specific to FlowAI.
   The backend `GET /api/chat/prompts?analysisId=:id` (or the first call to `POST /api/chat`)
   should seed the conversation with context-appropriate opening messages.

8. **Deal Intelligence insight cards** — The three summary cards currently show hardcoded strings.
   The backend should compute and return these via `DealIntelligenceResponse.insights[]`.
