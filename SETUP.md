# Analyst Copilot — Setup Guide

## Prerequisites

- Node.js ≥ 20
- pnpm / npm / yarn
- A free [Vercel account](https://vercel.com) (for Blob storage)
- An [Anthropic API key](https://console.anthropic.com)
- A free [Inngest account](https://app.inngest.com) (or run dev server locally)

---

## 1. Install dependencies

```bash
npm install @anthropic-ai/sdk @vercel/blob inngest pdf-parse
npm install -D prisma @types/pdf-parse
npm install @prisma/client
```

Full list of new packages added:

| Package | Purpose |
|---|---|
| `@anthropic-ai/sdk` | LLM calls (analysis + chat) |
| `@vercel/blob` | Client-upload token handler + server downloads |
| `inngest` | Background job queue (5-step pipeline) |
| `pdf-parse` | PDF text extraction inside Inngest function |
| `prisma` | ORM CLI (dev dependency) |
| `@prisma/client` | Runtime DB client |
| `@types/pdf-parse` | TypeScript types for pdf-parse |

---

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Where to get it |
|---|---|
| `DATABASE_PROVIDER` | `"sqlite"` locally, `"postgresql"` on Vercel |
| `DATABASE_URL` | `"file:./dev.db"` locally; Postgres URL from Vercel Postgres / Neon on production |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard → Storage → Blob → your store → `.env.local` button |
| `INNGEST_EVENT_KEY` | Leave empty locally (Inngest dev server handles this) |
| `INNGEST_SIGNING_KEY` | Leave empty locally |

---

## 3. Initialize Prisma

```bash
# Generate the Prisma Client
npx prisma generate

# Create the SQLite database and run migrations
npx prisma db push
```

> **Production:** Run `npx prisma migrate deploy` instead of `db push`.

To inspect the database locally:

```bash
npx prisma studio
```

---

## 4. Run in development

You need **two terminal tabs** — Next.js and the Inngest dev server.

**Tab 1 — Next.js:**
```bash
npm run dev
# App runs at http://localhost:3000
```

**Tab 2 — Inngest dev server:**
```bash
npx inngest-cli@latest dev
# Connects to http://localhost:3000/api/inngest
# Dev dashboard at http://localhost:8288
```

The Inngest dev server intercepts events sent by `inngest.send(...)`, executes
the `analysisPipeline` function locally, and lets you inspect step-by-step logs
at `http://localhost:8288`.

---

## 5. Vercel Blob (local setup)

When running locally without a Blob store, the PDF upload flow will fail because
`BLOB_READ_WRITE_TOKEN` is not set. Two options:

**Option A** (recommended): Create a Vercel Blob store and copy the token to `.env.local`.
1. Go to [vercel.com/storage/blob](https://vercel.com/storage/blob)
2. Create a new store
3. Copy the `BLOB_READ_WRITE_TOKEN` from the store's environment variables panel

**Option B** (dev shortcut): Skip the PDF upload tab and use **Manual Entry** or **Website URL**
during local development — no Blob token required for those submission paths.

---

## 6. Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel
```

**Vercel project settings to configure:**

1. **Environment Variables** — add all variables from `.env.example`:
   - `DATABASE_PROVIDER=postgresql`
   - `DATABASE_URL` from your Postgres integration (Vercel Postgres or Neon)
   - `ANTHROPIC_API_KEY`
   - `BLOB_READ_WRITE_TOKEN` (auto-set if you link a Blob store)
   - `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` (auto-set by Inngest integration)

2. **Vercel Blob** — add a Blob store in the Storage tab of your project.

3. **Inngest** — install the [Inngest Vercel integration](https://vercel.com/integrations/inngest).
   This auto-sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.

4. **Database migration** — after first deploy, run:
   ```bash
   npx prisma migrate deploy
   ```
   Or add it to the Vercel build command:
   ```
   prisma migrate deploy && next build
   ```

---

## 7. Architecture overview

```
Browser
  │
  ├── POST /api/uploads          → Vercel Blob client-upload token
  │     (PDF bytes go directly to Blob, never through API route)
  │
  ├── POST /api/analyses         → Creates Analysis + Job records, fires Inngest event
  │
  ├── GET  /api/analyses/jobs/:id → Poll job status (stepIndex 0-5, progress 0-100)
  │
  ├── GET  /api/analyses/:id     → Full analysis result (startup, competitors, insights, risks)
  │
  ├── GET  /api/analyses         → Paginated list + dashboard stats
  │
  ├── POST /api/chat/stream      → SSE streaming chat (Anthropic, grounded in analysis context)
  └── POST /api/chat             → Non-streaming chat fallback

Inngest (background, triggered by analyst-copilot/analysis.started event)
  │
  └── analysisPipeline function (5 steps)
        Step 1: Parsing pitch materials    → downloads PDF from Blob, extracts text
        Step 2: Structuring company intel  → progress marker
        Step 3: Mapping market landscape   → progress marker
        Step 4: Detecting risks & gaps     → progress marker
        Step 5: Generating investment memo → LLM call (claude-sonnet-4-6), saves resultJson
```

---

## 8. Key file locations

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Database schema (Analysis, Job, Source, ChatMessage) |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/api.ts` | Client-side typed fetch wrappers |
| `lib/chat-helpers.ts` | System prompt builder + message persistence |
| `inngest/client.ts` | Inngest client instance |
| `inngest/functions/analysis-pipeline.ts` | 5-step background analysis function |
| `app/api/uploads/route.ts` | Vercel Blob upload token handler |
| `app/api/analyses/route.ts` | List analyses + submit new analysis |
| `app/api/analyses/[id]/route.ts` | Get single analysis result |
| `app/api/analyses/jobs/[jobId]/route.ts` | Poll job status |
| `app/api/chat/route.ts` | Non-streaming chat |
| `app/api/chat/stream/route.ts` | Streaming SSE chat |
| `app/api/inngest/route.ts` | Inngest webhook endpoint |

---

## 9. Troubleshooting

**`pdf-parse` import error during build**
→ Ensure `serverExternalPackages: ["pdf-parse"]` is in `next.config.mjs` (already set).

**Inngest function not triggering**
→ Confirm the Inngest dev server (`npx inngest-cli dev`) is running and pointing to `http://localhost:3000/api/inngest`.

**Vercel Blob upload fails locally**
→ Set `BLOB_READ_WRITE_TOKEN` in `.env.local` from your Vercel Blob store, or use Manual Entry/URL tabs instead.

**Analysis stuck in "In Progress"**
→ Check Inngest dev dashboard at `http://localhost:8288` for function error logs.

**Prisma `@prisma/client` not found**
→ Run `npx prisma generate` after installing dependencies.
