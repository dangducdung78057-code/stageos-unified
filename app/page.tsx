import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Dashboard } from "@/components/dashboard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")
  const projectRows = await db.select({ id: projects.id, title: projects.title, status: projects.status, performanceDate: projects.performanceDate, performerCount: projects.performerCount }).from(projects).where(eq(projects.userId, session.user.id)).orderBy(desc(projects.updatedAt))
  return <Dashboard projects={projectRows} />
}
