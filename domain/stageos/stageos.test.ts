import { describe, expect, it } from "vitest";
import { canUsePreview, getEntitlements } from "./entitlements";
import { getSpriteManifest, resolveSpriteId, spriteManifestSchema } from "./sprite-manifest";
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

  it("正式素材必须能通过完整 Manifest 校验", () => {
    const manifest = getSpriteManifest("primary-girl-basic-white");
    expect(() => spriteManifestSchema.parse(manifest)).not.toThrow();
    expect(manifest?.directions.frontLeft).toBeTruthy();
    expect(manifest?.directions.frontRight).toBeTruthy();
  });
});
