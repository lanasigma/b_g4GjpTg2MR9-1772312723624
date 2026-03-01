import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export async function GET() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const { models } = await genAI.listModels()
  const names = models.map((m) => m.name)
  return NextResponse.json({ models: names })
}
