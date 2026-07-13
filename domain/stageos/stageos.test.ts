import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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
import { sanitizeAppearance, snapshotScene, useEditorStore } from "@/components/formation/editor-core";
import { isCharacterQaEnabled } from "@/components/formation-3d-editor";

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

  it("禁用 accent 后保存省略颜色，旧数据恢复时安全忽略", () => {
    const legacyAppearance = {
      outfitId: "basic-white", upperColor: "#111111", lowerColor: "#222222",
      footwearColor: "#333333", accentColor: "#ff0000",
    };
    expect(sanitizeAppearance("primary-boy-basic-white", legacyAppearance)).toEqual({
      outfitId: "basic-white", upperColor: "#111111", lowerColor: "#222222", footwearColor: "#333333",
    });
    expect(sanitizeAppearance("primary-girl-basic-white", legacyAppearance).accentColor).toBe("#ff0000");
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

describe("角色 QA 调试", () => {
  it("Production 默认隐藏，显式 QA 开关可开启", () => {
    expect(isCharacterQaEnabled("production", undefined)).toBe(false);
    expect(isCharacterQaEnabled("production", "true")).toBe(true);
    expect(isCharacterQaEnabled("development", undefined)).toBe(true);
  });

  it("角色选择写入现有 selectedId 状态", () => {
    const state = useEditorStore.getState();
    const girl = state.performers.find((item) => item.spriteId === "primary-girl-basic-white")!;
    state.select(girl.id);
    expect(useEditorStore.getState().selectedId).toBe(girl.id);
  });

  it("QA 可将选中角色切换为开发态青少年素材", () => {
    const state = useEditorStore.getState();
    const girl = state.performers.find((item) => item.gender === "female")!;
    const boy = state.performers.find((item) => item.gender === "male")!;
    state.setPerformerSpriteId(girl.id, "teen-girl-basic-white");
    state.setPerformerSpriteId(boy.id, "teen-boy-basic-white");
    const updatedGirl = useEditorStore.getState().performers.find((item) => item.id === girl.id)!;
    const updatedBoy = useEditorStore.getState().performers.find((item) => item.id === boy.id)!;
    expect(updatedGirl.spriteId).toBe("teen-girl-basic-white");
    expect(updatedBoy.spriteId).toBe("teen-boy-basic-white");
    expect(updatedGirl.appearance.accentColor).toBeUndefined();
    expect(updatedBoy.appearance.accentColor).toBeUndefined();
    state.setPerformerSpriteId(girl.id, "primary-girl-basic-white");
    state.setPerformerSpriteId(boy.id, "primary-boy-basic-white");
  });

  it("方向与启用区域颜色写入统一 store 并可序列化恢复", () => {
    const state = useEditorStore.getState();
    const performer = state.performers.find((item) => item.gender === "female")!;
    state.setPerformerDirection(performer.id, -45);
    state.setPerformerAppearanceColor(performer.id, "upper", "#123456");
    state.setPerformerAppearanceColor(performer.id, "lower", "#234567");
    state.setPerformerAppearanceColor(performer.id, "footwear", "#345678");
    state.setPerformerAppearanceColor(performer.id, "accent", "#456789");

    const saved = snapshotScene(useEditorStore.getState());
    const persisted = saved.performers.find((item) => item.id === performer.id)!;
    expect(persisted.direction).toBe(-45);
    expect(persisted.appearance).toMatchObject({
      upperColor: "#123456", lowerColor: "#234567", footwearColor: "#345678", accentColor: "#456789",
    });

    useEditorStore.getState().setPerformerDirection(performer.id, 45);
    useEditorStore.getState().hydrate(saved);
    expect(useEditorStore.getState().performers.find((item) => item.id === performer.id)).toMatchObject(persisted);
  });

  it("Manifest 禁用区域拒绝写入", () => {
    const state = useEditorStore.getState();
    const performer = state.performers.find((item) => item.gender === "male")!;
    const before = performer.appearance.accentColor;
    state.setPerformerAppearanceColor(performer.id, "accent", "#abcdef");
    expect(useEditorStore.getState().performers.find((item) => item.id === performer.id)?.appearance.accentColor).toBe(before);
  });
});

describe("Sprite Manifest", () => {
  it("小学女生映射到唯一精灵", () => {
    expect(resolveSpriteId({ gender: "female", ageSegment: "primary" })).toBe("primary-girl-basic-white");
  });

  it("Manifest 缺失时返回 null 并可降级", () => {
    expect(getSpriteManifest("missing-sprite")).toBeNull();
  });

  it("女生正式素材状态明确", () => {
    expect(getSpriteManifest("primary-girl-basic-white")?.placeholder).toBe(false);
  });

  it("女生三方向与十二张独立遮罩全部落盘且已晋级", () => {
    const root = resolve(process.cwd(), "public/assets/stage-2.5d/characters/primary-girl/basic-white");
    const base = resolve(root, "preview");
    const candidateManifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8"));
    const files = [
      "front.png", "front-left.png", "front-right.png",
      ...["front", "front-left", "front-right"].flatMap((view) =>
        ["upper", "lower", "footwear", "accent"].map((region) => `masks/${region}-${view}.png`),
      ),
    ];
    const referencedFiles = Object.values(candidateManifest.views).flatMap((view) => [
      (view as { image: string }).image,
      ...Object.values((view as { masks: Record<string, string> }).masks),
    ]);
    expect(files).toHaveLength(15);
    expect(files.every((file) => existsSync(resolve(base, file)))).toBe(true);
    expect(referencedFiles).toHaveLength(15);
    expect(referencedFiles.every((file) => existsSync(resolve(root, file as string)))).toBe(true);
    expect(referencedFiles.every((file) => String(file).startsWith("preview/"))).toBe(true);
    expect(existsSync(resolve(base, "masks/masks-preview-sheet.png"))).toBe(false);
    expect(candidateManifest).toMatchObject({
      assetVersion: "preview-20260711-1",
      spriteId: "primary-girl-basic-white",
      assetStatus: "production",
      placeholder: false,
      productionReady: true,
      worldHeightCm: 140,
      canvas: { width: 1024, height: 1536, footBaselineY: 1449, anchorX: 0.5, anchorY: 1449 / 1536 },
    });
  });

  it("青少年女生生产素材三方向与三区遮罩完整，accent 保持禁用", () => {
    const root = resolve(process.cwd(), "public/assets/stage-2.5d/characters/teen-girl/basic-white");
    const candidateManifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8"));
    const referencedFiles = Object.values(candidateManifest.views).flatMap((view) => {
      const typedView = view as { image: string; masks: Record<string, string | null> };
      return [typedView.image, ...Object.entries(typedView.masks)
        .filter(([region]) => candidateManifest.regions[region].enabled)
        .map(([, file]) => file)];
    });
    expect(referencedFiles).toHaveLength(12);
    expect(referencedFiles.every((file) => typeof file === "string" && existsSync(resolve(root, file)))).toBe(true);
    expect(candidateManifest).toMatchObject({
      assetVersion: "preview-20260712-1",
      spriteId: "teen-girl-basic-white",
      assetStatus: "production",
      placeholder: false,
      productionReady: true,
      worldHeightCm: 155,
      canvas: { width: 1024, height: 1536, footBaselineY: 1449, anchorY: 1449 / 1536 },
    });
    expect(candidateManifest.regions.accent.enabled).toBe(false);
    expect(candidateManifest.productionBlockers).toEqual([]);
    expect(Object.values(candidateManifest.views).every((view) => (view as { masks: { accent: null } }).masks.accent === null)).toBe(true);
    const runtime = getSpriteManifest("teen-girl-basic-white")!;
    expect(runtime.assetStatus).toBe("production");
    expect(runtime.placeholder).toBe(false);
    expect(runtime.regions.accent.enabled).toBe(false);
    expect(Object.values(runtime.directionMasks ?? {}).every((masks) => masks.accent === null)).toBe(true);
    expect(resolveSpriteAssets(runtime, 0).masks.accent).toBeNull();
    expect(isProductionReady(runtime)).toBe(true);
  });

  it("青少年男生生产素材三方向与三区遮罩完整，accent 保持禁用", () => {
    const root = resolve(process.cwd(), "public/assets/stage-2.5d/characters/teen-boy/basic-white");
    const candidateManifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8"));
    const referencedFiles = Object.values(candidateManifest.views).flatMap((view) => {
      const typedView = view as { image: string; masks: Record<string, string | null> };
      return [typedView.image, ...Object.entries(typedView.masks)
        .filter(([region]) => candidateManifest.regions[region].enabled)
        .map(([, file]) => file)];
    });
    expect(referencedFiles).toHaveLength(12);
    expect(referencedFiles.every((file) => typeof file === "string" && existsSync(resolve(root, file)))).toBe(true);
    expect(candidateManifest).toMatchObject({
      assetVersion: "preview-20260712-1",
      spriteId: "teen-boy-basic-white",
      assetStatus: "production",
      placeholder: false,
      productionReady: true,
      worldHeightCm: 160,
      canvas: { width: 1024, height: 1536, footBaselineY: 1449, anchorY: 1449 / 1536 },
    });
    expect(candidateManifest.regions.accent.enabled).toBe(false);
    expect(candidateManifest.productionBlockers).toEqual([]);
    expect(Object.values(candidateManifest.views).every((view) => (view as { masks: { accent: null } }).masks.accent === null)).toBe(true);
    const runtime = getSpriteManifest("teen-boy-basic-white")!;
    expect(runtime.assetStatus).toBe("production");
    expect(runtime.placeholder).toBe(false);
    expect(runtime.regions.accent.enabled).toBe(false);
    expect(Object.values(runtime.directionMasks ?? {}).every((masks) => masks.accent === null)).toBe(true);
    expect(resolveSpriteAssets(runtime, 0).masks.accent).toBeNull();
    expect(isProductionReady(runtime)).toBe(true);
  });

  it("男生 Preview 仅校验启用区域，禁用 accent 不阻止晋级", () => {
    const root = resolve(process.cwd(), "public/assets/stage-2.5d/characters/primary-boy/basic-white");
    const candidateManifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8"));
    const referencedFiles = Object.values(candidateManifest.views).flatMap((view) => {
      const typedView = view as { image: string; masks: Record<string, string | null> };
      return [typedView.image, ...Object.entries(typedView.masks)
        .filter(([region]) => candidateManifest.regions[region].enabled)
        .map(([, file]) => file)];
    });
    expect(referencedFiles).toHaveLength(12);
    expect(referencedFiles.every((file) => typeof file === "string" && existsSync(resolve(root, file)))).toBe(true);
    expect(candidateManifest).toMatchObject({
      spriteId: "primary-boy-basic-white",
      assetStatus: "production",
      placeholder: false,
      productionReady: true,
      worldHeightCm: 142,
      canvas: { width: 1024, height: 1536, footBaselineY: 1449, anchorY: 1449 / 1536 },
    });
    expect(candidateManifest.regions.accent.enabled).toBe(false);
    expect(Object.values(candidateManifest.views).every((view) => (view as { masks: { accent: null } }).masks.accent === null)).toBe(true);
    expect(candidateManifest.productionBlockers).not.toContain("accent masks are empty in all three directions");
    const runtime = getSpriteManifest("primary-boy-basic-white")!;
    expect(runtime.regions.accent.enabled).toBe(false);
    expect(Object.values(runtime.directionMasks ?? {}).every((masks) => masks.accent === null)).toBe(true);
    expect(resolveSpriteAssets(runtime, 0).masks.accent).toBeNull();
    expect(isProductionReady(runtime)).toBe(true);
  });

  it("女生运行时 Manifest 已达到生产标准", () => {
    const manifest = getSpriteManifest("primary-girl-basic-white");
    expect(() => spriteManifestSchema.parse(manifest)).not.toThrow();
    expect(manifest?.directions.frontLeft).toBeTruthy();
    expect(manifest?.directions.frontRight).toBeTruthy();
    expect(manifest && isProductionReady(manifest)).toBe(true);
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

  it("生产校验仅要求已启用区域", () => {
    const masks = { upper: "/u.png", lower: "/l.png", footwear: "/f.png", accent: null };
    const production = spriteManifestSchema.parse({
      characterId: "optional-test", spriteId: "optional-test", ageSegment: "primary", gender: "male",
      outfitId: "basic-white", worldHeightCm: 142, imageWidth: 1024, imageHeight: 1536,
      anchor: { x: 0.5, y: 1 }, regions: { accent: { enabled: false } },
      directions: { front: "/front.png", frontLeft: "/left.png", frontRight: "/right.png" },
      masks, directionMasks: { front: masks, frontLeft: masks, frontRight: masks },
      assetStatus: "production", placeholder: false,
    });
    expect(isProductionReady(production)).toBe(true);
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
