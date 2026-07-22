#!/usr/bin/env python3
"""StageOS 室外天空光计算器：太阳位置 → 2.5D 阴影与光色参数。

给定经纬度、日期、时刻，输出：
  - 太阳高度角 elevation（度）
  - 太阳方位角 azimuth（度，正北 0，顺时针）
  - 阴影方位 shadow_azimuth（与太阳反向）
  - 阴影长度系数 shadow_factor = 1/tan(elevation)（相对物体高度）
  - 2.5D 等距投影阴影偏移向量 shadow_vector_25d（单位：角色高度倍数）
  - 建议光色温 kelvin 与 key_tint（十六进制）

用法：
  python3 sun_position.py --lat 28.68 --lon 115.86 --date 2026-07-22 --time 08:00
  python3 sun_position.py --preset nanchang --date 2026-10-01 --time 17:30

输出：JSON。太阳在地平线下时 sun_up=false，其余字段为 null。
退出码：0 成功；2 参数错误。
"""
import argparse
import json
import math
import sys
from datetime import date

PRESETS = {
    "nanchang": {"lat": 28.68, "lon": 115.86, "tz_meridian": 120.0},  # 南昌，东八区
}


def kelvin_to_tint(k: int) -> str:
    table = [
        (2000, (255, 137, 14)), (2500, (255, 161, 72)), (3000, (255, 180, 107)),
        (3500, (255, 196, 137)), (4000, (255, 209, 163)), (4500, (255, 219, 186)),
        (5000, (255, 228, 206)), (5500, (255, 236, 224)), (6000, (255, 243, 239)),
        (6500, (255, 249, 253)),
    ]
    k = max(2000, min(6500, k))
    for i in range(len(table) - 1):
        k0, c0 = table[i]
        k1, c1 = table[i + 1]
        if k0 <= k <= k1:
            t = (k - k0) / (k1 - k0)
            c = tuple(round(c0[j] + (c1[j] - c0[j]) * t) for j in range(3))
            return "#{:02X}{:02X}{:02X}".format(*c)
    return "#FFF9FD"


def solar(lat: float, lon: float, tz_meridian: float, d: date, hh: int, mm: int):
    n = d.timetuple().tm_yday
    decl = math.radians(23.44) * math.sin(math.radians(360.0 / 365.0 * (284 + n)))
    lst = hh + mm / 60.0 + (lon - tz_meridian) / 15.0
    H = math.radians(15.0 * (lst - 12.0))
    phi = math.radians(lat)
    sin_e = math.sin(phi) * math.sin(decl) + math.cos(phi) * math.cos(decl) * math.cos(H)
    sin_e = max(-1.0, min(1.0, sin_e))
    elev = math.asin(sin_e)
    y = math.sin(H)
    x = math.cos(H) * math.sin(phi) - math.tan(decl) * math.cos(phi)
    az = (math.degrees(math.atan2(y, x)) + 180.0) % 360.0
    return math.degrees(elev), az


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preset", choices=PRESETS.keys(), help="城市预设（默认 nanchang）")
    ap.add_argument("--lat", type=float)
    ap.add_argument("--lon", type=float)
    ap.add_argument("--tz-meridian", type=float, default=120.0)
    ap.add_argument("--date", required=True, help="YYYY-MM-DD")
    ap.add_argument("--time", required=True, help="HH:MM")
    args = ap.parse_args()

    if args.preset:
        p = PRESETS[args.preset]
        lat, lon, tz = p["lat"], p["lon"], p["tz_meridian"]
    else:
        if args.lat is None or args.lon is None:
            print("需提供 --preset 或 --lat/--lon", file=sys.stderr)
            return 2
        lat, lon, tz = args.lat, args.lon, args.tz_meridian

    try:
        d = date.fromisoformat(args.date)
        hh, mm = (int(v) for v in args.time.split(":"))
    except ValueError:
        print("日期/时间格式错误", file=sys.stderr)
        return 2

    elev, az = solar(lat, lon, tz, d, hh, mm)
    if elev <= 0:
        print(json.dumps({"sun_up": False, "elevation": round(elev, 2)}, ensure_ascii=False))
        return 0

    shadow_az = (az + 180.0) % 360.0
    factor = 1.0 / math.tan(math.radians(elev))
    rad = math.radians(shadow_az)
    vx = round(factor * math.sin(rad), 3)
    vy = round(-factor * math.cos(rad) * 0.5, 3)

    if elev < 10:
        kelvin = 3200
    elif elev < 35:
        kelvin = 4300
    else:
        kelvin = 5600

    print(json.dumps({
        "sun_up": True,
        "elevation": round(elev, 2),
        "azimuth": round(az, 2),
        "shadow_azimuth": round(shadow_az, 2),
        "shadow_factor": round(factor, 3),
        "shadow_vector_25d": {"dx": vx, "dy": vy},
        "kelvin": kelvin,
        "key_tint": kelvin_to_tint(kelvin),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
