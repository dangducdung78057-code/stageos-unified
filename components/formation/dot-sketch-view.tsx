// 免费黑点草图渲染器:纯 HTML Canvas 2D,零 Three/Pixi 依赖。
// 与 3D/2.5D 共用同一份 store 状态,只更换 renderer。支持点击选中、拖拽、DPR 高清、PNG 导出。
"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { useEditorStore, BOUND_X, BOUND_Z, type Performer } from "./editor-core";

export type DotSketchHandle = { exportPng: () => void };

function layout(w: number, h: number) {
  const pad = 28;
  const labelH = 26;
  return {
    sx: (x: number) => pad + ((x + BOUND_X) / (BOUND_X * 2)) * (w - pad * 2),
    sy: (z: number) => pad + ((z + BOUND_Z) / (BOUND_Z * 2)) * (h - pad * 2 - labelH),
    inv: (px: number, pz: number) => ({
      x: ((px - pad) / (w - pad * 2)) * (BOUND_X * 2) - BOUND_X,
      z: ((pz - pad) / (h - pad * 2 - labelH)) * (BOUND_Z * 2) - BOUND_Z,
    }),
    pad,
  };
}

export const DotSketchView = forwardRef<DotSketchHandle>(function DotSketchView(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const dragIdRef = useRef<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    const { performers, occlusions, selectedId } = useEditorStore.getState();
    const L = layout(w, h);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f5f3ee";
    ctx.fillRect(0, 0, w, h);
    // 舞台边框
    ctx.strokeStyle = "#22262e";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(L.pad, L.pad, w - L.pad * 2, h - L.pad * 2 - 26);
    // 观众方向标注
    ctx.fillStyle = "#22262e";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("观众席 / 评委方向 ↓", w / 2, h - 8);

    for (const p of performers) {
      const cx = L.sx(p.x);
      const cy = L.sy(p.z);
      const sel = p.id === selectedId;
      const occ = occlusions.has(p.id);
      ctx.beginPath();
      ctx.arc(cx, cy, sel ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = occ ? "#d24b43" : "#22262e";
      ctx.fill();
      if (sel) {
        ctx.strokeStyle = "#3aa89e";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }
  }, []);

  // 尺寸 + DPR 高清适配
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  // 订阅 store 变化重绘
  useEffect(() => useEditorStore.subscribe(draw), [draw]);

  const pick = useCallback((clientX: number, clientY: number): Performer | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    const L = layout(w, h);
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const { performers } = useEditorStore.getState();
    let best: Performer | null = null;
    let bestD = 14 * 14;
    for (const p of performers) {
      const dx = L.sx(p.x) - px;
      const dy = L.sy(p.z) - py;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const hit = pick(e.clientX, e.clientY);
    const { select } = useEditorStore.getState();
    select(hit ? hit.id : null);
    if (hit) {
      dragIdRef.current = hit.id;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragIdRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    const L = layout(w, h);
    const { x, z } = L.inv(e.clientX - rect.left, e.clientY - rect.top);
    useEditorStore.getState().move(dragIdRef.current, x, z);
  };
  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragIdRef.current) {
      dragIdRef.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };

  useImperativeHandle(ref, () => ({
    exportPng: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "队形草图.png";
      a.click();
    },
  }));

  return (
    <div ref={wrapRef} className="h-full w-full bg-[#f5f3ee]">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="touch-none"
        role="img"
        aria-label="黑点草图站位视图,可拖拽调整站位"
      />
    </div>
  );
});
