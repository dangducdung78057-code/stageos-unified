"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const Formation3DEditor = dynamic(
  () => import("@/components/formation-3d-editor").then((m) => m.Formation3DEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-[#181b21] text-sm text-[#9fb3c8]">
        正在加载 3D 队形编辑器…
      </div>
    ),
  },
)

import type { MembershipTier } from "@/domain/stageos/types"

export function Formation3DClient({
  tier = "free",
  projectId = null,
  maleCount,
  femaleCount,
  backHref = "/",
}: {
  tier?: MembershipTier
  projectId?: string | null
  maleCount?: number
  femaleCount?: number
  backHref?: string
}) {
  return (
    <main className="relative h-screen w-full">
      <h1 className="sr-only">3D 队形编辑器</h1>
      <Link
        href={backHref}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-[#2b303b] bg-[#1d2027]/90 px-4 py-2 text-xs text-[#9fb3c8] backdrop-blur hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        返回
      </Link>
      <Formation3DEditor tier={tier} projectId={projectId} maleCount={maleCount} femaleCount={femaleCount} />
    </main>
  )
}
