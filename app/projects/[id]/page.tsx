import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getProjectDetail } from "@/app/actions/projects"
import { AppShell } from "@/components/app-shell"
import { ProjectDetailView } from "@/components/project-detail-view"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")
  const { id } = await params
  const detail = await getProjectDetail(id)
  if (!detail) notFound()
  return (
    <AppShell userName={session.user.name}>
      <ProjectDetailView
        project={{
          id: detail.project.id,
          title: detail.project.title,
          status: detail.project.status,
          performanceDate: detail.project.performanceDate,
          performerCount: detail.project.performerCount,
          programType: detail.project.programType,
          theme: detail.project.theme,
        }}
        stageInput={(detail.stageInput?.data as Record<string, unknown>) ?? null}
        snapshots={detail.snapshots.map((s) => ({
          id: s.id,
          version: s.version,
          mode: s.mode,
          costumePlan: s.costumePlan as Record<string, unknown>,
          risks: s.risks as unknown[],
          reverseSchedule: s.reverseSchedule as unknown[],
          platformSearch: s.platformSearch as unknown[],
          providerStatus: s.providerStatus,
          createdAt: s.createdAt.toISOString(),
        }))}
        confirmation={
          detail.confirmation ? { status: detail.confirmation.status, note: detail.confirmation.note } : null
        }
      />
    </AppShell>
  )
}
