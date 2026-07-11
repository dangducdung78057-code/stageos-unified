import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSessionTier } from "@/lib/membership"
import { Formation3DClient } from "@/components/formation-3d-client"

export const metadata: Metadata = { title: "队形编辑器 · StageOS" }

export default async function Formation3DPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; males?: string; females?: string; count?: string }>
}) {
  const auth = await getSessionTier()
  if (!auth) redirect("/sign-in")
  const sp = await searchParams
  const projectId = sp.projectId ?? null
  const total = sp.count ? Number.parseInt(sp.count, 10) : undefined
  const males = sp.males ? Number.parseInt(sp.males, 10) : total ? Math.round(total / 2) : undefined
  const females = sp.females ? Number.parseInt(sp.females, 10) : total ? total - Math.round(total / 2) : undefined
  return (
    <Formation3DClient
      tier={auth.tier}
      projectId={projectId}
      maleCount={males}
      femaleCount={females}
      backHref={projectId ? `/projects/${projectId}` : "/"}
    />
  )
}
