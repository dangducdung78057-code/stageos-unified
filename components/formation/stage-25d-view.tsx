// 会员 2.5D 渲染器:PixiJS(WebGL)。读取统一 store 的 {x,z,riserLevel},
// 经 stageToScreen 投影 + depthSort 后绘制人物精灵;素材缺失/加载失败显示占位块,不崩溃。
// 拖拽回写同一 store,与 3D 完全一致。此文件仅在切到 2.5D 时被动态加载(免费用户不拉取 Pixi)。
"use client";

import { useEffect, useRef, useState } from "react";
import type { Application, Container, Texture } from "pixi.js";
import { useEditorStore, BOUND_X, BOUND_Z, type Performer } from "./editor-core";
import { getSpriteManifest, resolveSpriteId } from "@/domain/stageos/sprite-manifest";
import { stageToScreen, depthSort } from "./projection";

type Node = {
  container: Container;
  setSelected: (v: boolean) => void;
  setOccluded: (v: boolean) => void;
  worldHeightCm: number;
};

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
        const spriteIds = new Set<string>();
        for (const p of perfs) {
          const id = resolveSpriteId({ gender: p.gender });
          if (id) spriteIds.add(id);
        }
        for (const id of spriteIds) {
          const m = getSpriteManifest(id);
          if (!m) continue;
          try {
            textures.set(id, await PIXI.Assets.load(m.directions.front));
          } catch {
            textures.set(id, null); // 加载失败 → 占位
          }
        }
        if (disposed) return;

        let dragId: string | null = null;
        const buildNode = (p: Performer): Node => {
          const container = new PIXI.Container();
          container.eventMode = "static";
          container.cursor = "pointer";

          const spriteId = resolveSpriteId({ gender: p.gender });
          const manifest = spriteId ? getSpriteManifest(spriteId) : null;
          const tex = spriteId ? textures.get(spriteId) : null;

          // 选中光圈
          const ring = new PIXI.Graphics();
          container.addChild(ring);

          let worldHeightCm = manifest?.worldHeightCm ?? p.heightCm;
          if (manifest && tex) {
            const sprite = new PIXI.Sprite(tex);
            sprite.anchor.set(manifest.anchor.x, manifest.anchor.y);
            sprite.label = "body";
            container.addChild(sprite);
          } else {
            // 占位:半透明柱 + 问号,明确提示素材缺失
            const g = new PIXI.Graphics();
            g.roundRect(-18, -120, 36, 120, 6).fill({ color: spriteId ? 0x3aa89e : 0x6b7280, alpha: 0.55 });
            g.label = "placeholder";
            container.addChild(g);
            const t = new PIXI.Text({
              text: spriteId ? "…" : "无素材",
              style: { fontSize: 11, fill: 0xffffff },
            });
            t.anchor.set(0.5, 0.5);
            t.position.set(0, -60);
            container.addChild(t);
          }

          const label = new PIXI.Text({ text: p.id, style: { fontSize: 12, fill: 0xdfe7ef } });
          label.anchor.set(0.5, 1);
          label.position.set(0, -125);
          container.addChild(label);

          container.on("pointerdown", (e) => {
            e.stopPropagation();
            useEditorStore.getState().select(p.id);
            dragId = p.id;
          });

          const setSelected = (v: boolean) => {
            ring.clear();
            if (v) ring.circle(0, -6, 22).stroke({ width: 3, color: 0x3aa89e });
          };
          const setOccluded = (v: boolean) => {
            ring.clear();
            if (v) ring.circle(0, -6, 18).stroke({ width: 3, color: 0xe5484d });
          };
          world.addChild(container);
          return { container, setSelected, setOccluded, worldHeightCm };
        };

        for (const p of perfs) nodes.set(p.id, buildNode(p));

        // 拖拽:世界坐标反投影回舞台坐标
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
            if (occlusions.has(p.id)) node.setOccluded(true);
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
