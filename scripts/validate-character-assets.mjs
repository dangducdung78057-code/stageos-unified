import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootArgumentIndex = process.argv.indexOf("--root");
const rootArgument = rootArgumentIndex >= 0 ? process.argv[rootArgumentIndex + 1] : undefined;
if (rootArgumentIndex >= 0 && !rootArgument) {
  console.error("--root 需要目录参数");
  process.exit(2);
}
const ROOT = path.resolve(process.cwd(), rootArgument ?? "public/assets/stage-2.5d/characters");
const DIRECTIONS = ["front", "front-left", "front-right"];
const DIRECTION_ALIASES = {
  front: ["front"],
  "front-left": ["front-left", "frontLeft"],
  "front-right": ["front-right", "frontRight"],
};
const REGIONS = ["upper", "lower", "footwear", "accent"];
const PNG_SIGNATURE = "89504e470d0a1a0a";
const errors = [];

function fail(manifestPath, message) {
  errors.push(`${path.relative(process.cwd(), manifestPath)}: ${message}`);
}

async function findManifests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return findManifests(target);
    return entry.isFile() && entry.name === "manifest.json" ? [target] : [];
  }));
  return nested.flat();
}

function isSafeRelativeAssetPath(value) {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  return normalized !== ".." && !normalized.startsWith("../") && !normalized.includes("/../");
}

async function inspectPng(manifestPath, assetPath, canvas) {
  let buffer;
  try {
    buffer = await readFile(assetPath);
  } catch {
    fail(manifestPath, `缺少资源 ${path.relative(path.dirname(manifestPath), assetPath)}`);
    return;
  }

  if (buffer.length < 33 || buffer.subarray(0, 8).toString("hex") !== PNG_SIGNATURE) {
    fail(manifestPath, `${path.basename(assetPath)} 不是有效 PNG`);
    return;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  if (width !== canvas.width || height !== canvas.height) {
    fail(manifestPath, `${path.basename(assetPath)} 尺寸 ${width}x${height} 与画布 ${canvas.width}x${canvas.height} 不一致`);
  }
  if (bitDepth !== 8 || colorType !== 6) {
    fail(manifestPath, `${path.basename(assetPath)} 必须为 8-bit RGBA PNG（当前 bitDepth=${bitDepth}, colorType=${colorType}）`);
  }
}

function validateState(manifestPath, manifest) {
  // schemaVersion 2 的首个封板角色没有显式 blockers；仅把缺省值视为无阻塞，
  // 新模板和后续角色仍必须显式声明该字段。
  const blockers = manifest.productionBlockers ?? (manifest.assetStatus === "production" ? [] : undefined);
  if (!Array.isArray(blockers)) {
    fail(manifestPath, "productionBlockers 必须是数组");
    return;
  }

  if (manifest.assetStatus === "development") {
    if (manifest.placeholder !== true || manifest.productionReady !== false) {
      fail(manifestPath, "Development 必须满足 placeholder=true 且 productionReady=false");
    }
    if (blockers.length === 0 || blockers.some((item) => typeof item !== "string" || item.trim() === "")) {
      fail(manifestPath, "Development 必须至少包含一条非空 productionBlocker");
    }
    return;
  }

  if (manifest.assetStatus === "production") {
    if (manifest.placeholder !== false || manifest.productionReady !== true) {
      fail(manifestPath, "Production 必须满足 placeholder=false 且 productionReady=true");
    }
    if (blockers.length !== 0) fail(manifestPath, "Production 的 productionBlockers 必须为空");
    return;
  }

  fail(manifestPath, `不支持的 assetStatus: ${String(manifest.assetStatus)}`);
}

async function validateManifest(manifestPath) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    fail(manifestPath, `JSON 无法解析: ${error.message}`);
    return;
  }

  const variantDirectory = path.dirname(manifestPath);
  const characterDirectory = path.dirname(variantDirectory);
  const expectedCharacterId = path.basename(characterDirectory);
  const expectedVariantId = path.basename(variantDirectory);
  const expectedSpriteId = `${expectedCharacterId}-${expectedVariantId}`;

  if (manifest.schemaVersion !== 2) fail(manifestPath, "schemaVersion 必须为 2");
  if (manifest.style !== "2.5d-semi-realistic") fail(manifestPath, "style 必须为 2.5d-semi-realistic");
  if (manifest.characterId !== expectedCharacterId) fail(manifestPath, `characterId 必须为 ${expectedCharacterId}`);
  if (manifest.variantId !== expectedVariantId) fail(manifestPath, `variantId 必须为 ${expectedVariantId}`);
  if (manifest.spriteId !== expectedSpriteId) fail(manifestPath, `spriteId 必须为 ${expectedSpriteId}`);
  validateState(manifestPath, manifest);

  const canvas = manifest.canvas ?? {};
  if (!Number.isInteger(canvas.width) || canvas.width <= 0 || !Number.isInteger(canvas.height) || canvas.height <= 0) {
    fail(manifestPath, "canvas.width/height 必须为正整数");
  }
  if (canvas.origin !== "top-left" || canvas.alignment !== "center-bottom") {
    fail(manifestPath, "canvas 必须使用 top-left / center-bottom");
  }
  if (canvas.anchorX !== 0.5) fail(manifestPath, "canvas.anchorX 必须为 0.5");
  if (typeof manifest.worldHeightCm !== "number" || manifest.worldHeightCm <= 0) {
    fail(manifestPath, "worldHeightCm 必须为正数");
  }

  const calibrated = Number.isFinite(canvas.footBaselineY) && Number.isFinite(canvas.anchorY);
  if (manifest.assetStatus === "production" && !calibrated) fail(manifestPath, "Production 必须校准 footBaselineY 和 anchorY");
  if (calibrated) {
    if (canvas.footBaselineY < 0 || canvas.footBaselineY > canvas.height) fail(manifestPath, "footBaselineY 超出画布");
    if (canvas.anchorY < 0 || canvas.anchorY > 1) fail(manifestPath, "anchorY 必须在 0 到 1 之间");
    if (Math.abs(canvas.anchorY - canvas.footBaselineY / canvas.height) > 1e-9) {
      fail(manifestPath, "anchorY 必须等于 footBaselineY / canvas.height");
    }
  }

  // 早期封板 primary-girl 未显式声明 regions，等价于四区全部启用。
  const regions = manifest.regions ?? Object.fromEntries(REGIONS.map((region) => [region, { enabled: true }]));
  const regionKeys = Object.keys(regions).sort();
  if (JSON.stringify(regionKeys) !== JSON.stringify([...REGIONS].sort())) {
    fail(manifestPath, `regions 必须且只能包含 ${REGIONS.join(", ")}`);
  }
  const views = manifest.views ?? {};
  const resolvedViews = {};
  const consumedViewKeys = new Set();
  for (const direction of DIRECTIONS) {
    const aliases = DIRECTION_ALIASES[direction].filter((key) => Object.hasOwn(views, key));
    if (aliases.length !== 1) fail(manifestPath, `${direction} 必须且只能声明一种方向键格式`);
    if (aliases[0]) {
      resolvedViews[direction] = views[aliases[0]];
      consumedViewKeys.add(aliases[0]);
    }
  }
  if (consumedViewKeys.size !== Object.keys(views).length) {
    fail(manifestPath, "views 包含未知或重复方向键");
  }

  const assets = new Set();
  for (const direction of DIRECTIONS) {
    const view = resolvedViews[direction];
    if (!view || typeof view !== "object") continue;
    const paths = [["image", view.image]];
    const maskKeys = Object.keys(view.masks ?? {}).sort();
    if (JSON.stringify(maskKeys) !== JSON.stringify([...REGIONS].sort())) {
      fail(manifestPath, `${direction}.masks 必须且只能包含 ${REGIONS.join(", ")}`);
    }

    for (const region of REGIONS) {
      const enabled = regions[region]?.enabled;
      if (typeof enabled !== "boolean") fail(manifestPath, `regions.${region}.enabled 必须为布尔值`);
      const mask = view.masks?.[region];
      if (enabled) paths.push([`${region} mask`, mask]);
      else if (mask !== null) fail(manifestPath, `${direction} 的禁用区域 ${region} mask 必须为 null`);
    }

    for (const [label, asset] of paths) {
      if (asset === null && manifest.assetStatus === "development") continue;
      if (!isSafeRelativeAssetPath(asset)) {
        fail(manifestPath, `${direction} ${label} 必须是包内安全相对路径`);
        continue;
      }
      const absolute = path.resolve(variantDirectory, asset);
      if (!absolute.startsWith(`${variantDirectory}${path.sep}`)) {
        fail(manifestPath, `${direction} ${label} 越出角色包目录`);
        continue;
      }
      assets.add(absolute);
    }
  }

  await Promise.all([...assets].map((asset) => inspectPng(manifestPath, asset, canvas)));
}

const manifests = (await findManifests(ROOT)).sort();
await Promise.all(manifests.map(validateManifest));

if (errors.length > 0) {
  console.error(`角色资产校验失败（${errors.length} 项）:`);
  for (const error of errors.sort()) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`角色资产校验通过：${manifests.length} 个 Manifest。`);
