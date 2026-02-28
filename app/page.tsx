import { AppProvider } from "@/lib/app-context"
import { AppShell } from "@/components/app-shell"

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
