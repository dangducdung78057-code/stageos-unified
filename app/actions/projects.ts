"use server"

import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { confirmationRecords, planSnapshots, projects, stageInputs } from "@/lib/db/schema"
import { appendValidationHistory, validateStageInputDetailed, type StageInputData } from "@/lib/stageos"
import { generateLocalPlan } from "@/features/plan-engine/generateLocalPlan"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export async function getProjects() {
  const userId = await getUserId()
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt))
}

export async function getProjectDetail(projectId: string) {
  const userId = await getUserId()
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)
  if (!project) return null
  const [input] = await db
    .select()
    .from(stageInputs)
    .where(and(eq(stageInputs.projectId, projectId), eq(stageInputs.userId, userId)))
    .limit(1)
  const snapshots = await db
    .select()
    .from(planSnapshots)
    .where(and(eq(planSnapshots.projectId, projectId), eq(planSnapshots.userId, userId)))
    .orderBy(desc(planSnapshots.version))
  const [confirmation] = await db
    .select()
    .from(confirmationRecords)
    .where(and(eq(confirmationRecords.projectId, projectId), eq(confirmationRecords.userId, userId)))
    .orderBy(desc(confirmationRecords.updatedAt))
    .limit(1)
  return { project, stageInput: input ?? null, snapshots, confirmation: confirmation ?? null }
}

export async function createProjectFromWizard(title: string, data: StageInputData) {
  const userId = await getUserId()
  const [created] = await db
    .insert(projects)
    .values({
      userId,
      title: title.trim() || "未命名项目",
      status: "planning",
      performanceDate: data.performanceDate || null,
      performerCount: data.performerCount ?? null,
      programType: data.programType ?? null,
      theme: data.programTheme ?? null,
    })
    .returning({ id: projects.id })

  const { errors, warnings } = validateStageInputDetailed(data)
  const persisted = appendValidationHistory(data, {
    checkedAt: new Date().toISOString(),
    errors,
    warnings,
  })
  await db.insert(stageInputs).values({ projectId: created.id, userId, data: persisted })

  const plan = generateLocalPlan(data)
  await db.insert(planSnapshots).values({
    projectId: created.id,
    userId,
    version: 1,
    mode: "local_rules",
    costumePlan: {
      ...plan.costumePlan,
      visualPlan: plan.visualPlan,
      constraints: plan.constraints,
      __stageos: plan.metadata,
    },
    risks: plan.risks,
    reverseSchedule: plan.reverseSchedule,
    platformSearch: plan.platformSearch,
    providerStatus: "local_rules_ready",
  })
  await db.insert(confirmationRecords).values({ projectId: created.id, userId, status: "draft" })
  revalidatePath("/")
  revalidatePath("/projects")
  return created.id
}

export async function saveStageInput(projectId: string, data: StageInputData) {
  const userId = await getUserId()
  const { errors, warnings } = validateStageInputDetailed(data)
  const persisted = appendValidationHistory(data, {
    checkedAt: new Date().toISOString(),
    errors,
    warnings,
  })
  const [existing] = await db
    .select({ id: stageInputs.id })
    .from(stageInputs)
    .where(and(eq(stageInputs.projectId, projectId), eq(stageInputs.userId, userId)))
    .limit(1)
  if (existing) {
    await db
      .update(stageInputs)
      .set({ data: persisted, updatedAt: new Date() })
      .where(and(eq(stageInputs.id, existing.id), eq(stageInputs.userId, userId)))
  } else {
    await db.insert(stageInputs).values({ projectId, userId, data: persisted })
  }
  await db
    .update(projects)
    .set({
      performanceDate: data.performanceDate || null,
      performerCount: data.performerCount ?? null,
      programType: data.programType ?? null,
      theme: data.programTheme ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
  revalidatePath(`/projects/${projectId}`)
  return { errors, warnings }
}

export async function regeneratePlan(projectId: string) {
  const userId = await getUserId()
  const [input] = await db
    .select()
    .from(stageInputs)
    .where(and(eq(stageInputs.projectId, projectId), eq(stageInputs.userId, userId)))
    .limit(1)
  if (!input) throw new Error("未找到舞台输入")
  const [latest] = await db
    .select({ version: planSnapshots.version })
    .from(planSnapshots)
    .where(and(eq(planSnapshots.projectId, projectId), eq(planSnapshots.userId, userId)))
    .orderBy(desc(planSnapshots.version))
    .limit(1)
  const plan = generateLocalPlan(input.data as StageInputData)
  await db.insert(planSnapshots).values({
    projectId,
    userId,
    version: (latest?.version ?? 0) + 1,
    mode: "local_rules",
    costumePlan: {
      ...plan.costumePlan,
      visualPlan: plan.visualPlan,
      constraints: plan.constraints,
      __stageos: plan.metadata,
    },
    risks: plan.risks,
    reverseSchedule: plan.reverseSchedule,
    platformSearch: plan.platformSearch,
    providerStatus: "local_rules_ready",
  })
  revalidatePath(`/projects/${projectId}`)
}

export async function updateProjectStatus(projectId: string, status: string) {
  const userId = await getUserId()
  await db
    .update(projects)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/projects")
}

export async function updateConfirmation(projectId: string, status: string, note?: string) {
  const userId = await getUserId()
  const [existing] = await db
    .select({ id: confirmationRecords.id })
    .from(confirmationRecords)
    .where(and(eq(confirmationRecords.projectId, projectId), eq(confirmationRecords.userId, userId)))
    .limit(1)
  if (existing) {
    await db
      .update(confirmationRecords)
      .set({ status, note: note ?? null, updatedAt: new Date() })
      .where(and(eq(confirmationRecords.id, existing.id), eq(confirmationRecords.userId, userId)))
  } else {
    await db.insert(confirmationRecords).values({ projectId, userId, status, note: note ?? null })
  }
  const statusMap: Record<string, string> = { confirmed: "confirmed", needs_revision: "needs_revision" }
  if (statusMap[status]) {
    await db
      .update(projects)
      .set({ status: statusMap[status], updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
  }
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/projects")
}

export async function deleteProject(projectId: string) {
  const userId = await getUserId()
  await db.delete(planSnapshots).where(and(eq(planSnapshots.projectId, projectId), eq(planSnapshots.userId, userId)))
  await db
    .delete(confirmationRecords)
    .where(and(eq(confirmationRecords.projectId, projectId), eq(confirmationRecords.userId, userId)))
  await db.delete(stageInputs).where(and(eq(stageInputs.projectId, projectId), eq(stageInputs.userId, userId)))
  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
  revalidatePath("/projects")
  revalidatePath("/")
}
