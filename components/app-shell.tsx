"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { CopilotPanel } from "@/components/copilot-panel"
import { DashboardPage } from "@/components/dashboard-page"
import { UploadPage } from "@/components/upload-page"
import { AnalysisPage } from "@/components/analysis-page"
import { DealIntelligencePage } from "@/components/deal-intelligence-page"
import { PlaceholderPage } from "@/components/placeholder-page"
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
      case "risk-signals":
        return <PlaceholderPage title="Risk Signals" description="Centralized view of flagged risks across your entire portfolio pipeline." />
      case "deal-flow":
        return <PlaceholderPage title="Deal Flow" description="Track and manage your investment pipeline." />
      case "reports":
        return <PlaceholderPage title="Reports" description="View and generate detailed reports." />
      case "saved":
        return <PlaceholderPage title="Saved Analyses" description="Access your bookmarked startup analyses." />
      case "settings":
        return <PlaceholderPage title="Settings" description="Manage your workspace preferences." />
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
