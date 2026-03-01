"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { CopilotPanel } from "@/components/copilot-panel"
import { DashboardPage } from "@/components/dashboard-page"
import { UploadPage } from "@/components/upload-page"
import { AnalysisPage } from "@/components/analysis-page"
import { DealIntelligencePage } from "@/components/deal-intelligence-page"
import { DealFlowPage } from "@/components/deal-flow-page"
import { RiskSignalsPage } from "@/components/risk-signals-page"
import { ReportsPage } from "@/components/reports-page"
import { SavedPage } from "@/components/saved-page"
import { SettingsPage } from "@/components/settings-page"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useApp } from "@/lib/app-context"

export function AppShell() {
  const { currentPage } = useApp()

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />
      case "upload":
        return <UploadPage />
      case "analysis":
        return <AnalysisPage />
      case "deal-intelligence":
        return <DealIntelligencePage />
      case "deal-flow":
        return <DealFlowPage />
      case "risk-signals":
        return <RiskSignalsPage />
      case "reports":
        return <ReportsPage />
      case "saved":
        return <SavedPage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <ScrollArea className="flex-1 overflow-y-auto">
        <main className="min-h-screen">{renderPage()}</main>
      </ScrollArea>
      <CopilotPanel />
    </div>
  )
}
