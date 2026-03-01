"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Page =
  | "dashboard"
  | "upload"
  | "analysis"
  | "deal-flow"
  | "reports"
  | "saved"
  | "settings"
  | "risk-signals"
  | "deal-intelligence"

interface AppContextType {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  copilotOpen: boolean
  setCopilotOpen: (open: boolean) => void
  isAnalyzing: boolean
  setIsAnalyzing: (loading: boolean) => void
  analysisComplete: boolean
  setAnalysisComplete: (complete: boolean) => void
  // ID of the analysis currently being viewed / just completed
  currentAnalysisId: string | null
  setCurrentAnalysisId: (id: string | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")
  const [copilotOpen, setCopilotOpen] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        copilotOpen,
        setCopilotOpen,
        isAnalyzing,
        setIsAnalyzing,
        analysisComplete,
        setAnalysisComplete,
        currentAnalysisId,
        setCurrentAnalysisId,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
