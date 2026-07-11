"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formationScenes } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

/** 3D 队形编辑器完整场景数据(performers 坐标、队形、渲染模式、时间轴等) */
export type FormationSceneData = {
  performers: { id: string; gender: "male" | "female"; heightCm: number; x: number; z: number }[]
  activePreset: string
  spacing: number
  keyframes: { time: number; positions: Record<string, [number, number]> }[]
  lightMode: "indoor" | "led" | "outdoor"
  themeColor: string
  costumeName: string | null
  fieldType: "grass" | "track"
  timeOfDay: number
  males: number
  females: number
}

/** 保存(同名覆盖)当前 3D 场景到 Neon,按 userId 隔离 */
export async function saveFormationScene(name: string, data: FormationSceneData) {
  const userId = await getUserId()
  const existing = await db
    .select({ id: formationScenes.id })
    .from(formationScenes)
    .where(and(eq(formationScenes.userId, userId), eq(formationScenes.name, name)))
    .limit(1)
  if (existing.length) {
    await db
      .update(formationScenes)
      .set({ data, updatedAt: new Date() })
      .where(and(eq(formationScenes.id, existing[0].id), eq(formationScenes.userId, userId)))
    return { id: existing[0].id, updated: true }
  }
  const [row] = await db.insert(formationScenes).values({ userId, name, data }).returning({ id: formationScenes.id })
  return { id: row.id, updated: false }
}

/** 读取当前用户最近保存的 3D 场景 */
export async function loadFormationScene(name?: string) {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(formationScenes)
    .where(
      name
        ? and(eq(formationScenes.userId, userId), eq(formationScenes.name, name))
        : eq(formationScenes.userId, userId),
    )
    .orderBy(desc(formationScenes.updatedAt))
    .limit(1)
  if (!rows.length) return null
  return { id: rows[0].id, name: rows[0].name, updatedAt: rows[0].updatedAt.toISOString(), data: rows[0].data as FormationSceneData }
}
