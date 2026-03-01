import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

/**
 * POST /api/uploads
 *
 * Issues a client-upload token so the browser can PUT the file directly to
 * Vercel Blob — no PDF bytes flow through this API route.
 *
 * Client-side flow (upload-page.tsx):
 *   import { upload } from "@vercel/blob/client"
 *   const blob = await upload(filename, file, {
 *     access: "public",
 *     handleUploadUrl: "/api/uploads",
 *   })
 *   // blob.url → pass as pdfUrl to POST /api/analyses
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => ({
        allowedContentTypes: [
          "application/pdf",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
        maximumSizeInBytes: 25 * 1024 * 1024, // 25 MB
      }),
      onUploadCompleted: async ({ blob }) => {
        // Optional: log or store the blob URL here if needed
        console.log("[uploads] completed:", blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    )
  }
}
