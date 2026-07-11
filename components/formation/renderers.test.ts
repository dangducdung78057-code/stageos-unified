import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { depthSort, stageToScreen } from "./projection";

const root = process.cwd();

describe("跨渲染器坐标约定", () => {
  it("同一舞台坐标投影结果稳定", () => {
    const a = stageToScreen(2, 1, 0, 1000, 700);
    const b = stageToScreen(2, 1, 0, 1000, 700);
    expect(a).toEqual(b);
  });

  it("2.5D 深度排序遵循后远前近", () => {
    const sorted = depthSort<{ id: string; z: number; riserLevel: number }>([
      { id: "near", z: 4, riserLevel: 0 },
      { id: "far", z: -4, riserLevel: 0 },
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["far", "near"]);
  });

  it("2.5D 与 3D 都从同一 useEditorStore 读取和回写", () => {
    const pixi = readFileSync(resolve(root, "components/formation/stage-25d-view.tsx"), "utf8");
    const three = readFileSync(resolve(root, "components/formation/stage-3d-view.tsx"), "utf8");
    expect(pixi).toContain("useEditorStore.getState().move");
    expect(three).toContain("useEditorStore");
    expect(three).toContain("move(");
  });

  it("免费 shell 通过 dynamic import 隔离 PixiJS 与 Three.js chunk", () => {
    const shell = readFileSync(resolve(root, "components/formation-3d-editor.tsx"), "utf8");
    expect(shell).toContain("dynamic(() => import(\"@/components/formation/stage-25d-view\")");
    expect(shell).toContain("dynamic(() => import(\"@/components/formation/stage-3d-view\")");
    expect(shell).not.toMatch(/from ["']pixi\.js["']/);
    expect(shell).not.toMatch(/from ["']three["']/);
  });

  it("2.5D 从人物真实状态解析方向与四区换色", () => {
    const pixi = readFileSync(resolve(root, "components/formation/stage-25d-view.tsx"), "utf8");
    expect(pixi).toContain("p.spriteId ?? resolveSpriteId");
    expect(pixi).toContain("resolveSpriteAssets(manifest, p.direction)");
    expect(pixi).toContain("assets.masks[region]");
    expect(pixi).toContain("node.setAppearance(p.appearance)");
    expect(pixi).toContain('overlay.blendMode = "normal"');
  });

  it("Canvas PNG 导出生成下载链接且不是空实现", () => {
    const source = readFileSync(resolve(root, "components/formation/dot-sketch-view.tsx"), "utf8");
    expect(source).toContain('canvas.toDataURL("image/png")');
    expect(source).toContain('a.download = "队形草图.png"');
    expect(source).toContain("a.click()");
  });
});
