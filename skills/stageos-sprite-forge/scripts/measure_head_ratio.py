#!/usr/bin/env python3
"""测量角色参考图的头身比（总身高像素 / 头高像素）。

用途：StageOS 精灵制作的年龄比例质量门。
  - 10 岁（四年级）目标 ≈ 6.5 头身
  - 7-8 岁 ≈ 5.5-6.0 头身
  - 6-7 岁 ≈ 5.0-5.5 头身
  - Q 版卡通 ≈ 3.5-4.5 头身
判定阈值由调用方按风格预设决定，本脚本只输出测量值。

注意：背景必须是逐行估计的（--mode row），纯色背景截图常见纵向
渐变，用单一全局背景色会把背景误判为角色，导致头身比虚高
（真实案例：渐变灰底 + 全局色测量得出 6.45，逐行测量实际 5.60）。

用法：
  python3 measure_head_ratio.py <image> [--tol N] [--neck-start F] [--neck-end F]

  --tol        与行内背景色差异容差（默认 60，三通道差值求和）
  --neck-start 颈部搜索区起点（身高比例，默认 0.06）
  --neck-end   颈部搜索区终点（身高比例，默认 0.28）

输出：JSON {"total_px": int, "head_px": int, "ratio": float}
退出码：0 成功；1 未检测到角色；2 参数/文件错误
"""
import argparse
import json
import sys

import numpy as np
from PIL import Image


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--tol", type=int, default=60)
    ap.add_argument("--neck-start", type=float, default=0.06)
    ap.add_argument("--neck-end", type=float, default=0.28)
    ap.add_argument("--margin", type=int, default=15,
                    help="逐行背景估计用的左右边缘宽度（像素）")
    args = ap.parse_args()

    try:
        img = np.array(Image.open(args.image).convert("RGB")).astype(int)
    except Exception as e:  # noqa: BLE001
        print(f"无法读取图片: {e}", file=sys.stderr)
        return 2

    h = img.shape[0]
    if img.shape[1] < args.margin * 4:
        print("图像过窄，无法估计行背景", file=sys.stderr)
        return 2

    # 逐行背景估计：每行取左右边缘像素的中位数（抗渐变背景）
    left_edge = img[:, : args.margin].reshape(h, -1, 3)
    right_edge = img[:, -args.margin:].reshape(h, -1, 3)
    bg_row = np.median(np.concatenate([left_edge, right_edge], axis=1), axis=1)

    diff = np.abs(img - bg_row[:, None, :]).sum(axis=2)
    mask = diff > args.tol
    rows = np.where(mask.any(axis=1))[0]
    if len(rows) == 0:
        print("未检测到角色（整图都被判为背景）", file=sys.stderr)
        return 1

    top, bottom = int(rows.min()), int(rows.max())
    total_h = bottom - top
    widths = mask.sum(axis=1)
    region = range(top + int(total_h * args.neck_start), top + int(total_h * args.neck_end))
    if not region:
        print("角色区域过小，无法定位颈部", file=sys.stderr)
        return 1
    neck_y = min(region, key=lambda y: widths[y])
    head_h = neck_y - top
    if head_h <= 0:
        print("头高测量异常", file=sys.stderr)
        return 1

    print(json.dumps({
        "total_px": total_h,
        "head_px": int(head_h),
        "ratio": round(total_h / head_h, 2),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
