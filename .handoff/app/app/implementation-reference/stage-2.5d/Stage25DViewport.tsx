import { useEffect, useRef } from "react";
import {
  Application,
  Container,
  Graphics,
  Text,
  TextStyle,
} from "pixi.js";
import { useStageStore } from "@/store/useStageStore";
import type { Performer } from "@/domain/types";

type Projection = {
  x: number;
  y: number;
  scale: number;
  depth: number;
};

function project(
  performer: Performer,
  width: number,
  height: number,
): Projection {
  const depth = Math.max(0, Math.min(1, performer.position.z / 8));
  return {
    x: width / 2 + performer.position.x * 62 * (1 - depth * 0.1),
    y:
      height * 0.8 -
      performer.position.z * 45 -
      (performer.position.riserLevel ?? 0) * 24,
    scale: 1 - depth * 0.18,
    depth: performer.position.z + (performer.position.riserLevel ?? 0) * 0.15,
  };
}

function createPerformerGraphic(
  performer: Performer,
  selected: boolean,
): Container {
  const container = new Container();
  container.label = performer.id;
  container.eventMode = "static";
  container.cursor = "grab";

  const shadow = new Graphics()
    .ellipse(0, 5, 18, 5)
    .fill({ color: 0x000000, alpha: 0.18 });
  container.addChild(shadow);

  if (selected) {
    const ring = new Graphics()
      .ellipse(0, 3, 24, 9)
      .stroke({ color: 0xe0b448, width: 3, alpha: 1 });
    container.addChild(ring);
  }

  const body = new Graphics();
  const upper = Number.parseInt(performer.appearance.upperColor.slice(1), 16);
  const lower = Number.parseInt(performer.appearance.lowerColor.slice(1), 16);
  const shoe = Number.parseInt(performer.appearance.footwearColor.slice(1), 16);

  body.circle(0, -49, 10).fill({ color: 0xf0c5a4 });
  body.roundRect(-11, -39, 22, 29, 7).fill({ color: upper });

  if (performer.gender === "female") {
    body.poly([-12, -11, 12, -11, 17, 8, -17, 8]).fill({ color: lower });
  } else {
    body.rect(-10, -11, 8, 25).fill({ color: lower });
    body.rect(2, -11, 8, 25).fill({ color: lower });
  }

  body.rect(-9, 13, 7, 15).fill({ color: 0xf0c5a4 });
  body.rect(2, 13, 7, 15).fill({ color: 0xf0c5a4 });
  body.roundRect(-12, 26, 11, 5, 2).fill({ color: shoe });
  body.roundRect(1, 26, 11, 5, 2).fill({ color: shoe });
  body.roundRect(-10, -62, 20, 11, 6).fill({ color: 0x20252e });

  container.addChild(body);

  const label = new Text({
    text: `${performer.id.replace("S0", "")} · ${performer.heightCm}cm`,
    style: new TextStyle({
      fill: 0xf8fafc,
      fontSize: 10,
      fontFamily: "system-ui",
      fontWeight: "600",
      stroke: { color: 0x111827, width: 3 },
    }),
  });
  label.anchor.set(0.5, 1);
  label.y = -69;
  container.addChild(label);

  return container;
}

export function Stage25DViewport() {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const performers = useStageStore((s) => s.performers);
  const selectedIds = useStageStore((s) => s.selectedIds);
  const stage = useStageStore((s) => s.stage);
  const selectOnly = useStageStore((s) => s.selectOnly);
  const updatePosition = useStageStore((s) => s.updatePosition);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const app = new Application();
    appRef.current = app;

    void app.init({
      resizeTo: host,
      antialias: true,
      backgroundColor: 0x07111f,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    }).then(() => {
      if (cancelled) return;
      host.replaceChildren(app.canvas);
      app.canvas.className = "stage-canvas";
    });

    return () => {
      cancelled = true;
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    const host = hostRef.current;
    if (!app || !host || !app.renderer) return;

    app.stage.removeChildren();
    const width = host.clientWidth;
    const height = host.clientHeight;

    const backdrop = new Graphics()
      .rect(0, 0, width, height)
      .fill({ color: 0x07111f });
    app.stage.addChild(backdrop);

    const led = new Graphics()
      .roundRect(width * 0.18, height * 0.08, width * 0.64, height * 0.25, 18)
      .fill({ color: Number.parseInt(stage.backgroundColor.slice(1), 16) })
      .stroke({ color: 0x8fb7a3, alpha: 0.5, width: 2 });
    app.stage.addChild(led);

    const ledTitle = new Text({
      text: stage.ledTitle,
      style: new TextStyle({
        fill: 0xf5f1e8,
        fontFamily: "system-ui",
        fontSize: Math.max(14, width / 44),
        fontWeight: "600",
      }),
    });
    ledTitle.anchor.set(0.5);
    ledTitle.position.set(width / 2, height * 0.205);
    app.stage.addChild(ledTitle);

    const floor = new Graphics()
      .poly([
        width * 0.08,
        height * 0.86,
        width * 0.92,
        height * 0.86,
        width * 0.78,
        height * 0.33,
        width * 0.22,
        height * 0.33,
      ])
      .fill({ color: 0x29313b })
      .stroke({ color: 0x69717c, alpha: 0.65, width: 2 });
    app.stage.addChild(floor);

    for (let level = stage.riserLevels - 1; level >= 0; level -= 1) {
      const top = height * 0.49 + level * 54;
      const inset = 90 + level * 38;
      const riser = new Graphics()
        .roundRect(inset, top, width - inset * 2, 42, 7)
        .fill({ color: 0x414c59 })
        .stroke({ color: 0x718096, width: 1.5, alpha: 0.8 });
      app.stage.addChild(riser);
    }

    const peopleLayer = new Container();
    const projected = performers
      .map((performer) => ({
        performer,
        projection: project(performer, width, height),
      }))
      .sort((a, b) => b.projection.depth - a.projection.depth);

    for (const item of projected) {
      const figure = createPerformerGraphic(
        item.performer,
        selectedIds.includes(item.performer.id),
      );
      figure.position.set(item.projection.x, item.projection.y);
      figure.scale.set(item.projection.scale);
      figure.on("pointerdown", (event) => {
        dragId.current = item.performer.id;
        selectOnly(item.performer.id);
        event.stopPropagation();
      });
      peopleLayer.addChild(figure);
    }

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    app.stage.on("pointerup", () => {
      dragId.current = null;
    });
    app.stage.on("pointerupoutside", () => {
      dragId.current = null;
    });
    app.stage.on("pointermove", (event) => {
      if (!dragId.current) return;
      const p = event.global;
      const x = (p.x - width / 2) / 62;
      const z = (height * 0.8 - p.y) / 45;
      updatePosition(dragId.current, {
        x: Math.max(-6.5, Math.min(6.5, x)),
        z: Math.max(0.5, Math.min(7.2, z)),
        riserLevel: Math.max(0, Math.min(4, Math.round((z - 1) / 1.25))),
      });
    });
    app.stage.addChild(peopleLayer);

    const audience = new Text({
      text: "观众席 ↓",
      style: new TextStyle({
        fill: 0x9fb3c8,
        fontSize: 13,
        fontFamily: "system-ui",
      }),
    });
    audience.anchor.set(0.5);
    audience.position.set(width / 2, height - 18);
    app.stage.addChild(audience);
  }, [performers, selectedIds, stage, selectOnly, updatePosition]);

  return <div ref={hostRef} className="stage-host" aria-label="会员 2.5D 舞台预览" />;
}
