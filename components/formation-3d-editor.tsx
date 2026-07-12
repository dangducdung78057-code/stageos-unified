// StageOS 队形编辑器 shell:零 Three/Pixi 静态依赖。
// 免费用户只加载 Canvas2D 草图;切到 2.5D(Pixi)/3D(Three) 时才动态加载对应 renderer。
// 三种渲染模式共用 editor-core 的同一份 store,坐标/队形/服装/关键帧完全一致。
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  useEditorStore,
  snapshotScene,
  PRESET_META,
  COSTUME_PALETTES,
  MALE_COLOR,
  FEMALE_COLOR,
  DURATION,
  type LightMode,
  type Performer,
} from "@/components/formation/editor-core";
import type { DotSketchHandle } from "@/components/formation/dot-sketch-view";
import {
  saveFormationScene,
  loadFormationScene,
  listSceneVersions,
  restoreSceneVersion,
  type SceneRef,
} from "@/app/actions/formation";
import { getEntitlements } from "@/domain/stageos/entitlements";
import type { MembershipTier, PreviewMode } from "@/domain/stageos/types";
import { getSpriteManifest, SPRITE_MANIFESTS } from "@/domain/stageos/sprite-manifest";
import type { AppearanceRegion } from "@/domain/stageos/sprite-manifest";
import type { ColorPalette } from "@/lib/stageKnowledge";
import {
  LayoutGrid,
  Circle as CircleIcon,
  Spline,
  ChevronsDown,
  Triangle,
  Users,
  Magnet,
  RotateCcw,
  MoveHorizontal,
  Play,
  Pause,
  Plus,
  Trash2,
  Terminal,
  Lamp,
  MonitorPlay,
  Sun,
  ChevronsUp,
  Diamond,
  MoveUpRight,
  Columns2,
  Rows3,
  Shirt,
  Check,
  Download,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// renderer 动态加载:免费用户永不拉取 Three/Pixi
const DotSketchView = dynamic(() => import("@/components/formation/dot-sketch-view").then((m) => m.DotSketchView), {
  ssr: false,
});
const Stage25DView = dynamic(() => import("@/components/formation/stage-25d-view").then((m) => m.Stage25DView), {
  ssr: false,
  loading: () => <ViewLoading label="正在加载 2.5D 渲染器…" />,
});
const Stage3DView = dynamic(() => import("@/components/formation/stage-3d-view").then((m) => m.Stage3DView), {
  ssr: false,
  loading: () => <ViewLoading label="正在加载 3D 渲染器…" />,
});

function ViewLoading({ label }: { label: string }) {
  return <div className="flex h-full w-full items-center justify-center bg-[#181b21] text-sm text-[#9fb3c8]">{label}</div>;
}

// ---------- 队形预设(UI 图标) ----------

function presetIcon(name: string): React.ReactNode {
  if (name.includes("方阵")) return <LayoutGrid size={16} />;
  if (name.includes("倒V")) return <ChevronsUp size={16} />;
  if (name.includes("V字")) return <ChevronsDown size={16} />;
  if (name.includes("扇形")) return <Spline size={16} />;
  if (name.includes("菱形")) return <Diamond size={16} />;
  if (name.includes("圆") || name.includes("环")) return <CircleIcon size={16} />;
  if (name.includes("斜线")) return <MoveUpRight size={16} />;
  if (name.includes("十字")) return <Plus size={16} />;
  if (name.includes("金字塔") || name.includes("梯形")) return <Triangle size={16} />;
  if (name.includes("弧形")) return <Spline size={16} />;
  if (name.includes("分组") || name.includes("分区") || name.includes("三区")) return <Columns2 size={16} />;
  return <Rows3 size={16} />;
}

const PRESETS = PRESET_META.map((f) => ({ id: f.name, name: f.name, summary: f.summary, icon: presetIcon(f.name) }));

// ---------- 面板 ----------

export function isCharacterQaEnabled(nodeEnv = process.env.NODE_ENV, publicFlag = process.env.NEXT_PUBLIC_STAGEOS_CHARACTER_QA) {
  return nodeEnv !== "production" || publicFlag === "true";
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-[#2b303b] bg-[#1d2027]/95 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.35)] backdrop-blur", className)}>
      {children}
    </div>
  );
}

function FormationsPanel() {
  const activePreset = useEditorStore((s) => s.activePreset);
  const applyPreset = useEditorStore((s) => s.applyPreset);
  const spacing = useEditorStore((s) => s.spacing);
  const setSpacing = useEditorStore((s) => s.setSpacing);
  const performers = useEditorStore((s) => s.performers);
  const maleCount = performers.filter((p) => p.gender === "male").length;

  return (
    <Panel className="pointer-events-auto absolute top-6 bottom-40 left-6 z-10 flex w-72 flex-col overflow-hidden">
      <h2 className="mb-1 shrink-0 text-lg font-bold tracking-tight text-[#f0f3f6]">
        队形预设
        <span className="ml-2 align-middle font-mono text-[11px] font-normal text-[#6b7686]">{PRESETS.length} 种通用队形</span>
      </h2>
      <div className="mb-3 flex shrink-0 items-center gap-1.5 text-xs text-[#9fb3c8]">
        <span>当前:</span>
        <span className="flex items-center gap-1 rounded-full bg-[#3aa89e]/15 px-2.5 py-0.5 font-medium text-[#7fd4cb]">
          <Check size={12} />
          {activePreset}
        </span>
      </div>
      <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="队形预设">
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => applyPreset(preset.id)}
                title={preset.summary}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-center text-[11px] leading-tight font-medium transition-colors",
                  isActive
                    ? "border-[#3aa89e]/50 bg-[#3aa89e]/15 text-[#7fd4cb]"
                    : "border-[#2b303b] text-[#c7d2de] hover:bg-[#262b34]",
                )}
              >
                <span className={cn("rounded-md p-1", isActive ? "bg-[#3aa89e]/25 text-[#7fd4cb]" : "bg-[#262b34] text-[#9fb3c8]")}>
                  {preset.icon}
                </span>
                {preset.name}
                {isActive ? (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3aa89e] text-[#10201d]">
                    <Check size={11} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="mt-4 border-t border-[#2b303b] pt-3">
          <label htmlFor="spacing" className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9fb3c8]">
            <MoveHorizontal size={14} />
            间距 {spacing.toFixed(1)}m
          </label>
          <input
            id="spacing"
            type="range"
            min={1.2}
            max={2.6}
            step={0.1}
            value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
            className="w-full accent-[#3aa89e]"
          />
        </div>
        <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-[#262b34] px-3 py-2 text-xs text-[#9fb3c8]">
          <Users size={15} />
          <span>
            共 {performers.length} 人 · 男 {maleCount} / 女 {performers.length - maleCount}
          </span>
        </div>
        <CostumeSection />
        <LightingSection />
        <CloudSyncSection />
      </div>
    </Panel>
  );
}

/** 云端保存/恢复:统一场景数据按 userId+projectId+name 写入 Neon,每次保存生成不可变新版本 */
function CloudSyncSection() {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState<{ version: number; createdAt: string }[]>([]);
  const [current, setCurrent] = useState(0);

  const ref = (): SceneRef => {
    const s = useEditorStore.getState();
    return { projectId: s.projectId, name: s.sceneName };
  };

  const refreshVersions = async () => {
    try {
      const res = await listSceneVersions(ref());
      setVersions(res.versions.slice(-5).reverse());
      setCurrent(res.current);
    } catch {
      // 未登录时静默
    }
  };

  const save = async () => {
    setBusy(true);
    setStatus("保存中…");
    try {
      const res = await saveFormationScene(ref(), snapshotScene(useEditorStore.getState()));
      setStatus(`已保存为版本 v${res.version}`);
      await refreshVersions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setStatus(msg.startsWith("membership_required") ? "该能力需要会员,保存被服务端拒绝" : "保存失败,请先登录");
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    setStatus("恢复中…");
    try {
      const scene = await loadFormationScene(ref());
      if (!scene) {
        setStatus("云端暂无保存的场景");
      } else {
        useEditorStore.getState().hydrate(scene.data);
        setStatus(`已恢复当前版本 v${scene.version}`);
        await refreshVersions();
      }
    } catch {
      setStatus("恢复失败,请先登录");
    } finally {
      setBusy(false);
    }
  };

  const restoreVersion = async (v: number) => {
    setBusy(true);
    setStatus(`恢复 v${v} 中…`);
    try {
      const res = await restoreSceneVersion(ref(), v);
      useEditorStore.getState().hydrate(res.data);
      setStatus(`已将 v${v} 恢复为当前版本(新版本 v${res.version})`);
      await refreshVersions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setStatus(msg.startsWith("membership_required") ? "多版本历史为会员能力" : "版本恢复失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 border-t border-[#2b303b] pt-4">
      <span className="mb-2 block text-xs font-medium text-[#9fb3c8]">云端场景 (Neon)</span>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-lg border border-[#3aa89e]/50 bg-[#3aa89e]/15 px-2 py-2 text-[11px] font-medium text-[#7fd4cb] transition-colors hover:bg-[#3aa89e]/25 disabled:opacity-50"
        >
          保存到云端
        </button>
        <button
          type="button"
          onClick={restore}
          disabled={busy}
          className="flex-1 rounded-lg bg-[#262b34] px-2 py-2 text-[11px] font-medium text-[#9fb3c8] transition-colors hover:bg-[#2c323d] disabled:opacity-50"
        >
          从云端恢复
        </button>
      </div>
      {status ? (
        <p aria-live="polite" className="mt-2 text-[11px] text-[#9fb3c8]">
          {status}
        </p>
      ) : null}
      {versions.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-[10px] text-[#6b7683]">历史版本(当前 v{current})</span>
          {versions.map((v) => (
            <button
              key={v.version}
              type="button"
              disabled={busy || v.version === current}
              onClick={() => restoreVersion(v.version)}
              className="flex items-center justify-between rounded bg-[#262b34] px-2 py-1 text-left text-[10px] text-[#9fb3c8] transition-colors hover:bg-[#2c323d] disabled:opacity-50"
            >
              <span>
                v{v.version}
                {v.version === current ? " · 当前" : ""}
              </span>
              <span className="font-mono">{new Date(v.createdAt).toLocaleTimeString("zh-CN")}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** 服装色系选择:女生着主色、男生着辅色、裙摆点缀色 */
function CostumeSection() {
  const costume = useEditorStore((s) => s.costume);
  const setCostume = useEditorStore((s) => s.setCostume);

  return (
    <div className="mt-4 border-t border-[#2b303b] pt-3">
      <span className="mb-2 flex items-center gap-2 text-xs font-medium text-[#9fb3c8]">
        <Shirt size={14} />
        服装色系
        {costume ? <span className="ml-auto font-mono text-[10px] text-[#7fd4cb]">{costume.name}</span> : null}
      </span>
      <div className="-mr-1 flex max-h-32 flex-col gap-1 overflow-y-auto pr-1">
        <button
          type="button"
          onClick={() => setCostume(null)}
          aria-pressed={!costume}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-[12px] transition-colors",
            !costume ? "border-[#3aa89e]/50 bg-[#3aa89e]/15 text-[#7fd4cb]" : "border-transparent text-[#c7d2de] hover:bg-[#262b34]",
          )}
        >
          <span className="flex gap-0.5">
            <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: MALE_COLOR }} />
            <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: FEMALE_COLOR }} />
          </span>
          默认(蓝粉区分)
        </button>
        {COSTUME_PALETTES.map((pal: ColorPalette) => (
          <button
            key={pal.name}
            type="button"
            onClick={() => setCostume(pal)}
            aria-pressed={costume?.name === pal.name}
            title={pal.note}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-[12px] transition-colors",
              costume?.name === pal.name
                ? "border-[#3aa89e]/50 bg-[#3aa89e]/15 text-[#7fd4cb]"
                : "border-transparent text-[#c7d2de] hover:bg-[#262b34]",
            )}
          >
            <span className="flex gap-0.5">
              <span className="h-3.5 w-3.5 rounded-full border border-white/15" style={{ backgroundColor: pal.primaryHex }} />
              <span className="h-3.5 w-3.5 rounded-full border border-white/15" style={{ backgroundColor: pal.secondaryHex }} />
              <span className="h-3.5 w-3.5 rounded-full border border-white/15" style={{ backgroundColor: pal.accentHex }} />
            </span>
            {pal.name}
          </button>
        ))}
      </div>
    </div>
  );
}

const LIGHT_MODES: { id: LightMode; name: string; icon: React.ReactNode }[] = [
  { id: "indoor", name: "室内暖光", icon: <Lamp size={14} /> },
  { id: "led", name: "LED 大屏", icon: <MonitorPlay size={14} /> },
  { id: "outdoor", name: "室外日光", icon: <Sun size={14} /> },
];

const LED_THEME_COLORS = ["#3aa89e", "#e05d7a", "#4a7fd4", "#c9a227", "#7a5dc7"];

function LightingSection() {
  const lightMode = useEditorStore((s) => s.lightMode);
  const setLightMode = useEditorStore((s) => s.setLightMode);
  const themeColor = useEditorStore((s) => s.themeColor);
  const setThemeColor = useEditorStore((s) => s.setThemeColor);

  return (
    <div className="mt-5 border-t border-[#2b303b] pt-4">
      <span className="mb-2 block text-xs font-medium text-[#9fb3c8]">舞台灯光</span>
      <div className="flex gap-1.5" role="group" aria-label="灯光模式">
        {LIGHT_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setLightMode(m.id)}
            aria-pressed={lightMode === m.id}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium transition-colors",
              lightMode === m.id
                ? "border-[#3aa89e]/50 bg-[#3aa89e]/15 text-[#7fd4cb]"
                : "border-transparent bg-[#262b34] text-[#9fb3c8] hover:bg-[#2c323d]",
            )}
          >
            {m.icon}
            {m.name}
          </button>
        ))}
      </div>
      {lightMode === "led" ? (
        <div className="mt-3">
          <span className="mb-2 block text-[11px] text-[#9fb3c8]">大屏主题色</span>
          <div className="flex items-center gap-2" role="group" aria-label="大屏主题色">
            {LED_THEME_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setThemeColor(c)}
                aria-label={`主题色 ${c}`}
                aria-pressed={themeColor === c}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                  themeColor === c ? "border-white" : "border-transparent",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              aria-label="自定义主题色"
              className="h-7 w-7 cursor-pointer rounded-full border border-[#343a47] bg-transparent"
            />
          </div>
        </div>
      ) : null}
      {lightMode === "outdoor" ? <OutdoorControls /> : null}
    </div>
  );
}

function OutdoorControls() {
  const fieldType = useEditorStore((s) => s.fieldType);
  const setFieldType = useEditorStore((s) => s.setFieldType);
  const timeOfDay = useEditorStore((s) => s.timeOfDay);
  const setTimeOfDay = useEditorStore((s) => s.setTimeOfDay);

  return (
    <div className="mt-3">
      <span className="mb-2 block text-[11px] text-[#9fb3c8]">场地类型</span>
      <div className="flex gap-1.5" role="group" aria-label="场地类型">
        {(
          [
            { id: "grass", name: "草地", color: "#4ade80" },
            { id: "track", name: "跑道", color: "#c2554a" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFieldType(f.id)}
            aria-pressed={fieldType === f.id}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors",
              fieldType === f.id
                ? "border-[#3aa89e]/50 bg-[#3aa89e]/15 text-[#7fd4cb]"
                : "border-transparent bg-[#262b34] text-[#9fb3c8] hover:bg-[#2c323d]",
            )}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
            {f.name}
          </button>
        ))}
      </div>
      <label htmlFor="time-of-day" className="mt-3 mb-1.5 flex items-center justify-between text-[11px] text-[#9fb3c8]">
        <span>模拟时间</span>
        <span className="font-mono text-[#c7d2de]">
          {String(Math.floor(timeOfDay)).padStart(2, "0")}:{String(Math.round((timeOfDay % 1) * 60)).padStart(2, "0")}
          {timeOfDay > 6 && timeOfDay < 18 ? " 白昼" : " 夜间"}
        </span>
      </label>
      <input
        id="time-of-day"
        type="range"
        min={5}
        max={20}
        step={0.5}
        value={timeOfDay}
        onChange={(e) => setTimeOfDay(Number(e.target.value))}
        className="w-full accent-[#3aa89e]"
      />
    </div>
  );
}

const QA_DIRECTIONS = [
  { label: "正面", value: 0 },
  { label: "左前", value: -45 },
  { label: "右前", value: 45 },
] as const;

const QA_REGIONS: { region: AppearanceRegion; label: string; field: "upperColor" | "lowerColor" | "footwearColor" | "accentColor" }[] = [
  { region: "upper", label: "上装", field: "upperColor" },
  { region: "lower", label: "下装", field: "lowerColor" },
  { region: "footwear", label: "鞋履", field: "footwearColor" },
  { region: "accent", label: "点缀", field: "accentColor" },
];

function CharacterQaPanel({ performer }: { performer: Performer }) {
  const performers = useEditorStore((s) => s.performers);
  const select = useEditorStore((s) => s.select);
  const manifest = getSpriteManifest(performer.spriteId);
  const setDirection = useEditorStore((s) => s.setPerformerDirection);
  const setSpriteId = useEditorStore((s) => s.setPerformerSpriteId);
  const setColor = useEditorStore((s) => s.setPerformerAppearanceColor);
  if (!manifest) return null;

  return (
    <section className="rounded-lg border border-[#c9a227]/50 bg-[#c9a227]/10 p-3" aria-label="角色 QA 调试">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-[#f5c542]">角色 QA 调试</h3>
        <span className="font-mono text-[10px] text-[#c7d2de]">QA only</span>
      </div>
      <label className="mb-3 block text-[11px] font-medium text-[#9fb3c8]" htmlFor="qa-performer-select">
        测试角色
        <select
          id="qa-performer-select"
          value={performer.id}
          onChange={(event) => select(event.target.value)}
          className="mt-1.5 w-full rounded-md border border-[#343a47] bg-[#1b1f27] px-2 py-2 font-mono text-[10px] text-[#f0f3f6] outline-none focus:border-[#3aa89e]"
        >
          {performers.map((item, index) => (
            <option key={item.id} value={item.id}>
              {index + 1}. {item.id} · {item.spriteId}
            </option>
          ))}
        </select>
      </label>
      <label className="mb-3 block text-[11px] font-medium text-[#9fb3c8]" htmlFor="qa-sprite-select">
        测试素材
        <select
          id="qa-sprite-select"
          value={manifest.spriteId}
          onChange={(event) => setSpriteId(performer.id, event.target.value)}
          className="mt-1.5 w-full rounded-md border border-[#343a47] bg-[#1b1f27] px-2 py-2 font-mono text-[10px] text-[#f0f3f6] outline-none focus:border-[#3aa89e]"
        >
          {Object.values(SPRITE_MANIFESTS).map((item) => (
            <option key={item.spriteId} value={item.spriteId}>
              {item.spriteId} · {item.assetStatus}
            </option>
          ))}
        </select>
      </label>
      <dl className="mb-3 rounded-md bg-[#1b1f27] p-2 font-mono text-[10px] text-[#c7d2de]">
        <div className="flex gap-2"><dt className="shrink-0 text-[#9fb3c8]">selectedPerformerId</dt><dd className="min-w-0 break-all">{performer.id}</dd></div>
        <div className="mt-1 flex gap-2"><dt className="shrink-0 text-[#9fb3c8]">spriteId</dt><dd className="min-w-0 break-all">{manifest.spriteId}</dd></div>
      </dl>
      <fieldset>
        <legend className="mb-2 text-[11px] font-medium text-[#9fb3c8]">人物方向</legend>
        <div className="flex gap-1.5" role="group" aria-label="人物方向">
          {QA_DIRECTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDirection(performer.id, item.value)}
              aria-pressed={performer.direction === item.value}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                performer.direction === item.value
                  ? "border-[#3aa89e]/60 bg-[#3aa89e]/20 text-[#7fd4cb]"
                  : "border-[#343a47] text-[#c7d2de] hover:bg-[#262b34]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {QA_REGIONS.filter(({ region }) => manifest.regions[region].enabled).map(({ region, label, field }) => (
          <label key={region} className="flex items-center justify-between gap-2 rounded-md bg-[#262b34] px-2 py-1.5 text-[11px] text-[#c7d2de]">
            {label}
            <input
              type="color"
              value={performer.appearance[field] ?? "#ffffff"}
              onChange={(event) => setColor(performer.id, region, event.target.value)}
              aria-label={`${label}颜色`}
              className="h-6 w-8 cursor-pointer rounded border border-[#343a47] bg-transparent"
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function PropertiesPanel() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const performers = useEditorStore((s) => s.performers);
  const move = useEditorStore((s) => s.move);
  const snap = useEditorStore((s) => s.snap);
  const setSnap = useEditorStore((s) => s.setSnap);
  const applyPreset = useEditorStore((s) => s.applyPreset);
  const activePreset = useEditorStore((s) => s.activePreset);
  const renderMode = useEditorStore((s) => s.renderMode);
  const selected = performers.find((p) => p.id === selectedId);

  const inputClass =
    "w-full rounded-lg border border-[#343a47] bg-[#262b34] px-3 py-2 text-sm text-[#f0f3f6] outline-none focus:border-[#3aa89e] focus:ring-1 focus:ring-[#3aa89e]";

  return (
    <Panel className="pointer-events-auto absolute top-6 right-6 z-10 max-h-[calc(100vh-3rem)] w-72 overflow-y-auto">
      <h2 className="mb-4 text-lg font-bold tracking-tight text-[#f0f3f6]">属性</h2>
      {selected ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-[#262b34] px-3 py-2.5">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full"
              style={{ backgroundColor: selected.gender === "male" ? MALE_COLOR : FEMALE_COLOR }}
              aria-hidden
            />
            <div className="text-sm font-semibold text-[#f0f3f6]">{selected.id}</div>
            <div className="ml-auto text-xs text-[#9fb3c8]">
              {selected.gender === "male" ? "男" : "女"} · {selected.heightCm}cm
            </div>
          </div>
          {renderMode === "stage-2.5d" && isCharacterQaEnabled() && getSpriteManifest(selected.spriteId) ? (
            <CharacterQaPanel performer={selected} />
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="posX" className="mb-1.5 block text-xs font-medium text-[#9fb3c8]">
                横向 X (m)
              </label>
              <input
                id="posX"
                type="number"
                step={0.5}
                value={selected.x}
                onChange={(e) => move(selected.id, Number(e.target.value), selected.z)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="posZ" className="mb-1.5 block text-xs font-medium text-[#9fb3c8]">
                纵深 Z (m)
              </label>
              <input
                id="posZ"
                type="number"
                step={0.5}
                value={selected.z}
                onChange={(e) => move(selected.id, selected.x, Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-[#9fb3c8]">点击舞台上的人物进行选择,拖拽可移动站位</p>
      )}
      <div className="mt-5 flex flex-col gap-2 border-t border-[#2b303b] pt-4">
        <button
          type="button"
          onClick={() => setSnap(!snap)}
          aria-pressed={snap}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors",
            snap ? "border-[#3aa89e]/50 bg-[#3aa89e]/15 text-[#7fd4cb]" : "border-[#343a47] text-[#c7d2de] hover:bg-[#262b34]",
          )}
        >
          <Magnet size={16} />
          网格吸附 {snap ? "开" : "关"}
        </button>
        <button
          type="button"
          onClick={() => applyPreset(activePreset)}
          className="flex items-center gap-3 rounded-lg border border-[#343a47] px-3.5 py-2.5 text-sm font-medium text-[#c7d2de] transition-colors hover:bg-[#262b34]"
        >
          <RotateCcw size={16} />
          重置当前队形
        </button>
      </div>
    </Panel>
  );
}

function TimelinePanel() {
  const currentTime = useEditorStore((s) => s.currentTime);
  const playing = useEditorStore((s) => s.playing);
  const keyframes = useEditorStore((s) => s.keyframes);
  const setTime = useEditorStore((s) => s.setTime);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const captureKeyframe = useEditorStore((s) => s.captureKeyframe);
  const removeKeyframe = useEditorStore((s) => s.removeKeyframe);

  return (
    <Panel className="pointer-events-auto absolute bottom-6 left-1/2 z-10 w-[min(660px,calc(100vw-3rem))] -translate-x-1/2 !p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "暂停" : "播放"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3aa89e] text-[#06211f] transition-colors hover:bg-[#4dbfb4]"
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <span className="w-20 shrink-0 font-mono text-sm text-[#f0f3f6]">
          {currentTime.toFixed(1)}s<span className="text-[#9fb3c8]"> / {DURATION}s</span>
        </span>
        <div className="relative flex-1">
          <input
            type="range"
            min={0}
            max={DURATION}
            step={0.1}
            value={currentTime}
            onChange={(e) => setTime(Number(e.target.value))}
            aria-label="时间轴进度"
            className="w-full accent-[#3aa89e]"
          />
          <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-2">
            {keyframes.map((kf) => (
              <span
                key={kf.time}
                className="absolute h-2 w-2 -translate-x-1/2 rotate-45 bg-[#f5c542]"
                style={{ left: `${(kf.time / DURATION) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={captureKeyframe}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#343a47] px-3 py-2 text-xs font-medium text-[#c7d2de] transition-colors hover:bg-[#262b34]"
        >
          <Plus size={14} />
          记录关键帧
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#2b303b] pt-3">
        <span className="text-xs text-[#9fb3c8]">关键帧:</span>
        {keyframes.map((kf) => (
          <span
            key={kf.time}
            className="flex items-center gap-1 rounded-full bg-[#262b34] py-1 pr-1 pl-2.5 font-mono text-[11px] text-[#c7d2de]"
          >
            <button type="button" onClick={() => setTime(kf.time)} className="hover:text-[#7fd4cb]">
              {kf.time}s
            </button>
            {keyframes.length > 2 ? (
              <button
                type="button"
                onClick={() => removeKeyframe(kf.time)}
                aria-label={`删除 ${kf.time}s 关键帧`}
                className="rounded-full p-0.5 text-[#9fb3c8] hover:bg-[#343a47] hover:text-[#e5484d]"
              >
                <Trash2 size={11} />
              </button>
            ) : null}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-[#6b7686]">拖拽站位后点「记录关键帧」写入当前时间点</span>
      </div>
    </Panel>
  );
}

function OcclusionPanel() {
  const performers = useEditorStore((s) => s.performers);
  const occlusions = useEditorStore((s) => s.occlusions);
  const warnings = useMemo(() => {
    const byId = new Map(performers.map((p) => [p.id, p]));
    return Array.from(occlusions.entries()).map(([id, byWhom]) => ({
      id,
      byWhom,
      h1: byId.get(id)?.heightCm ?? 0,
      h2: byId.get(byWhom)?.heightCm ?? 0,
    }));
  }, [occlusions, performers]);

  return (
    <Panel className="pointer-events-auto absolute right-6 bottom-6 z-10 w-80 !p-0">
      <div className="flex items-center gap-2 border-b border-[#2b303b] px-4 py-2.5">
        <Terminal size={14} className="text-[#7fd4cb]" />
        <span className="font-mono text-xs font-semibold tracking-wide text-[#f0f3f6]">OCCLUSION STATUS</span>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
            warnings.length > 0 ? "bg-[#e5484d]/20 text-[#ff8a8e]" : "bg-[#3aa89e]/20 text-[#7fd4cb]",
          )}
        >
          {warnings.length > 0 ? `${warnings.length} WARN` : "CLEAR"}
        </span>
      </div>
      <div className="max-h-36 overflow-y-auto px-4 py-2.5 font-mono text-[11px] leading-relaxed">
        {warnings.length === 0 ? (
          <p className="text-[#7fd4cb]">[OK] 评委视线无遮挡,所有人可见。</p>
        ) : (
          warnings.map((w) => (
            <p key={w.id} className="text-[#ff8a8e]">
              [WARN] {w.id} ({w.h1}cm) 被 {w.byWhom} ({w.h2}cm) 遮挡,建议换位。
            </p>
          ))
        )}
      </div>
    </Panel>
  );
}

// ---------- 渲染模式切换 ----------

const MODE_LABELS: Record<PreviewMode, string> = {
  "dot-sketch": "黑点草图",
  "stage-2.5d": "2.5D 人物",
  "stage-3d": "3D 舞台",
};
const MODE_ORDER: PreviewMode[] = ["dot-sketch", "stage-2.5d", "stage-3d"];

function ModeToggle({
  allowed,
  onExportPng,
}: {
  allowed: PreviewMode[];
  onExportPng: () => void;
}) {
  const renderMode = useEditorStore((s) => s.renderMode);
  const setRenderMode = useEditorStore((s) => s.setRenderMode);
  const [hint, setHint] = useState("");

  return (
    <div className="pointer-events-none absolute top-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <div className="pointer-events-auto flex rounded-full border border-[#2b303b] bg-[#1d2027]/90 p-1 backdrop-blur">
          {MODE_ORDER.map((m) => {
            const locked = !allowed.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  if (locked) {
                    setHint(`${MODE_LABELS[m]}为会员功能,请升级后使用`);
                    return;
                  }
                  setHint("");
                  setRenderMode(m);
                }}
                aria-pressed={renderMode === m}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  renderMode === m ? "bg-[#3aa89e] text-[#0f1115]" : locked ? "text-[#5b6472]" : "text-[#9fb3c8] hover:text-[#f0f3f6]",
                )}
              >
                {locked ? <Lock size={11} /> : null}
                {MODE_LABELS[m]}
              </button>
            );
          })}
        </div>
        {renderMode === "dot-sketch" ? (
          <button
            type="button"
            onClick={onExportPng}
            className="pointer-events-auto flex items-center gap-1 rounded-full border border-[#2b303b] bg-[#1d2027]/90 px-3 py-1.5 text-[11px] text-[#9fb3c8] backdrop-blur hover:text-[#f0f3f6]"
          >
            <Download size={12} />
            导出 PNG
          </button>
        ) : null}
        <span className="rounded-full border border-[#2b303b] bg-[#1d2027]/90 px-4 py-1.5 text-[11px] whitespace-nowrap text-[#9fb3c8] backdrop-blur">
          拖拽调整站位 · 红 = 视线遮挡
        </span>
      </div>
      {hint ? (
        <span className="pointer-events-none rounded-full bg-[#e5484d]/90 px-3 py-1 text-[11px] text-white">{hint}</span>
      ) : null}
    </div>
  );
}

// ---------- 可嵌入编辑器 ----------

/** 可嵌入的队形编辑器。tier 决定可用渲染模式;projectId/sceneName 决定云端场景归属。 */
export function Formation3DEditor({
  maleCount,
  femaleCount,
  className,
  tier = "free",
  projectId = null,
  sceneName = "default",
}: {
  maleCount?: number;
  femaleCount?: number;
  className?: string;
  tier?: MembershipTier;
  projectId?: string | null;
  sceneName?: string;
}) {
  const setRoster = useEditorStore((s) => s.setRoster);
  const setProject = useEditorStore((s) => s.setProject);
  const setRenderMode = useEditorStore((s) => s.setRenderMode);
  const renderMode = useEditorStore((s) => s.renderMode);
  const dotRef = useRef<DotSketchHandle | null>(null);

  const allowed = useMemo(() => getEntitlements(tier).previewModes, [tier]);

  // 绑定项目与名单;把渲染模式收敛到权限允许范围内
  useEffect(() => {
    setProject(projectId, sceneName);
  }, [projectId, sceneName, setProject]);

  useEffect(() => {
    if (maleCount !== undefined && femaleCount !== undefined && maleCount + femaleCount > 0) {
      setRoster(maleCount, femaleCount);
    }
  }, [maleCount, femaleCount, setRoster]);

  useEffect(() => {
    if (!allowed.includes(useEditorStore.getState().renderMode)) {
      setRenderMode(allowed[0] ?? "dot-sketch");
    }
  }, [allowed, setRenderMode]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#181b21] font-sans", className)}>
      <FormationsPanel />
      <PropertiesPanel />
      <TimelinePanel />
      <OcclusionPanel />
      <div className="absolute inset-0 z-0">
        {renderMode === "dot-sketch" ? (
          <DotSketchView ref={dotRef} />
        ) : renderMode === "stage-2.5d" ? (
          <Stage25DView />
        ) : (
          <Stage3DView />
        )}
      </div>
      <ModeToggle allowed={allowed} onExportPng={() => dotRef.current?.exportPng()} />
    </div>
  );
}

// ---------- 页面 ----------

export default function Formation3D() {
  return (
    <main className="h-screen w-full">
      <h1 className="sr-only">队形编辑器</h1>
      <Formation3DEditor />
    </main>
  );
}
