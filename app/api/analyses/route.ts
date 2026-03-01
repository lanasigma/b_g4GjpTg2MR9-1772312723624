import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { inngest } from "@/inngest/client"

// ─── Step labels that map to stepIndex 0-4 ───────────────────────────────────
const STEP_LABELS = [
  "Parsing pitch materials",
  "Structuring company intelligence",
  "Mapping market landscape",
  "Detecting risks & gaps",
  "Generating investment memo",
] as const

// ─── GET /api/analyses ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)))
  const savedOnly = searchParams.get("saved") === "true"
  const skip = (page - 1) * limit

  const where = savedOnly ? { saved: true } : {}

  const [analyses, totalCount] = await Promise.all([
    prisma.analysis.findMany({
      where,
      orderBy: { lastUpdated: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        industry: true,
        stage: true,
        status: true,
        investmentSignal: true,
        saved: true,
        lastUpdated: true,
        createdAt: true,
      },
    }),
    prisma.analysis.count({ where }),
  ])

  // Aggregate stats for the dashboard (computed from all rows, not just this page)
  const allStatuses = await prisma.analysis.groupBy({
    by: ["status"],
    _count: { id: true },
  })

  const statusCounts = Object.fromEntries(
    allStatuses.map((s) => [s.status, s._count.id])
  )

  // "High risk" proxy: investmentSignal < 60 on completed analyses
  const highRiskCount = await prisma.analysis.count({
    where: { status: "DONE", investmentSignal: { lt: 60 } },
  })

  const stats = {
    total: totalCount,
    active: (statusCounts["PENDING"] ?? 0) + (statusCounts["PROCESSING"] ?? 0),
    complete: statusCounts["DONE"] ?? 0,
    highRisk: highRiskCount,
    // avgTimeSaved: no timing data yet — placeholder
    avgTimeSaved: "4.2 hrs",
  }

  const data = analyses.map((a) => ({
    id: a.id,
    name: a.name,
    sector: a.industry,
    stage: a.stage,
    status: mapStatus(a.status),
    aiScore: a.investmentSignal ?? 0,
    saved: a.saved,
    lastUpdated: a.lastUpdated.toISOString(),
    createdAt: a.createdAt.toISOString(),
  }))

  return NextResponse.json({ data, stats, totalCount, page, limit })
}

// ─── POST /api/analyses ───────────────────────────────────────────────────────
/**
 * Accepts three submission flavours (discriminated by `kind` field):
 *
 *  { kind: "pdf",     pdfUrl, name, industry, stage, geography }
 *  { kind: "url",     url,    name, industry, stage, geography }
 *  { kind: "manual",  name, industry, stage, geography,
 *                     problem?, product?, targetCustomer?, businessModel? }
 *
 * Returns { jobId, analysisId } — the caller must poll
 * GET /api/analyses/jobs/:jobId for progress.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { kind = "manual", name, industry = "", stage = "", geography = "" } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  // Create the Analysis record
  const analysis = await prisma.analysis.create({
    data: { name: name.trim(), industry, stage, geography, status: "PENDING" },
  })

  // Create the Source record
  if (kind === "pdf") {
    if (!body.pdfUrl) {
      await prisma.analysis.delete({ where: { id: analysis.id } })
      return NextResponse.json({ error: "pdfUrl is required for kind=pdf" }, { status: 400 })
    }
    await prisma.source.create({
      data: { analysisId: analysis.id, kind: "pdf", url: body.pdfUrl },
    })
  } else if (kind === "url") {
    if (!body.url) {
      await prisma.analysis.delete({ where: { id: analysis.id } })
      return NextResponse.json({ error: "url is required for kind=url" }, { status: 400 })
    }
    await prisma.source.create({
      data: { analysisId: analysis.id, kind: "website", url: body.url },
    })
  } else {
    // manual — combine provided fields into source text
    const manualText = [
      name && `Company: ${name}`,
      industry && `Industry: ${industry}`,
      stage && `Stage: ${stage}`,
      geography && `Geography: ${geography}`,
      body.problem && `Problem: ${body.problem}`,
      body.product && `Product: ${body.product}`,
      body.targetCustomer && `Target Customer: ${body.targetCustomer}`,
      body.businessModel && `Business Model: ${body.businessModel}`,
    ]
      .filter(Boolean)
      .join("\n")

    await prisma.source.create({
      data: { analysisId: analysis.id, kind: "manual", text: manualText },
    })
  }

  // Create the Job record
  const job = await prisma.job.create({
    data: {
      analysisId: analysis.id,
      status: "PENDING",
      step: STEP_LABELS[0],
      progress: 0,
    },
  })

  // Enqueue the Inngest background function
  await inngest.send({
    name: "analyst-copilot/analysis.started",
    data: { analysisId: analysis.id, jobId: job.id },
  })

  return NextResponse.json(
    { jobId: job.id, analysisId: analysis.id },
    { status: 202 }
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map DB status strings to UI-facing display labels */
function mapStatus(status: string): string {
  switch (status) {
    case "DONE":
      return "Complete"
    case "PROCESSING":
    case "PENDING":
      return "In Progress"
    case "FAILED":
      return "Failed"
    default:
      return "Draft"
  }
}
