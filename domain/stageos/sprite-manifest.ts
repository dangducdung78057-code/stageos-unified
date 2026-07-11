// StageOS 2.5D 人物精灵清单(正式结构)。
// 每个人物 = 一组多朝向 PNG + 世界身高 + 锚点 + 可换色遮罩。渲染层据此投影到舞台坐标。
// 首批仅接入一个测试人物 primary-girl-basic-white,其余人物后续按同结构批量补充。
import { z } from "zod";

export const ageSegmentSchema = z.enum(["primary", "junior", "senior", "adult"]);
export type AgeSegment = z.infer<typeof ageSegmentSchema>;

/** 四方向:面向观众 / 面向观众偏左 / 面向观众偏右(背向暂不接入) */
export const directionSchema = z.object({
  front: z.string(),
  frontLeft: z.string().nullable().default(null),
  frontRight: z.string().nullable().default(null),
});

/** 可换色遮罩:上装/下装/鞋/点缀,渲染层用 tint 混合(素材缺失则为 null) */
export const masksSchema = z.object({
  upper: z.string().nullable().default(null),
  lower: z.string().nullable().default(null),
  footwear: z.string().nullable().default(null),
  accent: z.string().nullable().default(null),
});

export const directionMasksSchema = z.object({
  front: masksSchema,
  frontLeft: masksSchema,
  frontRight: masksSchema,
});

export type SpriteDirection = "front" | "frontLeft" | "frontRight";
export type AppearanceRegion = keyof z.infer<typeof masksSchema>;

export const spriteManifestSchema = z.object({
  characterId: z.string(),
  spriteId: z.string(),
  ageSegment: ageSegmentSchema,
  gender: z.enum(["male", "female"]),
  outfitId: z.string(),
  /** 世界真实身高(厘米),用于 2.5D/3D 尺度一致 */
  worldHeightCm: z.number().positive(),
  /** 源图像像素尺寸 */
  imageWidth: z.number().int().positive(),
  imageHeight: z.number().int().positive(),
  /** 锚点(0~1,相对图像):脚底中心通常为 {x:0.5,y:1} */
  anchor: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
  directions: directionSchema,
  /** 兼容早期单方向遮罩;正式素材必须使用 directionMasks。 */
  masks: masksSchema.default(() => masksSchema.parse({})),
  directionMasks: directionMasksSchema.nullable().default(null),
  /** 素材状态:development 仅开发预览;production 必须具备三方向和四类遮罩 */
  assetStatus: z.enum(["development", "production"]).default("development"),
  /** 兼容旧字段;正式素材接入后置 false */
  placeholder: z.boolean().default(true),
});

export type SpriteManifest = z.infer<typeof spriteManifestSchema>;

/** 正式素材必须具备三方向与四类换色遮罩;开发素材允许缺失并由渲染器降级。 */
export function isProductionReady(manifest: SpriteManifest): boolean {
  const complete = (m: z.infer<typeof masksSchema>) => Boolean(m.upper && m.lower && m.footwear && m.accent);
  return manifest.assetStatus === "production"
    && manifest.placeholder === false
    && Boolean(manifest.directions.front && manifest.directions.frontLeft && manifest.directions.frontRight)
    && Boolean(manifest.directionMasks)
    && Object.values(manifest.directionMasks ?? {}).every(complete);
}

/** 将角度稳定映射到三方向资源。负角度朝左,正角度朝右。 */
export function resolveSpriteDirection(direction: number): SpriteDirection {
  if (direction < -20) return "frontLeft";
  if (direction > 20) return "frontRight";
  return "front";
}

/** 返回某方向的底图与四区遮罩;开发素材自动回退到兼容遮罩。 */
export function resolveSpriteAssets(manifest: SpriteManifest, direction: number) {
  const key = resolveSpriteDirection(direction);
  return {
    direction: key,
    image: manifest.directions[key] ?? manifest.directions.front,
    masks: manifest.directionMasks?.[key] ?? manifest.masks,
  };
}

const BASE = "/assets/stage-2.5d/characters";

/** 原画上传后必须落盘的正式文件名,用于接入脚本与测试共享。 */
export const PRODUCTION_ASSET_FILES = [
  "front.webp", "front-left.webp", "front-right.webp",
  "front-upper.webp", "front-lower.webp", "front-footwear.webp", "front-accent.webp",
  "front-left-upper.webp", "front-left-lower.webp", "front-left-footwear.webp", "front-left-accent.webp",
  "front-right-upper.webp", "front-right-lower.webp", "front-right-footwear.webp", "front-right-accent.webp",
] as const;

/** 首批测试人物:小学女生 · 基础白色服装 */
const PRIMARY_GIRL_BASIC_WHITE: SpriteManifest = spriteManifestSchema.parse({
  characterId: "primary-girl",
  spriteId: "primary-girl-basic-white",
  ageSegment: "primary",
  gender: "female",
  outfitId: "basic-white",
  worldHeightCm: 140,
  imageWidth: 256,
  imageHeight: 512,
  anchor: { x: 0.5, y: 1 },
  directions: {
    front: `${BASE}/primary-girl/basic-white/front.png`,
    frontLeft: `${BASE}/primary-girl/basic-white/front-left.png`,
    frontRight: `${BASE}/primary-girl/basic-white/front-right.png`,
  },
  masks: {
    upper: `${BASE}/primary-girl/basic-white/mask-upper.png`,
    lower: `${BASE}/primary-girl/basic-white/mask-lower.png`,
    footwear: null,
    accent: null,
  },
  assetStatus: "development",
  placeholder: true,
});

/** 首批测试人物:小学男生 · 基础白色服装 */
const PRIMARY_BOY_BASIC_WHITE: SpriteManifest = spriteManifestSchema.parse({
  characterId: "primary-boy",
  spriteId: "primary-boy-basic-white",
  ageSegment: "primary",
  gender: "male",
  outfitId: "basic-white",
  worldHeightCm: 142,
  imageWidth: 256,
  imageHeight: 512,
  anchor: { x: 0.5, y: 1 },
  directions: {
    front: `${BASE}/primary-boy/basic-white/front.png`,
    frontLeft: `${BASE}/primary-boy/basic-white/front-left.png`,
    frontRight: `${BASE}/primary-boy/basic-white/front-right.png`,
  },
  masks: { upper: null, lower: null, footwear: null, accent: null },
  assetStatus: "development",
  placeholder: true,
});

export const SPRITE_MANIFESTS: Record<string, SpriteManifest> = {
  [PRIMARY_GIRL_BASIC_WHITE.spriteId]: PRIMARY_GIRL_BASIC_WHITE,
  [PRIMARY_BOY_BASIC_WHITE.spriteId]: PRIMARY_BOY_BASIC_WHITE,
};

export function getSpriteManifest(spriteId: string | null | undefined): SpriteManifest | null {
  if (!spriteId) return null;
  return SPRITE_MANIFESTS[spriteId] ?? null;
}

/**
 * 按人物属性解析默认精灵 ID。首批仅小学女生白色服装有正式素材,
 * 其余(男生/其他年龄段)暂无素材,返回 null,由渲染层显示占位状态。
 */
export function resolveSpriteId(p: { gender: "male" | "female"; ageSegment?: AgeSegment }): string | null {
  const age = p.ageSegment ?? "primary";
  if (age === "primary") {
    return p.gender === "female" ? "primary-girl-basic-white" : "primary-boy-basic-white";
  }
  return null;
}
