// 舞台坐标 → 屏幕坐标投影(2.5D 伪透视)与深度排序。dot-sketch 与 stage-2.5d 共用。
// 舞台坐标:x 横向(米),z 纵向(米,正值朝观众/近处),riserLevel 台阶层级。
import { BOUND_X, BOUND_Z } from "./editor-core";

export type ScreenPoint = { sx: number; sy: number; scale: number };

/**
 * 将舞台坐标投影到屏幕。近处(z 大)偏下且更大,远处(z 小)偏上且更小,形成 2.5D 伪透视。
 * @param x 舞台横向(米)
 * @param z 舞台纵向(米)
 * @param riserLevel 台阶层级(每级抬高)
 * @param w 画布宽(CSS 像素)
 * @param h 画布高(CSS 像素)
 */
export function stageToScreen(x: number, z: number, riserLevel: number, w: number, h: number): ScreenPoint {
  const nx = (x + BOUND_X) / (BOUND_X * 2); // 0~1
  const nz = (z + BOUND_Z) / (BOUND_Z * 2); // 0(远)~1(近)
  const marginX = w * 0.08;
  const topY = h * 0.16;
  const botY = h * 0.9;
  // 远处横向收窄(透视会聚),近处铺满
  const converge = 0.62 + 0.38 * nz;
  const cx = w / 2;
  const sx = cx + (nx - 0.5) * (w - marginX * 2) * converge;
  const sy = topY + (botY - topY) * nz - riserLevel * (h * 0.05);
  const scale = 0.55 + 0.45 * nz;
  return { sx, sy, scale };
}

/** 深度排序:远处(z 小)先画,近处(z 大)后画覆盖;同 z 时台阶低的先画 */
export function depthSort<T extends { z: number; riserLevel: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.z - b.z || a.riserLevel - b.riserLevel);
}
