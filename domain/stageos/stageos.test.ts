import { describe, expect, it } from "vitest";
import { canUsePreview, getEntitlements } from "./entitlements";
import {
  getSpriteManifest,
  isProductionReady,
  PRODUCTION_ASSET_FILES,
  resolveSpriteAssets,
  resolveSpriteDirection,
  resolveSpriteId,
  spriteManifestSchema,
} from "./sprite-manifest";
import { parseSceneData, stageSceneSchema } from "./scene";

const baseScene = {
  schemaVersion: 2 as const,
  projectId: "58f38884-1bc2-49c9-87b2-d5acec5149a9",
  renderMode: "dot-sketch" as const,
  formationPreset: "标准方阵式",
  spacing: 1.8,
  performers: [],
  keyframes: [],
  movementPaths: {},
  stage: {},
  lighting: {},
  costumeName: null,
  males: 0,
  females: 0,
};

describe("会员渲染权限", () => {
  it("免费用户只能进入黑点草图", () => {
    expect(getEntitlements("free").previewModes).toEqual(["dot-sketch"]);
    expect(canUsePreview("free", "stage-2.5d")).toBe(false);
    expect(canUsePreview("free", "stage-3d")).toBe(false);
  });

  it("会员可以进入 2.5D 与 3D", () => {
    expect(canUsePreview("member", "stage-2.5d")).toBe(true);
    expect(canUsePreview("member", "stage-3d")).toBe(true);
  });
});

describe("场景项目隔离与迁移", () => {
  it("保留真实 projectId", () => {
    expect(stageSceneSchema.parse(baseScene).projectId).toBe(baseScene.projectId);
  });

  it("不同 projectId 的同名场景数据不会混淆", () => {
    const a = stageSceneSchema.parse(baseScene);
    const b = stageSceneSchema.parse({ ...baseScene, projectId: "8b275792-c883-408a-8a82-e080c02fb8aa" });
    expect(a.projectId).not.toBe(b.projectId);
  });

  it("人物素材与外观字段保存恢复不丢失", () => {
    const performer = {
      id: "S01", gender: "female" as const, heightCm: 140, x: 1, z: 2, riserLevel: 2,
      groupId: "声部-A", roleLabel: "领唱", direction: -30, spriteId: "primary-girl-basic-white",
      appearance: { outfitId: "basic-white", upperColor: "#ff0000", lowerColor: "#00ff00", footwearColor: "#ffffff", accentColor: "#0000ff" },
    };
    const restored = stageSceneSchema.parse({ ...baseScene, performers: [performer] }).performers[0];
    expect(restored).toEqual(performer);
  });

  it("旧版场景迁移到 schemaVersion 2", () => {
    const migrated = parseSceneData({
      performers: [], activePreset: "标准方阵式", spacing: 1.8, keyframes: [],
      lightMode: "indoor", themeColor: "#ffffff", costumeName: null,
      fieldType: "grass", timeOfDay: 12, males: 0, females: 0,
    });
    expect(migrated.schemaVersion).toBe(2);
  });
});

describe("Sprite Manifest", () => {
  it("小学女生映射到唯一精灵", () => {
    expect(resolveSpriteId({ gender: "female", ageSegment: "primary" })).toBe("primary-girl-basic-white");
  });

  it("Manifest 缺失时返回 null 并可降级", () => {
    expect(getSpriteManifest("missing-sprite")).toBeNull();
  });

  it("开发占位素材状态明确", () => {
    expect(getSpriteManifest("primary-girl-basic-white")?.placeholder).toBe(true);
  });

  it("开发素材不得冒充正式素材", () => {
    const manifest = getSpriteManifest("primary-girl-basic-white");
    expect(() => spriteManifestSchema.parse(manifest)).not.toThrow();
    expect(manifest?.directions.frontLeft).toBeTruthy();
    expect(manifest?.directions.frontRight).toBeTruthy();
    expect(manifest && isProductionReady(manifest)).toBe(false);
  });

  it("正式素材必须有三方向和每方向四区遮罩", () => {
    const masks = { upper: "/u.webp", lower: "/l.webp", footwear: "/f.webp", accent: "/a.webp" };
    const production = spriteManifestSchema.parse({
      characterId: "test", spriteId: "test-production", ageSegment: "primary", gender: "female",
      outfitId: "basic-white", worldHeightCm: 140, imageWidth: 256, imageHeight: 512,
      anchor: { x: 0.5, y: 1 },
      directions: { front: "/front.webp", frontLeft: "/left.webp", frontRight: "/right.webp" },
      masks,
      directionMasks: { front: masks, frontLeft: masks, frontRight: masks },
      assetStatus: "production", placeholder: false,
    });
    expect(isProductionReady(production)).toBe(true);
    expect(PRODUCTION_ASSET_FILES).toHaveLength(15);
  });

  it("方向与对应遮罩解析稳定", () => {
    const manifest = getSpriteManifest("primary-girl-basic-white")!;
    expect(resolveSpriteDirection(-45)).toBe("frontLeft");
    expect(resolveSpriteDirection(0)).toBe("front");
    expect(resolveSpriteDirection(45)).toBe("frontRight");
    expect(resolveSpriteAssets(manifest, -45).image).toBe(manifest.directions.frontLeft);
    expect(resolveSpriteAssets(manifest, 0).masks).toEqual(manifest.masks);
  });
});
