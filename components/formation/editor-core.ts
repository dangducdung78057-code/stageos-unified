// StageOS 编辑器核心:纯逻辑层,零 Three/Pixi 依赖。
// dot-sketch(Canvas2D) / stage-2.5d(Pixi) / stage-3d(R3F) 三种 renderer 共用同一份 store。
// 免费用户只加载本模块 + Canvas2D 草图,不会拉取 Three.js / PixiJS。
"use client";

import { create } from "zustand";
import { UNIVERSAL_FORMATIONS, STAGE_KNOWLEDGE } from "@/lib/stageKnowledge";
import type { ColorPalette } from "@/lib/stageKnowledge";
import { FORMATION_COMPUTES, gridPositions } from "@/lib/formationLayouts";
import { SCENE_SCHEMA_VERSION } from "@/domain/stageos/scene";
import type { StageSceneData } from "@/domain/stageos/scene";
import type { PreviewMode } from "@/domain/stageos/types";
import { isAppearanceRegionEnabled, resolveSpriteId } from "@/domain/stageos/sprite-manifest";
import type { AppearanceRegion } from "@/domain/stageos/sprite-manifest";

// ---------- 常量 ----------

export type LightMode = "indoor" | "led" | "outdoor";
export type FieldType = "grass" | "track";

export const MALE_COLOR = "#5b8fd4";
export const FEMALE_COLOR = "#e88ba0";
export const ACCENT = "#3aa89e";
export const STAGE_W = 20; // 米
export const STAGE_D = 12;
export const BOUND_X = STAGE_W / 2 - 1;
export const BOUND_Z = STAGE_D / 2 - 0.6;
export const DURATION = 30; // 秒
/** 虚拟评委/主摄像机:舞台正前方 10m 外、视线高 1.2m(坐姿评委) */
export const JUDGE = { x: 0, y: 1.2, z: STAGE_D / 2 + 10 };
/** 每个学生占据半径 0.3 米的物理判定空间 */
export const BODY_RADIUS = 0.3;

// ---------- 类型 ----------

export type Performer = {
  id: string;
  gender: "male" | "female";
  heightCm: number;
  /** 舞台坐标(米):x 横向,z 纵向(正值朝观众) */
  x: number;
  z: number;
  /** 台阶层级:0 为舞台地面(2.5D/3D 共用,草图忽略高度) */
  riserLevel: number;
  groupId: string | null;
  roleLabel: string | null;
  direction: number;
  spriteId: string | null;
  appearance: {
    outfitId: string | null;
    upperColor: string;
    lowerColor: string;
    footwearColor: string;
    accentColor?: string | null;
  };
};

export type Keyframe = { time: number; positions: Record<string, [number, number]> };

export function sanitizeAppearance(spriteId: string | null, appearance: Performer["appearance"]): Performer["appearance"] {
  const { accentColor, ...requiredColors } = appearance;
  return isAppearanceRegionEnabled(spriteId, "accent")
    ? { ...requiredColors, accentColor: accentColor ?? null }
    : requiredColors;
}

// ---------- 颜色/身高工具 ----------

/** HEX 颜色明度调整(amount 为 -1~1,负值加深) */
export function shadeHex(hex: string, amount: number): string {
  const v = hex.replace("#", "");
  const num = parseInt(v.length === 3 ? v.split("").map((c) => c + c).join("") : v, 16);
  const adj = (ch: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? ch * (1 + amount) : ch + (255 - ch) * amount)));
  const r = adj((num >> 16) & 255);
  const g = adj((num >> 8) & 255);
  const b = adj(num & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** 演员实际身高(米):heightCm 按 150cm 基准映射到舞台比例 */
export function performerHeightM(p: Performer): number {
  return (p.heightCm / 150) * 1.7;
}

function pseudoHeight(i: number): number {
  return 143 + ((i * 37 + 11) % 11);
}

// ---------- 名单 ----------

/** 当前名单人数配置(可由嵌入方按项目真实数据覆盖) */
let rosterConfig = { males: 16, females: 20 };

/** 生成名单(默认 16 男 / 20 女),高个在后 */
export function buildRoster(): Omit<Performer, "x" | "z" | "riserLevel">[] {
  const list: Omit<Performer, "x" | "z" | "riserLevel">[] = [];
  let males = rosterConfig.males;
  let females = rosterConfig.females;
  const total = males + females;
  for (let i = 0; i < total; i++) {
    let gender: "male" | "female";
    if (males <= 0) gender = "female";
    else if (females <= 0) gender = "male";
    else gender = i % 2 === 0 ? "male" : "female";
    if (gender === "male") males--;
    else females--;
    const spriteId = resolveSpriteId({ gender });
    list.push({
      id: `S${String(i + 1).padStart(2, "0")}`,
      gender,
      heightCm: pseudoHeight(i),
      groupId: gender === "female" ? "声部-A" : "声部-B",
      roleLabel: i === 0 ? "领唱" : "队员",
      direction: 0,
      spriteId,
      appearance: {
        outfitId: "basic-white",
        upperColor: "#f4f2ed",
        lowerColor: "#e8e5df",
        footwearColor: "#ffffff",
        accentColor: null,
      },
    });
  }
  list.sort((a, b) => b.heightCm - a.heightCm);
  return list.map((p, i) => ({ ...p, id: `S${String(i + 1).padStart(2, "0")}` }));
}

// ---------- 队形预设(计算函数,无 JSX) ----------

/** 队形元数据(供 UI 渲染图标/标题) */
export const PRESET_META = UNIVERSAL_FORMATIONS.map((f) => ({ name: f.name, summary: f.summary }));

const PRESET_COMPUTE: Record<string, (n: number, spacing: number) => [number, number][]> = Object.fromEntries(
  UNIVERSAL_FORMATIONS.map((f) => [f.name, FORMATION_COMPUTES[f.name] ?? gridPositions]),
);

function clampSnap(v: number, bound: number, snap: boolean): number {
  const c = Math.max(-bound, Math.min(bound, v));
  return snap ? Math.round(c * 2) / 2 : Math.round(c * 100) / 100;
}

function withPreset(presetId: string, spacing: number): Performer[] {
  const roster = buildRoster();
  const compute = PRESET_COMPUTE[presetId] ?? gridPositions;
  const pos = compute(roster.length, spacing);
  return roster.map((p, i) => ({
    ...p,
    riserLevel: 0,
    x: clampSnap(pos[i]?.[0] ?? 0, BOUND_X, true),
    z: clampSnap(pos[i]?.[1] ?? 0, BOUND_Z, true),
  }));
}

// ---------- 服装色系 ----------

/** 全部知识库服装色系(按名称去重) */
export const COSTUME_PALETTES: ColorPalette[] = (() => {
  const seen = new Set<string>();
  const out: ColorPalette[] = [];
  for (const prog of STAGE_KNOWLEDGE) {
    for (const pal of prog.palettes) {
      if (seen.has(pal.name)) continue;
      seen.add(pal.name);
      out.push(pal);
    }
  }
  return out;
})();

// ---------- 时间轴 ----------

function capturePositions(perfs: Performer[]): Record<string, [number, number]> {
  return Object.fromEntries(perfs.map((p) => [p.id, [p.x, p.z] as [number, number]]));
}

function initialKeyframes(spacing: number): Keyframe[] {
  return [
    { time: 0, positions: capturePositions(withPreset("标准方阵式", spacing)) },
    { time: 15, positions: capturePositions(withPreset("同心圆环式", spacing)) },
    { time: 30, positions: capturePositions(withPreset("V字展开式", spacing)) },
  ];
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 二次贝塞尔插值:中点垂直偏移形成弧线动线,奇偶分流避免舞台中央穿模碰撞 */
export function samplePos(kfs: Keyframe[], id: string, t: number): [number, number] {
  if (kfs.length === 0) return [0, 0];
  if (t <= kfs[0].time) return kfs[0].positions[id] ?? [0, 0];
  const last = kfs[kfs.length - 1];
  if (t >= last.time) return last.positions[id] ?? [0, 0];
  let i = 0;
  while (i + 1 < kfs.length - 1 && kfs[i + 1].time <= t) i++;
  const a = kfs[i];
  const b = kfs[i + 1];
  const u0 = (t - a.time) / (b.time - a.time);
  const u = u0 * u0 * (3 - 2 * u0);
  const p0 = a.positions[id] ?? [0, 0];
  const p1 = b.positions[id] ?? p0;
  const dx = p1[0] - p0[0];
  const dz = p1[1] - p0[1];
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return p0;
  const side = hashId(id) % 2 === 0 ? 1 : -1;
  const amp = Math.min(1.6, len * 0.28);
  const cx = (p0[0] + p1[0]) / 2 + (-dz / len) * amp * side;
  const cz = (p0[1] + p1[1]) / 2 + (dx / len) * amp * side;
  const s = 1 - u;
  const x = s * s * p0[0] + 2 * s * u * cx + u * u * p1[0];
  const z = s * s * p0[1] + 2 * s * u * cz + u * u * p1[1];
  return [Math.max(-BOUND_X, Math.min(BOUND_X, x)), Math.max(-BOUND_Z, Math.min(BOUND_Z, z))];
}

function performersAt(perfs: Performer[], kfs: Keyframe[], t: number): Performer[] {
  return perfs.map((p) => {
    const [x, z] = samplePos(kfs, p.id, t);
    return { ...p, x, z };
  });
}

// ---------- 纯数学视线遮挡推演(零 Three 依赖) ----------

/**
 * 纯数学遮挡推演:从评委视点向每个目标脸部(身高 90%)投射视线,
 * 若另一人的判定圆柱(半径 BODY_RADIUS)横向落在视线上、位于目标之前,
 * 且其身高高于该处视线高度,则判定遮挡。等价于原 Raycaster 版本但不加载 Three。
 */
export function computeOcclusions(perfs: Performer[]): Map<string, string> {
  const res = new Map<string, string>();
  if (perfs.length < 2) return res;
  const jx = JUDGE.x;
  const jz = JUDGE.z;
  const jy = JUDGE.y;

  for (const target of perfs) {
    const tx = target.x - jx;
    const tz = target.z - jz;
    const distT = Math.hypot(tx, tz);
    if (distT < 0.001) continue;
    const ux = tx / distT;
    const uz = tz / distT;
    const faceH = performerHeightM(target) * 0.9;
    let bestDist = Infinity;
    let blocker: string | null = null;

    for (const b of perfs) {
      if (b.id === target.id) continue;
      const bx = b.x - jx;
      const bz = b.z - jz;
      const proj = bx * ux + bz * uz; // 沿视线方向的投影距离
      if (proj <= 0.1 || proj >= distT - 0.1) continue; // 必须在目标之前
      const perp = Math.abs(bx * -uz + bz * ux); // 到视线的垂直距离
      if (perp > BODY_RADIUS) continue; // 视线未穿过该人判定圆柱
      // 视线在该投影距离处的高度
      const rayH = jy + (faceH - jy) * (proj / distT);
      if (performerHeightM(b) >= rayH - 0.02 && proj < bestDist) {
        bestDist = proj;
        blocker = b.id;
      }
    }
    if (blocker) res.set(target.id, blocker);
  }
  return res;
}

export function withOcclusions(performers: Performer[]): { performers: Performer[]; occlusions: Map<string, string> } {
  return { performers, occlusions: computeOcclusions(performers) };
}

// ---------- store ----------

export type EditorState = {
  performers: Performer[];
  occlusions: Map<string, string>;
  selectedId: string | null;
  draggingId: string | null;
  snap: boolean;
  spacing: number;
  activePreset: string;
  keyframes: Keyframe[];
  currentTime: number;
  playing: boolean;
  lightMode: LightMode;
  themeColor: string;
  costume: ColorPalette | null;
  fieldType: FieldType;
  timeOfDay: number;
  renderMode: PreviewMode;
  /** 当前场景所属项目与名称(用于云端按 userId+projectId+name 隔离) */
  projectId: string | null;
  sceneName: string;
  select: (id: string | null) => void;
  setDragging: (id: string | null) => void;
  move: (id: string, x: number, z: number) => void;
  setPerformerDirection: (id: string, direction: number) => void;
  setPerformerSpriteId: (id: string, spriteId: string) => void;
  setPerformerAppearanceColor: (id: string, region: AppearanceRegion, color: string) => void;
  setSnap: (v: boolean) => void;
  setSpacing: (v: number) => void;
  applyPreset: (presetId: string) => void;
  setTime: (t: number) => void;
  tick: (dt: number) => void;
  togglePlay: () => void;
  captureKeyframe: () => void;
  removeKeyframe: (time: number) => void;
  setRoster: (males: number, females: number) => void;
  setLightMode: (m: LightMode) => void;
  setThemeColor: (c: string) => void;
  setCostume: (p: ColorPalette | null) => void;
  setFieldType: (f: FieldType) => void;
  setTimeOfDay: (t: number) => void;
  setRenderMode: (m: PreviewMode) => void;
  setProject: (projectId: string | null, sceneName: string) => void;
  hydrate: (d: StageSceneData) => void;
};

const INITIAL_PERFORMERS = withPreset("标准方阵式", 1.8);

export const useEditorStore = create<EditorState>((set, get) => ({
  performers: INITIAL_PERFORMERS,
  occlusions: computeOcclusions(INITIAL_PERFORMERS),
  selectedId: null,
  draggingId: null,
  snap: true,
  spacing: 1.8,
  activePreset: "标准方阵式",
  keyframes: initialKeyframes(1.8),
  currentTime: 0,
  playing: false,
  lightMode: "indoor",
  themeColor: "#3aa89e",
  costume: null,
  fieldType: "grass",
  timeOfDay: 14,
  renderMode: "dot-sketch",
  projectId: null,
  sceneName: "default",
  select: (id) => set({ selectedId: id }),
  setDragging: (id) => set({ draggingId: id }),
  move: (id, x, z) =>
    set((s) =>
      withOcclusions(
        s.performers.map((p) =>
          p.id === id ? { ...p, x: clampSnap(x, BOUND_X, s.snap), z: clampSnap(z, BOUND_Z, s.snap) } : p,
        ),
      ),
    ),
  setPerformerDirection: (id, direction) =>
    set((s) =>
      withOcclusions(s.performers.map((p) => (p.id === id ? { ...p, direction } : p))),
    ),
  setPerformerSpriteId: (id, spriteId) =>
    set((s) =>
      withOcclusions(s.performers.map((p) => (
        p.id === id ? { ...p, spriteId, appearance: sanitizeAppearance(spriteId, p.appearance) } : p
      ))),
    ),
  setPerformerAppearanceColor: (id, region, color) =>
    set((s) =>
      withOcclusions(
        s.performers.map((p) => {
          if (p.id !== id || !isAppearanceRegionEnabled(p.spriteId, region)) return p;
          const field = {
            upper: "upperColor",
            lower: "lowerColor",
            footwear: "footwearColor",
            accent: "accentColor",
          }[region] as keyof Performer["appearance"];
          return { ...p, appearance: { ...p.appearance, [field]: color } };
        }),
      ),
    ),
  setSnap: (v) => set({ snap: v }),
  setSpacing: (v) => set({ spacing: v, ...withOcclusions(withPreset(get().activePreset, v)) }),
  applyPreset: (presetId) => set({ activePreset: presetId, ...withOcclusions(withPreset(presetId, get().spacing)) }),
  setTime: (t) => {
    const s = get();
    const ct = Math.max(0, Math.min(DURATION, t));
    set({ currentTime: ct, ...withOcclusions(performersAt(s.performers, s.keyframes, ct)) });
  },
  tick: (dt) => {
    const s = get();
    let nt = s.currentTime + dt;
    if (nt >= DURATION) nt -= DURATION;
    set({ currentTime: nt, ...withOcclusions(performersAt(s.performers, s.keyframes, nt)) });
  },
  togglePlay: () => {
    const s = get();
    if (!s.playing) set({ playing: true, ...withOcclusions(performersAt(s.performers, s.keyframes, s.currentTime)) });
    else set({ playing: false });
  },
  captureKeyframe: () => {
    const s = get();
    const time = Math.round(s.currentTime * 2) / 2;
    const kf: Keyframe = { time, positions: capturePositions(s.performers) };
    const rest = s.keyframes.filter((k) => Math.abs(k.time - time) > 0.25);
    set({ keyframes: [...rest, kf].sort((a, b) => a.time - b.time) });
  },
  removeKeyframe: (time) => {
    const s = get();
    if (s.keyframes.length <= 2) return;
    set({ keyframes: s.keyframes.filter((k) => k.time !== time) });
  },
  setRoster: (males, females) => {
    if (rosterConfig.males === males && rosterConfig.females === females) return;
    rosterConfig = { males: Math.max(0, males), females: Math.max(0, females) };
    const s = get();
    set({
      ...withOcclusions(withPreset(s.activePreset, s.spacing)),
      keyframes: initialKeyframes(s.spacing),
      selectedId: null,
      currentTime: 0,
      playing: false,
    });
  },
  setLightMode: (m) => set({ lightMode: m }),
  setThemeColor: (c) => set({ themeColor: c }),
  setCostume: (p) => set({ costume: p }),
  setFieldType: (f) => set({ fieldType: f }),
  setTimeOfDay: (t) => set({ timeOfDay: Math.max(0, Math.min(24, t)) }),
  setRenderMode: (m) => set({ renderMode: m }),
  setProject: (projectId, sceneName) => set({ projectId, sceneName }),
  hydrate: (d) => {
    rosterConfig = { males: Math.max(0, d.males), females: Math.max(0, d.females) };
    const costume = d.costumeName ? (COSTUME_PALETTES.find((p) => p.name === d.costumeName) ?? null) : null;
    set({
      ...withOcclusions(
        d.performers.map((p) => ({
          id: p.id,
          gender: p.gender,
          heightCm: p.heightCm,
          x: p.x,
          z: p.z,
          riserLevel: p.riserLevel,
          groupId: p.groupId,
          roleLabel: p.roleLabel,
          direction: p.direction,
          spriteId: p.spriteId,
          appearance: sanitizeAppearance(p.spriteId, p.appearance),
        })),
      ),
      activePreset: d.formationPreset,
      spacing: d.spacing,
      keyframes: d.keyframes,
      renderMode: d.renderMode,
      lightMode: d.lighting.mode,
      themeColor: d.lighting.themeColor,
      costume,
      fieldType: d.lighting.fieldType,
      timeOfDay: d.lighting.timeOfDay,
      projectId: d.projectId,
      selectedId: null,
      currentTime: 0,
      playing: false,
    });
  },
}));

/** 将当前编辑器状态序列化为统一场景数据(schemaVersion 2,三种渲染模式共用) */
export function snapshotScene(s: EditorState): StageSceneData {
  return {
    schemaVersion: SCENE_SCHEMA_VERSION as 2,
    projectId: s.projectId,
    renderMode: s.renderMode,
    formationPreset: s.activePreset,
    spacing: s.spacing,
    performers: s.performers.map((p) => ({
      id: p.id,
      gender: p.gender,
      heightCm: p.heightCm,
      x: p.x,
      z: p.z,
      riserLevel: p.riserLevel,
      groupId: p.groupId,
      roleLabel: p.roleLabel,
      direction: p.direction,
      spriteId: p.spriteId,
      appearance: sanitizeAppearance(p.spriteId, p.appearance),
    })),
    keyframes: s.keyframes,
    movementPaths: Object.fromEntries(
      s.performers.map((p) => [
        p.id,
        s.keyframes.map((kf) => kf.positions[p.id] ?? [p.x, p.z]),
      ]),
    ),
    stage: {
      width: BOUND_X * 2,
      depth: BOUND_Z * 2,
      riserLevels: Math.max(0, ...s.performers.map((p) => p.riserLevel)),
      backgroundId: null,
      ledConfig: { enabled: s.lightMode === "led", contentId: null },
      props: [],
    },
    lighting: { mode: s.lightMode, themeColor: s.themeColor, fieldType: s.fieldType, timeOfDay: s.timeOfDay },
    costumeName: s.costume?.name ?? null,
    males: rosterConfig.males,
    females: rosterConfig.females,
  };
}
