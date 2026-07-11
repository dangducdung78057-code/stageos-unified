// 会员 2.5D 渲染器:PixiJS(WebGL)。读取统一 store 的 {x,z,riserLevel},
// 经 stageToScreen 投影 + depthSort 后绘制人物精灵;素材缺失/加载失败显示占位块,不崩溃。
// 拖拽回写同一 store,与 3D 完全一致。此文件仅在切到 2.5D 时被动态加载(免费用户不拉取 Pixi)。
"use client";

import { useEffect, useRef, useState } from "react";
import type { Application, Container, Sprite, Texture } from "pixi.js";
import { useEditorStore, BOUND_X, BOUND_Z, type Performer } from "./editor-core";
import {
  getSpriteManifest,
  resolveSpriteAssets,
  resolveSpriteId,
  type AppearanceRegion,
} from "@/domain/stageos/sprite-manifest";
import { stageToScreen, depthSort } from "./projection";

type Appearance = Performer["appearance"];

type Node = {
  container: Container;
  setSelected: (v: boolean) => void;
  setOccluded: (v: boolean) => void;
  setAppearance: (appearance: Appearance) => void;
  worldHeightCm: number;
};

const REGION_COLOR: Record<AppearanceRegion, keyof Appearance> = {
  upper: "upperColor",
  lower: "lowerColor",
  footwear: "footwearColor",
  accent: "accentColor",
};

function colorToNumber(color: string | null | undefined): number {
  if (!color) return 0xffffff;
  const normalized = color.replace("#", "");
  return Number.parseInt(normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized, 16) || 0xffffff;
}

/** 1.6m 身高的人在透视系数=1 时的基准屏幕像素高度 */
const BASE_PX = 150;

export function Stage25DView() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<string>("正在加载 2.5D 渲染器…");

  useEffect(() => {
    let app: Application | null = null;
    let disposed = false;
    const nodes = new Map<string, Node>();
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const PIXI = await import("pixi.js");
        if (disposed) return;
        const wrap = wrapRef.current;
        if (!wrap) return;

        app = new PIXI.Application();
        await app.init({
          resizeTo: wrap,
          antialias: true,
          backgroundColor: 0x1a1e26,
          resolution: Math.min(window.devicePixelRatio || 1, 3),
          autoDensity: true,
        });
        if (disposed) {
          app.destroy(true);
          return;
        }
        wrap.appendChild(app.canvas);

        const world = new PIXI.Container();
        app.stage.addChild(world);

        // 预加载出现过的精灵纹理(失败不阻塞,回退占位)
        const textures = new Map<string, Texture | null>();
        const perfs = useEditorStore.getState().performers;
        const textureUrls = new Set<string>();
        const assetsFor = (p: Performer) => {
          const id = p.spriteId ?? resolveSpriteId({ gender: p.gender });
          const manifest = getSpriteManifest(id);
          return manifest ? { manifest, ...resolveSpriteAssets(manifest, p.direction) } : null;
        };
        for (const p of perfs) {
          const assets = assetsFor(p);
          if (!assets) continue;
          textureUrls.add(assets.image);
          Object.entries(assets.masks).forEach(([region, url]) => {
            if (url) {
              textureUrls.add(url);
            } else if (process.env.NODE_ENV !== "production") {
              console.warn(`[StageOS 2.5D] ${assets.manifest.spriteId}/${assets.direction} 缺少 ${region} 遮罩,该区域将保留原画颜色。`);
            }
          });
        }
        for (const url of textureUrls) {
          try {
            textures.set(url, await PIXI.Assets.load(url));
          } catch {
            textures.set(url, null); // 加载失败 → 占位
          }
        }
        if (disposed) return;

        let dragId: string | null = null;
        const buildNode = (p: Performer): Node => {
          const container = new PIXI.Container();
          container.eventMode = "static";
          container.cursor = "pointer";

          const assets = assetsFor(p);
          const manifest = assets?.manifest ?? null;
          const tex = assets ? textures.get(assets.image) : null;
          const overlays = new Map<AppearanceRegion, Sprite>();

          // 选中光圈
          const ring = new PIXI.Graphics();
          container.addChild(ring);

          const worldHeightCm = manifest?.worldHeightCm ?? p.heightCm;
          // 归一化:1.6m 的人在透视系数=1 时约占 BASE_PX 像素高,按实际身高等比缩放
          const bodyPx = BASE_PX * (worldHeightCm / 160);
          if (manifest && tex && assets) {
            const sprite = new PIXI.Sprite(tex);
            sprite.anchor.set(manifest.anchor.x, manifest.anchor.y);
            // 纹理原生高度可能上千像素,按目标身高像素归一化到 bodyPx
            sprite.scale.set(bodyPx / (tex.height || bodyPx));
            sprite.label = "body";
            container.addChild(sprite);

            // 灰度遮罩与底图同锚点、同缩放叠放；只给对应服装区域着色，保留原图明暗。
            for (const region of Object.keys(REGION_COLOR) as AppearanceRegion[]) {
              const maskUrl = assets.masks[region];
              const maskTexture = maskUrl ? textures.get(maskUrl) : null;
              if (!maskTexture) continue;
              const overlay = new PIXI.Sprite(maskTexture);
              overlay.anchor.set(manifest.anchor.x, manifest.anchor.y);
              overlay.scale.set(bodyPx / (maskTexture.height || bodyPx));
              // 候选 mask 为纯白二值 Alpha；使用普通叠加 + tint，避免 multiply 产生矩形伪影。
              overlay.blendMode = "normal";
              overlay.alpha = 0.82;
              overlay.label = `mask-${region}`;
              overlays.set(region, overlay);
              container.addChild(overlay);
            }
          } else {
            // 占位:半透明柱 + 问号,明确提示素材缺失
            const g = new PIXI.Graphics();
            g.roundRect(-bodyPx * 0.15, -bodyPx, bodyPx * 0.3, bodyPx, 6).fill({ color: manifest ? 0x3aa89e : 0x6b7280, alpha: 0.55 });
            g.label = "placeholder";
            container.addChild(g);
            const t = new PIXI.Text({
              text: manifest ? "素材缺失" : "无素材",
              style: { fontSize: 11, fill: 0xffffff },
            });
            t.anchor.set(0.5, 0.5);
            t.position.set(0, -bodyPx * 0.5);
            container.addChild(t);
          }

          const label = new PIXI.Text({ text: p.id, style: { fontSize: 11, fill: 0xdfe7ef } });
          label.anchor.set(0.5, 1);
          label.position.set(0, -bodyPx - 6);
          container.addChild(label);

          container.on("pointerdown", (e) => {
            e.stopPropagation();
            useEditorStore.getState().select(p.id);
            dragId = p.id;
          });

          const rr = Math.max(14, bodyPx * 0.16);
          const setSelected = (v: boolean) => {
            ring.clear();
            if (v) ring.ellipse(0, -2, rr, rr * 0.5).stroke({ width: 2.5, color: 0x3aa89e });
          };
          const setOccluded = (v: boolean) => {
            ring.clear();
            if (v) ring.ellipse(0, -2, rr * 0.9, rr * 0.45).stroke({ width: 2.5, color: 0xe5484d });
          };
          const setAppearance = (appearance: Appearance) => {
            for (const [region, overlay] of overlays) {
              const color = appearance[REGION_COLOR[region]];
              overlay.tint = colorToNumber(color);
              overlay.visible = Boolean(color);
            }
          };
          setAppearance(p.appearance);
          world.addChild(container);
          return { container, setSelected, setOccluded, setAppearance, worldHeightCm };
        };

        for (const p of perfs) nodes.set(p.id, buildNode(p));

        // 拖拽：世界坐标反投影回舞台坐标
        const toStage = (px: number, py: number) => {
          const w = app!.renderer.width / app!.renderer.resolution;
          const h = app!.renderer.height / app!.renderer.resolution;
          // 近似反投影(与 stageToScreen 对偶):先解 z,再解 x
          const topY = h * 0.16;
          const botY = h * 0.9;
          const nz = Math.max(0, Math.min(1, (py - topY) / (botY - topY)));
          const z = nz * (BOUND_Z * 2) - BOUND_Z;
          const converge = 0.62 + 0.38 * nz;
          const marginX = w * 0.08;
          const nx = (px - w / 2) / ((w - marginX * 2) * converge) + 0.5;
          const x = nx * (BOUND_X * 2) - BOUND_X;
          return { x, z };
        };
        app.stage.eventMode = "static";
        app.stage.hitArea = app.screen;
        app.stage.on("pointerdown", () => useEditorStore.getState().select(null));
        app.stage.on("pointermove", (e) => {
          if (!dragId) return;
          const { x, z } = toStage(e.global.x, e.global.y);
          useEditorStore.getState().move(dragId, x, z);
        });
        const stop = () => {
          dragId = null;
        };
        app.stage.on("pointerup", stop);
        app.stage.on("pointerupoutside", stop);

        const render = () => {
          if (!app) return;
          const w = app.renderer.width / app.renderer.resolution;
          const h = app.renderer.height / app.renderer.resolution;
          const { performers, occlusions, selectedId } = useEditorStore.getState();
          const ordered = depthSort(performers);
          let zi = 0;
          for (const p of ordered) {
            const node = nodes.get(p.id);
            if (!node) continue;
            const { sx, sy, scale } = stageToScreen(p.x, p.z, p.riserLevel, w, h);
            node.container.position.set(sx, sy);
            node.container.scale.set(scale);
            node.container.zIndex = zi++;
            node.setSelected(p.id === selectedId);
            node.setOccluded(occlusions.has(p.id));
            node.setAppearance(p.appearance);
          }
          world.sortableChildren = true;
        };

        render();
        unsub = useEditorStore.subscribe(render);
        app.ticker.add(render);
        setStatus("");
      } catch (err) {
        console.log("[v0] 2.5D 渲染器初始化失败:", err instanceof Error ? err.message : String(err));
        setStatus("2.5D 渲染器加载失败,请刷新重试(已回退,不影响其他模式)。");
      }
    })();

    return () => {
      disposed = true;
      unsub?.();
      if (app) {
        try {
          app.destroy(true);
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={wrapRef} className="h-full w-full" />
      {status ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-md bg-[#11141a]/85 px-4 py-2 text-sm text-[#9fb3c8]">{status}</span>
        </div>
      ) : null}
    </div>
  );
}
