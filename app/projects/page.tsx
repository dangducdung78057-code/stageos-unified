import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getProjects } from "@/app/actions/projects"
import { AppShell } from "@/components/app-shell"
import { ProjectsTable } from "@/components/projects-table"

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")
  const rows = await getProjects()
  return (
    <AppShell userName={session.user.name}>
      <ProjectsTable
        rows={rows.map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          performanceDate: r.performanceDate,
          performerCount: r.performerCount,
          updatedAt: r.updatedAt.toISOString(),
        }))}
      />
    </AppShell>
  )
}
