#!/usr/bin/env python3
"""StageOS 导演分镜表校验器。

校验一份分镜脚本（JSON）是否可执行：
  1. 结构：sections 非空；每段含 t_start/t_end/formation/shot/light；
     时间轴单调递增且不重叠；总时长不超过该品类上限
  2. 人数：headcount 不超过品类人数上限（默认内置第八届展演规格，
     可用 --specs 覆盖；实际以当届官方文件为准）
  3. 资源：引用的 sprite/venue/formation id 在资产库中存在
     （--assets 指向资产根目录时启用；缺资产输出缺口清单，供 art-director 下单）
  4. 色彩：screen_color / key_tint 为合法 hex；kelvin 在 2000-6500

用法：
  python3 storyboard_lint.py <storyboard.json> [--assets <assets_root>] [--specs <specs.json>]

输出：JSON {sections, errors, missing_assets, passed}
退出码：0 通过；1 有错误；2 参数错误
"""
import argparse
import json
import re
import sys
from pathlib import Path

DEFAULT_SPECS = {
    "choir": {"max_headcount": 40, "max_duration_sec": 480},
    "class-choir": {"max_headcount": 50, "max_duration_sec": 480},
    "small-choir": {"max_headcount": 15, "max_duration_sec": 300},
    "orchestra": {"max_headcount": 65, "max_duration_sec": 540},
    "small-ensemble": {"max_headcount": 12, "max_duration_sec": 360},
    "dance": {"max_headcount": 36, "max_duration_sec": 420},
    "drama": {"max_headcount": 12, "max_duration_sec": 720},
    "recitation": {"max_headcount": 8, "max_duration_sec": 300},
}

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
REQUIRED_SECTION = {"t_start", "t_end", "formation", "shot", "light"}


def fail(msg, errors):
    errors.append(msg)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    ap.add_argument("--assets", default=None)
    ap.add_argument("--specs", default=None)
    args = ap.parse_args()

    try:
        sb = json.loads(Path(args.storyboard).read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        print(f"分镜表读取失败: {e}", file=sys.stderr)
        return 2

    specs = DEFAULT_SPECS
    if args.specs:
        try:
            specs = json.loads(Path(args.specs).read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            print(f"规格文件读取失败: {e}", file=sys.stderr)
            return 2

    known_assets = set()
    if args.assets:
        for mp in Path(args.assets).rglob("meta.json"):
            try:
                known_assets.add(json.loads(mp.read_text(encoding="utf-8")).get("id", ""))
            except Exception:  # noqa: BLE001
                continue

    errors, missing = [], set()
    category = sb.get("category")
    if category not in specs:
        fail(f"未知品类 {category}（可选：{sorted(specs)}）", errors)
        spec = None
    else:
        spec = specs[category]

    headcount = sb.get("headcount", 0)
    if spec and headcount > spec["max_headcount"]:
        fail(f"人数 {headcount} 超过品类上限 {spec['max_headcount']}", errors)

    sections = sb.get("sections", [])
    if not sections:
        fail("sections 为空", errors)

    prev_end = 0.0
    for i, sec in enumerate(sections):
        tag = f"sections[{i}]"
        miss = REQUIRED_SECTION - sec.keys()
        if miss:
            fail(f"{tag} 缺字段 {sorted(miss)}", errors)
            continue
        ts, te = float(sec["t_start"]), float(sec["t_end"])
        if ts >= te:
            fail(f"{tag} 时间段非法 {ts}-{te}", errors)
        if ts < prev_end - 1e-6:
            fail(f"{tag} 与上一段时间重叠（{ts} < {prev_end}）", errors)
        prev_end = max(prev_end, te)

        for key in ("screen_color", "key_tint"):
            v = sec.get(key)
            if v is not None and not HEX_RE.match(str(v)):
                fail(f"{tag} {key} 非法 hex: {v}", errors)
        kelvin = sec.get("light", {}).get("kelvin") if isinstance(sec.get("light"), dict) else None
        if kelvin is not None and not 2000 <= kelvin <= 6500:
            fail(f"{tag} kelvin {kelvin} 超出 2000-6500", errors)

        if args.assets:
            for kind in ("sprite", "venue", "formation"):
                ref = sec.get(f"{kind}_id")
                if ref and ref not in known_assets:
                    missing.add(f"{kind}:{ref}")

    if spec and sections:
        total = max(float(s["t_end"]) for s in sections)
        if total > spec["max_duration_sec"]:
            fail(f"总时长 {total}s 超过品类上限 {spec['max_duration_sec']}s", errors)

    if missing:
        errors.append(f"资产缺口（需 art-director 下单生产）: {sorted(missing)}")

    print(json.dumps({
        "sections": len(sections),
        "errors": errors,
        "missing_assets": sorted(missing),
        "passed": not errors,
    }, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
