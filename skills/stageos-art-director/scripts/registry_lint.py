#!/usr/bin/env python3
"""StageOS 资产台账校验器（收费模块上线前的合规卡点）。

扫描资产根目录，校验每个资产条目：
  1. meta.json 存在且字段完整（id/name/license/priceTier/files）
  2. license ∈ self-produced | cc0 | cc-by（SA/GPL 直接报错，禁止入库）
  3. priceTier ∈ free | pro | studio
  4. meta.json 中列出的文件真实存在
  5. license = cc-by 的资产必须在 CREDITS.csv 中有对应登记行

目录约定：
  assets/
  ├── CREDITS.csv
  ├── sprites/{asset-id}/meta.json + 素材文件
  └── venues/{venue-id}/meta.json + 素材文件

用法：
  python3 registry_lint.py <assets_root> [--strict]
    --strict 时 cc0 未登记 CREDITS.csv 也计警告

输出：JSON {items, errors, warnings, passed}
退出码：0 通过；1 存在错误；2 参数错误
"""
import argparse
import csv
import json
import sys
from pathlib import Path

ALLOWED_LICENSE = {"self-produced", "cc0", "cc-by"}
ALLOWED_TIER = {"free", "pro", "studio"}
REQUIRED_FIELDS = {"id", "name", "license", "priceTier", "files"}


def load_credits(root: Path) -> set:
    f = root / "CREDITS.csv"
    if not f.is_file():
        return set()
    ids = set()
    with f.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            key = (row.get("asset_id") or row.get("file") or "").strip()
            if key:
                ids.add(key.split("/")[0])
    return ids


def lint_item(meta_path: Path, credits: set, strict: bool, errors: list, warnings: list) -> dict:
    item_dir = meta_path.parent
    rel = str(item_dir)
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        errors.append(f"{rel}: meta.json 解析失败 {e}")
        return {"id": rel, "ok": False}

    missing = REQUIRED_FIELDS - meta.keys()
    if missing:
        errors.append(f"{rel}: meta.json 缺字段 {sorted(missing)}")

    lic = str(meta.get("license", "")).lower()
    if lic and lic not in ALLOWED_LICENSE:
        errors.append(f"{rel}: 禁止协议 {lic}（SA/GPL 或未知协议不得入库）")

    tier = str(meta.get("priceTier", "")).lower()
    if tier and tier not in ALLOWED_TIER:
        errors.append(f"{rel}: 非法 priceTier {tier}")

    files = meta.get("files", [])
    if isinstance(files, list):
        for fn in files:
            if not (item_dir / str(fn)).is_file():
                errors.append(f"{rel}: 文件缺失 {fn}")

    asset_id = str(meta.get("id", item_dir.name))
    if lic == "cc-by" and asset_id not in credits:
        errors.append(f"{rel}: cc-by 资产未在 CREDITS.csv 登记署名")
    if strict and lic == "cc0" and asset_id not in credits:
        warnings.append(f"{rel}: strict 模式下 cc0 建议也登记 CREDITS.csv 以便溯源")

    return {"id": asset_id, "ok": True}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("assets_root")
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()

    root = Path(args.assets_root)
    if not root.is_dir():
        print(f"目录不存在: {root}", file=sys.stderr)
        return 2

    credits = load_credits(root)
    errors, warnings, items = [], [], []
    metas = sorted(root.rglob("meta.json"))
    if not metas:
        warnings.append("未发现任何 meta.json（空台账）")
    for mp in metas:
        items.append(lint_item(mp, credits, args.strict, errors, warnings))

    passed = not errors
    print(json.dumps({
        "items": len(items),
        "errors": errors,
        "warnings": warnings,
        "passed": passed,
    }, ensure_ascii=False, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
