import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const validator = resolve(process.cwd(), "scripts/validate-character-assets.mjs");

function developmentManifest() {
  return {
    schemaVersion: 2,
    assetVersion: "draft-test-1",
    characterId: "test-character",
    spriteId: "test-character-basic-white",
    variantId: "basic-white",
    style: "2.5d-semi-realistic",
    assetStatus: "development",
    placeholder: true,
    productionReady: false,
    regions: {
      upper: { enabled: true },
      lower: { enabled: true },
      footwear: { enabled: true },
      accent: { enabled: false },
    },
    productionBlockers: ["测试素材尚未交付"],
    worldHeightCm: 150,
    canvas: {
      width: 1024,
      height: 1536,
      unit: "px",
      origin: "top-left",
      footBaselineY: null,
      anchorX: 0.5,
      anchorY: null,
      alignment: "center-bottom",
    },
    views: Object.fromEntries(["front", "front-left", "front-right"].map((direction) => [
      direction,
      { image: null, masks: { upper: null, lower: null, footwear: null, accent: null } },
    ])),
  };
}

function writeFixture(manifest: ReturnType<typeof developmentManifest>) {
  const root = mkdtempSync(join(tmpdir(), "stageos-character-validator-"));
  const variant = join(root, "test-character", "basic-white");
  mkdirSync(variant, { recursive: true });
  writeFileSync(join(variant, "manifest.json"), JSON.stringify(manifest));
  return root;
}

describe("2.5D character asset validator", () => {
  it("accepts all checked-in production character packages", () => {
    expect(() => execFileSync(process.execPath, [validator], { stdio: "pipe" })).not.toThrow();
  });

  it("accepts a safe Development skeleton with actionable blockers", () => {
    const root = writeFixture(developmentManifest());
    expect(() => execFileSync(process.execPath, [validator, "--root", root], { stdio: "pipe" })).not.toThrow();
  });

  it("rejects contradictory Production state before inspecting assets", () => {
    const manifest = developmentManifest();
    Object.assign(manifest, {
      assetStatus: "production",
      placeholder: true,
      productionReady: false,
      productionBlockers: ["过期阻塞项"],
    });
    const root = writeFixture(manifest);
    expect(() => execFileSync(process.execPath, [validator, "--root", root], { stdio: "pipe" })).toThrow();
  });
});
