"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formationScenes, formationSceneVersions, projects, user } from "@/lib/db/schema"
import { getEntitlements } from "@/domain/stageos/entitlements"
import { isMemberRenderMode, parseSceneData, type StageSceneData } from "@/domain/stageos/scene"
import type { MembershipTier } from "@/domain/stageos/types"
import { and, asc, eq, isNull, lt, sql, type SQL } from "drizzle-orm"
import { headers } from "next/headers"

export type { StageSceneData } from "@/domain/stageos/scene"

/** 场景定位:每次读写都必须同时给出 projectId(可为 null=个人草稿)与 name */
export type SceneRef = { projectId: string | null; name: string }

/** 读取当前登录用户 ID 与会员级别(服务端唯一可信来源) */
async function getSessionUser(): Promise<{ userId: string; tier: MembershipTier }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  const [row] = await db.select({ tier: user.membershipTier }).from(user).where(eq(user.id, session.user.id)).limit(1)
  const tier = (row?.tier === "member" || row?.tier === "custom" ? row.tier : "free") as MembershipTier
  return { userId: session.user.id, tier }
}

/** 校验项目归属:projectId 非空时必须属于当前用户,否则拒绝(防跨用户/跨项目访问) */
async function assertProjectOwnership(userId: string, projectId: string | null) {
  if (!projectId) return
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)
  if (!row) throw new Error("project_not_found_or_forbidden")
}

/** 生成 projectId 匹配条件(null 用 IS NULL,值用等值),始终与 userId+name 组合 */
function sceneWhere(userId: string, ref: SceneRef): SQL {
  const projectCond = ref.projectId ? eq(formationScenes.projectId, ref.projectId) : isNull(formationScenes.projectId)
  return and(eq(formationScenes.userId, userId), projectCond, eq(formationScenes.name, ref.name)) as SQL
}

/** 服务端会员校验:2.5D/3D 场景、超额人数、多版本仅会员可用,不依赖前端隐藏按钮 */
function assertEntitled(tier: MembershipTier, data: StageSceneData) {
  const ent = getEntitlements(tier)
  if (isMemberRenderMode(data.renderMode) && !ent.previewModes.includes(data.renderMode)) {
    throw new Error(`membership_required:${data.renderMode}`)
  }
  if (data.performers.length > ent.maxPerformers) {
    throw new Error(`performer_limit_exceeded:${ent.maxPerformers}`)
  }
}

/**
 * 保存场景:按 (userId, projectId, name) 定位,每次保存生成不可变新版本(v1/v2/v3…)。
 * 依赖数据库 unique(userId, projectId, name) 约束防止并发重复,而非“先查再插入”。
 */
export async function saveFormationScene(ref: SceneRef, raw: unknown) {
  const { userId, tier } = await getSessionUser()
  const data = parseSceneData(raw)
  // 强制场景数据的 projectId 与定位一致,避免前端伪造串项目
  if ((data.projectId ?? null) !== (ref.projectId ?? null)) {
    throw new Error("project_mismatch")
  }
  await assertProjectOwnership(userId, ref.projectId)
  assertEntitled(tier, data)
  const ent = getEntitlements(tier)

  return db.transaction(async (tx) => {
    const [scene] = await tx
      .insert(formationScenes)
      .values({ userId, projectId: ref.projectId, name: ref.name, data, currentVersion: 1 })
      .onConflictDoUpdate({
        target: [formationScenes.userId, formationScenes.projectId, formationScenes.name],
        set: { data, updatedAt: new Date(), currentVersion: sql`${formationScenes.currentVersion} + 1` },
      })
      .returning({ id: formationScenes.id, currentVersion: formationScenes.currentVersion })

    await tx.insert(formationSceneVersions).values({ sceneId: scene.id, userId, version: scene.currentVersion, data })

    if (ent.maxSnapshots !== null) {
      await tx
        .delete(formationSceneVersions)
        .where(
          and(
            eq(formationSceneVersions.sceneId, scene.id),
            eq(formationSceneVersions.userId, userId),
            lt(formationSceneVersions.version, scene.currentVersion - ent.maxSnapshots + 1),
          ),
        )
    }
    return { id: scene.id, version: scene.currentVersion }
  })
}

/** 读取某项目下某场景的当前版本(严格按 userId+projectId+name,旧 v1 数据自动迁移为 v2) */
export async function loadFormationScene(ref: SceneRef) {
  const { userId, tier } = await getSessionUser()
  await assertProjectOwnership(userId, ref.projectId)
  const rows = await db.select().from(formationScenes).where(sceneWhere(userId, ref)).limit(1)
  if (!rows.length) return null
  const data = parseSceneData(rows[0].data)
  assertEntitled(tier, data) // 免费用户不能读取会员级场景
  return {
    id: rows[0].id,
    name: rows[0].name,
    projectId: rows[0].projectId,
    version: rows[0].currentVersion,
    updatedAt: rows[0].updatedAt.toISOString(),
    data,
  }
}

/** 列出某项目下某场景的全部历史版本(仅版本号与时间) */
export async function listSceneVersions(ref: SceneRef) {
  const { userId } = await getSessionUser()
  await assertProjectOwnership(userId, ref.projectId)
  const [scene] = await db
    .select({ id: formationScenes.id, currentVersion: formationScenes.currentVersion })
    .from(formationScenes)
    .where(sceneWhere(userId, ref))
    .limit(1)
  if (!scene) return { current: 0, versions: [] as { version: number; createdAt: string }[] }
  const versions = await db
    .select({ version: formationSceneVersions.version, createdAt: formationSceneVersions.createdAt })
    .from(formationSceneVersions)
    .where(and(eq(formationSceneVersions.sceneId, scene.id), eq(formationSceneVersions.userId, userId)))
    .orderBy(asc(formationSceneVersions.version))
  return {
    current: scene.currentVersion,
    versions: versions.map((v) => ({ version: v.version, createdAt: v.createdAt.toISOString() })),
  }
}

/** 恢复历史版本:将该版本数据设为场景当前数据(会生成新版本,历史不可变) */
export async function restoreSceneVersion(ref: SceneRef, version: number) {
  const { userId, tier } = await getSessionUser()
  await assertProjectOwnership(userId, ref.projectId)
  const ent = getEntitlements(tier)
  if (ent.maxSnapshots !== null && ent.maxSnapshots <= 1) throw new Error("membership_required:version-history")
  const [scene] = await db
    .select({ id: formationScenes.id })
    .from(formationScenes)
    .where(sceneWhere(userId, ref))
    .limit(1)
  if (!scene) throw new Error("scene_not_found")
  const [ver] = await db
    .select({ data: formationSceneVersions.data })
    .from(formationSceneVersions)
    .where(
      and(
        eq(formationSceneVersions.sceneId, scene.id),
        eq(formationSceneVersions.userId, userId),
        eq(formationSceneVersions.version, version),
      ),
    )
    .limit(1)
  if (!ver) throw new Error("version_not_found")
  const data = parseSceneData(ver.data)
  const saved = await saveFormationScene(ref, data)
  return { ...saved, data }
}
