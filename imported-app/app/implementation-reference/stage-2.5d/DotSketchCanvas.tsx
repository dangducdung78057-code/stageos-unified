import { useEffect, useRef } from "react";
import { useStageStore } from "@/store/useStageStore";

const SCALE = 52;

export function DotSketchCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const performers = useStageStore((s) => s.performers);
  const selectedIds = useStageStore((s) => s.selectedIds);
  const selectOnly = useStageStore((s) => s.selectOnly);
  const updatePosition = useStageStore((s) => s.updatePosition);
  const dragging = useRef<string | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(rect.width * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = "#f7f7f4";
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.strokeStyle = "#d7d7d0";
      ctx.lineWidth = 1;
      for (let x = rect.width / 2 % SCALE; x < rect.width; x += SCALE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = 24; y < rect.height; y += SCALE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "#7a7a75";
      ctx.lineWidth = 2;
      ctx.strokeRect(22, 22, rect.width - 44, rect.height - 44);

      for (const performer of performers) {
        const x = rect.width / 2 + performer.position.x * SCALE;
        const y = rect.height - 58 - performer.position.z * SCALE;
        const selected = selectedIds.includes(performer.id);

        ctx.beginPath();
        ctx.arc(x, y, selected ? 10 : 7, 0, Math.PI * 2);
        ctx.fillStyle = "#111111";
        ctx.fill();

        if (selected) {
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.strokeStyle = "#d8a93b";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        ctx.fillStyle = "#222";
        ctx.font = "11px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(performer.id.replace("S0", ""), x, y - 13);
      }
    };

    draw();
  }, [performers, selectedIds]);

  function pointerToStage(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = ref.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - rect.width / 2) / SCALE,
      z: (rect.height - 58 - (event.clientY - rect.top)) / SCALE,
    };
  }

  function hit(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = ref.current!;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    return [...performers].reverse().find((performer) => {
      const x = rect.width / 2 + performer.position.x * SCALE;
      const y = rect.height - 58 - performer.position.z * SCALE;
      return Math.hypot(px - x, py - y) <= 18;
    });
  }

  return (
    <canvas
      ref={ref}
      className="stage-canvas"
      onPointerDown={(event) => {
        const performer = hit(event);
        dragging.current = performer?.id ?? null;
        selectOnly(performer?.id ?? null);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const next = pointerToStage(event);
        updatePosition(dragging.current, {
          x: Math.max(-6.5, Math.min(6.5, next.x)),
          z: Math.max(0.5, Math.min(7, next.z)),
          riserLevel: Math.max(0, Math.min(4, Math.round((next.z - 1) / 1.25))),
        });
      }}
      onPointerUp={(event) => {
        dragging.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      aria-label="免费版黑点队形草图"
    />
  );
}
