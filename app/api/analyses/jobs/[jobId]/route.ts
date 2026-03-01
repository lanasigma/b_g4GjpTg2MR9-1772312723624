import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const STEP_LABELS = [
  "Parsing pitch materials",
  "Structuring company intelligence",
  "Mapping market landscape",
  "Detecting risks & gaps",
  "Generating investment memo",
] as const

// ─── GET /api/analyses/jobs/:jobId ────────────────────────────────────────────
/**
 * Poll this endpoint every 1-2s while status is "pending" or "processing".
 *
 * When status === "complete", jobId === analysisId — navigate to the analysis.
 *
 * Response shape (AnalysisJob):
 * {
 *   jobId: string
 *   analysisId: string
 *   status: "pending" | "processing" | "complete" | "failed"
 *   currentStep: string | null
 *   stepIndex: number   (0-based, matches UI analysisSteps array)
 *   totalSteps: number  (always 5)
 *   progress: number    (0-100)
 *   error?: string
 * }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      analysisId: true,
      status: true,
      step: true,
      progress: true,
      error: true,
    },
  })

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  const stepIndex = job.step ? STEP_LABELS.indexOf(job.step as (typeof STEP_LABELS)[number]) : -1

  return NextResponse.json({
    jobId: job.id,
    analysisId: job.analysisId,
    status: mapJobStatus(job.status),
    currentStep: job.step ?? null,
    stepIndex: stepIndex === -1 ? (job.status === "DONE" ? 5 : 0) : stepIndex,
    totalSteps: STEP_LABELS.length,
    progress: job.progress,
    error: job.error ?? undefined,
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapJobStatus(status: string): "pending" | "processing" | "complete" | "failed" {
  switch (status) {
    case "DONE":
      return "complete"
    case "PROCESSING":
      return "processing"
    case "FAILED":
      return "failed"
    default:
      return "pending"
  }
}
