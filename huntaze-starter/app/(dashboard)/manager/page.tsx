import PageHeader from "@/components/PageHeader"
import { CinAIChat } from "@/components/dashboard/CinAIChat"

export default function ManagerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager AI (CIN)"
        description="Command center for human-in-the-loop orchestration, whale tracking, and scheduling."
      />
      <CinAIChat />
    </div>
  )
}
