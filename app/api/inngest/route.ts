import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { analysisPipeline } from "@/inngest/functions/analysis-pipeline"

// This route is the Inngest webhook endpoint.
// The Inngest dev server (npx inngest-cli dev) connects here during development.
// On Vercel, the Inngest platform calls this endpoint to execute functions.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analysisPipeline],
})
