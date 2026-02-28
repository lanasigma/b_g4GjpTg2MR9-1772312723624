"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Upload,
  Globe,
  PenLine,
  FileUp,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import { cn } from "@/lib/utils"

const analysisSteps = [
  "Parsing pitch materials",
  "Structuring company intelligence",
  "Mapping market landscape",
  "Detecting risks & gaps",
  "Generating investment memo",
]

function AnalysisLoading({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (currentStep < analysisSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((s) => s + 1)
      }, 1200)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(onComplete, 800)
      return () => clearTimeout(timer)
    }
  }, [currentStep, onComplete])

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
          AI is processing your submission...
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {analysisSteps.map((step, i) => {
          const isDone = i < currentStep
          const isCurrent = i === currentStep
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
  const { setCurrentPage, isAnalyzing, setIsAnalyzing, setAnalysisComplete } =
    useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    stage: "",
    geography: "",
    url: "",
  })

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleAnalyze = useCallback(() => {
    setIsAnalyzing(true)
  }, [setIsAnalyzing])

  const handleAnalysisComplete = useCallback(() => {
    setIsAnalyzing(false)
    setAnalysisComplete(true)
    setCurrentPage("analysis")
  }, [setIsAnalyzing, setAnalysisComplete, setCurrentPage])

  if (isAnalyzing) {
    return <AnalysisLoading onComplete={handleAnalysisComplete} />
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

      {/* Upload Card */}
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6">
        <Tabs defaultValue="upload">
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
              className={cn(
                "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileUp className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-card-foreground">
                  Drag and drop your pitch deck
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, PPTX up to 25MB
                </p>
              </div>
              <Button variant="outline" size="sm">
                Browse files
              </Button>
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
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We will crawl the website and extract relevant company
                information automatically.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <p className="mb-4 text-xs text-muted-foreground">
              Provide key details about the startup for manual analysis.
            </p>
          </TabsContent>
        </Tabs>

        {/* Form Fields */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Startup Name</Label>
            <Input
              id="name"
              placeholder="e.g. FlowAI"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g. Enterprise SaaS"
              value={formData.industry}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stage">Funding Stage</Label>
            <Input
              id="stage"
              placeholder="e.g. Series A"
              value={formData.stage}
              onChange={(e) =>
                setFormData({ ...formData, stage: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="geography">Geography</Label>
            <Input
              id="geography"
              placeholder="e.g. San Francisco, CA"
              value={formData.geography}
              onChange={(e) =>
                setFormData({ ...formData, geography: e.target.value })
              }
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleAnalyze} className="gap-2">
            <Loader2 className="h-4 w-4 hidden" />
            Generate Analysis
          </Button>
        </div>
      </div>
    </div>
  )
}
