#!/usr/bin/env python3
"""StageOS 精灵入库校验器。

校验项（全部通过才允许入库）：
  1. 文件为 PNG 且含透明通道，且确实存在透明像素
  2. 画布尺寸符合规范集合（默认 128x192，可用 --sizes 覆盖）
  3. 锚点合规：角色最底部非透明像素的水平中心与画布中心偏差 ≤ --anchor-tol（默认 8px）
  4. 文件命名合规：{slot}/{id}_{direction}_{frame}.png
     slot      ∈ body|head|top|bottom|shoes|accessory
     direction ∈ front|back|left|right|front_left|front_right|back_left|back_right
     frame     ≥ 0 的整数

用法：
  python3 validate_sprite.py <sprite.png> [--sizes 128x192,64x96] [--anchor-tol 8]

输出：JSON {"file":..., "checks":{...}, "passed":bool}
退出码：0 全部通过；1 存在失败项；2 参数/文件错误
"""
import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SLOTS = {"body", "head", "top", "bottom", "shoes", "accessory"}
DIRECTIONS = {"front", "back", "left", "right",
              "front_left", "front_right", "back_left", "back_right"}
NAME_RE = re.compile(r"^(?P<slot>[a-z]+)/(?P<id>[a-z0-9-]+)_(?P<direction>[a-z_]+)_(?P<frame>\d+)\.png$")


def check_name(path: Path) -> dict:
    rel = path.parent.name + "/" + path.name
    m = NAME_RE.match(rel)
    if not m:
        return {"passed": False, "reason": f"命名应为 {{slot}}/{{id}}_{{direction}}_{{frame}}.png，实际 {rel}"}
    if m.group("slot") not in SLOTS:
        return {"passed": False, "reason": f"未知槽位 {m.group('slot')}"}
    if m.group("direction") not in DIRECTIONS:
        return {"passed": False, "reason": f"未知方向 {m.group('direction')}"}
    return {"passed": True, "slot": m.group("slot"), "direction": m.group("direction")}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("sprite")
    ap.add_argument("--sizes", default="128x192", help="允许的画布尺寸，逗号分隔")
    ap.add_argument("--anchor-tol", type=int, default=8, help="锚点水平偏差容忍像素")
    args = ap.parse_args()

    path = Path(args.sprite)
    if not path.is_file():
        print(f"文件不存在: {path}", file=sys.stderr)
        return 2
    allowed = {tuple(int(v) for v in s.split("x")) for s in args.sizes.split(",")}

    checks = {}
    try:
        im = Image.open(path)
    except Exception as e:  # noqa: BLE001
        print(f"无法读取图片: {e}", file=sys.stderr)
        return 2

    # 1. 格式与透明度
    ok_format = im.format == "PNG" and im.mode in ("RGBA", "LA")
    rgba = np.array(im.convert("RGBA"))
    has_transparent = bool((rgba[:, :, 3] < 250).any()) if ok_format else False
    checks["format_png_transparent"] = {"passed": ok_format and has_transparent}

    # 2. 画布尺寸
    checks["canvas_size"] = {"passed": im.size in allowed, "actual": f"{im.size[0]}x{im.size[1]}"}

    # 3. 锚点：最底部非透明像素的水平中心 ≈ 画布中心
    alpha = rgba[:, :, 3] > 10
    rows = np.where(alpha.any(axis=1))[0]
    if len(rows) == 0:
        checks["anchor_bottom_center"] = {"passed": False, "reason": "无可见像素"}
    else:
        bottom_row = rows.max()
        band = alpha[max(0, bottom_row - 4): bottom_row + 1]
        xs = np.where(band.any(axis=0))[0]
        foot_cx = float((xs.min() + xs.max()) / 2)
        dev = abs(foot_cx - im.size[0] / 2)
        checks["anchor_bottom_center"] = {
            "passed": bool(dev <= args.anchor_tol),
            "foot_center_x": round(foot_cx, 1),
            "canvas_center_x": im.size[0] / 2,
            "deviation_px": round(dev, 1),
        }

    # 4. 命名
    checks["naming"] = check_name(path)

    passed = all(c.get("passed") for c in checks.values())
    print(json.dumps({"file": str(path), "checks": checks, "passed": passed}, ensure_ascii=False, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
