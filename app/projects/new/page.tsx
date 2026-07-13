import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { ProjectWizard } from "@/components/project-wizard"

export default async function NewProjectPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")
  return (
    <AppShell userName={session.user.name}>
      <ProjectWizard />
    </AppShell>
  )
}
