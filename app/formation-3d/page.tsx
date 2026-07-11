import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Formation3DClient } from "@/components/formation-3d-client"

export const metadata: Metadata = { title: "3D 队形编辑器 · StageOS" }

export default async function Formation3DPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")
  return <Formation3DClient />
}
