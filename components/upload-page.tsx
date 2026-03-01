"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Upload,
  Globe,
  PenLine,
  FileUp,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { upload } from "@vercel/blob/client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import { submitAnalysis, fetchAnalysisJob } from "@/lib/api"
import { cn } from "@/lib/utils"

const analysisSteps = [
  "Parsing pitch materials",
  "Structuring company intelligence",
  "Mapping market landscape",
  "Detecting risks & gaps",
  "Generating investment memo",
]

function AnalysisLoading({
  stepIndex,
  currentStep,
}: {
  stepIndex: number
  currentStep: string | null
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
      <div>
        <h3 className="text-center text-lg font-semibold text-foreground">
          Analyzing Startup
        </h3>
        <p className="text-center text-sm text-muted-foreground">
          AI is processing your submission…
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {analysisSteps.map((step, i) => {
          const isDone = i < stepIndex
          const isCurrent = step === currentStep || i === stepIndex
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all duration-300",
                isDone && "text-success",
                isCurrent && "text-primary font-medium bg-primary/5",
                !isDone && !isCurrent && "text-muted-foreground"
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-border shrink-0" />
              )}
              {step}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function UploadPage() {
  const { setCurrentPage, isAnalyzing, setIsAnalyzing, setAnalysisComplete, setCurrentAnalysisId } =
    useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    stage: "",
    geography: "",
    url: "",
  })
  const [activeTab, setActiveTab] = useState("upload")

  // ── Polling loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return

    let stopped = false
    const poll = async () => {
      while (!stopped) {
        await new Promise((r) => setTimeout(r, 1500))
        if (stopped) break
        try {
          const job = await fetchAnalysisJob(jobId)
          setStepIndex(job.stepIndex)
          setCurrentStep(job.currentStep)

          if (job.status === "complete") {
            setIsAnalyzing(false)
            setAnalysisComplete(true)
            setCurrentAnalysisId(job.analysisId)
            setCurrentPage("analysis")
            return
          }
          if (job.status === "failed") {
            setIsAnalyzing(false)
            setError(job.error ?? "Analysis failed. Please try again.")
            return
          }
        } catch (err) {
          console.error("[poll]", err)
        }
      }
    }
    poll()
    return () => { stopped = true }
  }, [jobId, setIsAnalyzing, setAnalysisComplete, setCurrentAnalysisId, setCurrentPage])

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }, [])

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    setError(null)
    setIsAnalyzing(true)
    setStepIndex(0)
    setCurrentStep(analysisSteps[0])

    try {
      let result: { jobId: string; analysisId: string }

      if (activeTab === "upload" && selectedFile) {
        // 1. Direct-to-Blob upload (PDF bytes never touch API route)
        const blob = await upload(selectedFile.name, selectedFile, {
          access: "public",
          handleUploadUrl: "/api/uploads",
        })
        // 2. Submit analysis with blob URL
        result = await submitAnalysis({
          kind: "pdf",
          pdfUrl: blob.url,
          name: formData.name || selectedFile.name.replace(/\.[^.]+$/, ""),
          industry: formData.industry,
          stage: formData.stage,
          geography: formData.geography,
        })
      } else if (activeTab === "url" && formData.url) {
        result = await submitAnalysis({
          kind: "url",
          url: formData.url,
          name: formData.name,
          industry: formData.industry,
          stage: formData.stage,
          geography: formData.geography,
        })
      } else {
        result = await submitAnalysis({
          kind: "manual",
          name: formData.name,
          industry: formData.industry,
          stage: formData.stage,
          geography: formData.geography,
        })
      }

      setJobId(result.jobId)
    } catch (err) {
      setIsAnalyzing(false)
      setError((err as Error).message ?? "Failed to submit. Please try again.")
    }
  }, [activeTab, selectedFile, formData, setIsAnalyzing])

  if (isAnalyzing) {
    return <AnalysisLoading stepIndex={stepIndex} currentStep={currentStep} />
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Header */}
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Upload Startup
        </h2>
        <p className="text-sm text-muted-foreground">
          Add a new startup to your analysis pipeline.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-2xl rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Upload Card */}
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6">
        <Tabs defaultValue="upload" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upload" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Pitch Deck
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Website URL
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-success/50 bg-success/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setSelectedFile(file)
                }}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileUp className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                {selectedFile ? (
                  <>
                    <p className="text-sm font-medium text-card-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB — click to change
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-card-foreground">
                      Drag and drop your pitch deck
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, PPTX up to 25MB</p>
                  </>
                )}
              </div>
              {!selectedFile && (
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  Browse files
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We will crawl the website and extract relevant company information automatically.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <p className="mb-4 text-xs text-muted-foreground">
              Provide key details about the startup for manual analysis.
            </p>
          </TabsContent>
        </Tabs>

        {/* Shared Form Fields */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Startup Name</Label>
            <Input
              id="name"
              placeholder="e.g. FlowAI"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g. Enterprise SaaS"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stage">Funding Stage</Label>
            <Input
              id="stage"
              placeholder="e.g. Series A"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="geography">Geography</Label>
            <Input
              id="geography"
              placeholder="e.g. San Francisco, CA"
              value={formData.geography}
              onChange={(e) => setFormData({ ...formData, geography: e.target.value })}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleAnalyze}
            disabled={
              // Upload tab: need at least a file or a name (name alone = manual fallback)
              (activeTab === "upload" && !selectedFile && !formData.name.trim()) ||
              // URL tab: URL is required; name is derived from domain if blank
              (activeTab === "url" && !formData.url.trim()) ||
              // Manual tab: name is always required
              (activeTab === "manual" && !formData.name.trim())
            }
            className="gap-2"
          >
            Generate Analysis
          </Button>
        </div>
      </div>
    </div>
  )
}
