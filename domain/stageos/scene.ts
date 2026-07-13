// StageOS 统一舞台场景数据模型 (schemaVersion 2)
// 黑点草图(dot-sketch)、2.5D(stage-2.5d)、3D(stage-3d) 三种渲染模式共用同一份状态,
// 切换预览模式只更换 renderer,人物坐标/分组/服装/关键帧/舞台设置完全一致。
import { z } from "zod"
import type { PreviewMode } from "./types"

export const SCENE_SCHEMA_VERSION = 2

const appearanceSchema = z.object({
  outfitId: z.string().nullable().default(null),
  upperColor: z.string().default("#3aa89e"),
  lowerColor: z.string().default("#22262e"),
  footwearColor: z.string().default("#ffffff"),
  accentColor: z.string().nullable().optional(),
})

const performerSchema = z.object({
  id: z.string(),
  gender: z.enum(["male", "female"]),
  heightCm: z.number(),
  x: z.number(),
  z: z.number(),
  /** 台阶层级:0 为舞台地面,1/2/3 为合唱台阶 */
  riserLevel: z.number().int().min(0).default(0),
  /** 声部/方阵分组 */
  groupId: z.string().nullable().default(null),
  /** 领唱、领诵、指挥等角色标注 */
  roleLabel: z.string().nullable().default(null),
  /** 朝向(弧度,0 为面向观众) */
  direction: z.number().default(0),
  /** 2.5D 精灵素材 ID */
  spriteId: z.string().nullable().default(null),
  appearance: appearanceSchema.default(() => appearanceSchema.parse({})),
})

const stageSchema = z.object({
  width: z.number().positive().default(16),
  depth: z.number().positive().default(10),
  riserLevels: z.number().int().min(0).default(0),
  backgroundId: z.string().nullable().default(null),
  ledConfig: z.object({ enabled: z.boolean().default(false), contentId: z.string().nullable().default(null) }).default(() => ({ enabled: false, contentId: null })),
  props: z.array(z.object({ id: z.string(), kind: z.string(), x: z.number(), z: z.number(), rotation: z.number().default(0) })).default([]),
})

const keyframeSchema = z.object({
  time: z.number().min(0),
  positions: z.record(z.string(), z.tuple([z.number(), z.number()])),
})

const lightingSchema = z.object({
  mode: z.enum(["indoor", "led", "outdoor"]).default("indoor"),
  themeColor: z.string().default("#3aa89e"),
  fieldType: z.enum(["grass", "track"]).default("grass"),
  timeOfDay: z.number().min(0).max(24).default(14),
})

export const stageSceneSchema = z.object({
  schemaVersion: z.literal(2),
  projectId: z.string().uuid().nullable().default(null),
  renderMode: z.enum(["dot-sketch", "stage-2.5d", "stage-3d"]),
  formationPreset: z.string(),
  spacing: z.number().positive(),
  performers: z.array(performerSchema),
  keyframes: z.array(keyframeSchema).default([]),
  /** 走位路径:performerId → 路径点序列 */
  movementPaths: z.record(z.string(), z.array(z.tuple([z.number(), z.number()]))).default({}),
  stage: stageSchema.default(() => stageSchema.parse({})),
  lighting: lightingSchema.default(() => lightingSchema.parse({})),
  costumeName: z.string().nullable().default(null),
  males: z.number().int().min(0),
  females: z.number().int().min(0),
  updatedAt: z.string().datetime().optional(),
})

export type StageSceneData = z.infer<typeof stageSceneSchema>
export type StagePerformer = z.infer<typeof performerSchema>

/** v1 场景数据(旧版云端记录),用于向后兼容迁移 */
type LegacySceneV1 = {
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

/** 解析任意版本的云端场景数据,v1 自动迁移为 v2,非法数据抛错 */
export function parseSceneData(raw: unknown): StageSceneData {
  const obj = raw as Record<string, unknown>
  if (obj && obj.schemaVersion === 2) return stageSceneSchema.parse(raw)
  // v1 → v2 迁移:补齐默认台阶/分组/朝向/服装/舞台字段
  const v1 = raw as LegacySceneV1
  if (!v1 || !Array.isArray(v1.performers)) throw new Error("Unrecognized scene data")
  return stageSceneSchema.parse({
    schemaVersion: 2,
    projectId: null,
    renderMode: "stage-3d",
    formationPreset: v1.activePreset,
    spacing: v1.spacing,
    performers: v1.performers.map((p) => ({ ...p, riserLevel: 0, groupId: null, roleLabel: null, direction: 0, spriteId: null, appearance: {} })),
    keyframes: v1.keyframes ?? [],
    movementPaths: {},
    stage: {},
    lighting: { mode: v1.lightMode, themeColor: v1.themeColor, fieldType: v1.fieldType, timeOfDay: v1.timeOfDay },
    costumeName: v1.costumeName,
    males: v1.males,
    females: v1.females,
  })
}

/** 判断某渲染模式是否属于会员能力(dot-sketch 免费,2.5D/3D 需会员) */
export function isMemberRenderMode(mode: PreviewMode): boolean {
  return mode !== "dot-sketch"
}
