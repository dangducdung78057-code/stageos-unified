"use server"

import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, stageInputs } from "@/lib/db/schema"

async function getUserId() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) throw new Error("Unauthorized"); return session.user.id }
export async function getProjects() { const userId = await getUserId(); return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt)) }
export async function createProject(formData: FormData) { const userId = await getUserId(); await db.insert(projects).values({ userId, title: String(formData.get("title") || "未命名项目"), programType: String(formData.get("programType") || "综合舞台"), status: "draft" }); revalidatePath("/") }
export async function saveStageInput(projectId: string, data: Record<string, unknown>) { const userId = await getUserId(); const existing = await db.select({ id: stageInputs.id }).from(stageInputs).where(and(eq(stageInputs.projectId, projectId), eq(stageInputs.userId, userId))).limit(1); if (existing[0]) await db.update(stageInputs).set({ data, updatedAt: new Date() }).where(and(eq(stageInputs.id, existing[0].id), eq(stageInputs.userId, userId))); else await db.insert(stageInputs).values({ projectId, userId, data }); revalidatePath(`/projects/${projectId}`) }
