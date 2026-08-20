#!/usr/bin/env python3
"""StageOS 室内大屏光源反射计算器。

把 LED 大屏视为角色背后的主导彩色光源，计算精灵各分区的重着色值
（配合渲染层 multiply tint 使用）。分区模型：
  - rim（轮廓光区）：大屏直射角色背部/侧缘，受屏色影响最强
  - front_fill（面光区）：舞台面光被屏环境光部分中和，弱混合
  - floor_bounce（地面反光区）：屏色经地板反射打亮角色下部
  - ambient（环境提升）：整体暗部被屏光提亮

用法：
  python3 screen_tint.py --color "#3B82F6" --intensity 0.8 [--base "#FFFFFF"] [--floor "#8B8B8B"]

  --color     大屏主色（hex）
  --intensity 屏光强度 0-1（相对舞台总照明）
  --base      精灵固有色（默认白，对应 sprite-forge 白底规范）
  --floor     地板颜色（参与反光计算）

输出：JSON {zones: {rim, front_fill, floor_bounce, ambient}, 每项 {hex, mix}}
退出码：0 成功；2 参数错误。
"""
import argparse
import json
import re
import sys

ZONE_MIX = {  # 各分区屏色混合系数（再乘 intensity）
    "rim": 0.85,
    "front_fill": 0.25,
    "floor_bounce": 0.45,
    "ambient": 0.15,
}


def parse_hex(s: str):
    m = re.fullmatch(r"#?([0-9A-Fa-f]{6})", s.strip())
    if not m:
        raise ValueError(f"非法颜色: {s}")
    v = m.group(1)
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def to_hex(c) -> str:
    return "#{:02X}{:02X}{:02X}".format(*(max(0, min(255, round(x))) for x in c))


def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--color", required=True)
    ap.add_argument("--intensity", type=float, required=True)
    ap.add_argument("--base", default="#FFFFFF")
    ap.add_argument("--floor", default="#8B8B8B")
    args = ap.parse_args()

    try:
        screen = parse_hex(args.color)
        base = parse_hex(args.base)
        floor = parse_hex(args.floor)
    except ValueError as e:
        print(e, file=sys.stderr)
        return 2
    if not 0 <= args.intensity <= 1:
        print("--intensity 必须在 0-1", file=sys.stderr)
        return 2

    bounce_src = lerp(screen, floor, 0.5)

    zones = {}
    for name, coef in ZONE_MIX.items():
        t = round(coef * args.intensity, 3)
        src = bounce_src if name == "floor_bounce" else screen
        zones[name] = {"hex": to_hex(lerp(base, src, t)), "mix": t}

    print(json.dumps({
        "screen_color": to_hex(screen),
        "intensity": args.intensity,
        "zones": zones,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
