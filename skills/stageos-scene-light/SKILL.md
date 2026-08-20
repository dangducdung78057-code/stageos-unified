---
name: stageos-scene-light
description: "StageOS 多规格场地与光照对接技能。提供标准场地目录（室外：标准田径场/草皮塑胶操场/商场路演舞台/广场空地；室内：篮球场/50人教室/音乐厅/800人报告厅）与两套光照模型——室外天空光按日期时刻计算太阳角度，输出阴影方向、影长与光色温（早晨/中午/傍晚阴影区不同）；室内按光源类型区分，800人报告厅以LED大屏为主光源，计算屏色映射到人物身上的轮廓光/面光/地面反光/环境光四区反射效果。当用户要求生成或调整演出场地、舞台背景、室外光照阴影、天空光、大屏色彩反射、人物在特定场地的真实光影，或提及田径场、路演、广场、报告厅、音乐厅、教室、篮球场场景时触发。"
---

# StageOS 多规格场地与光照

## 核心流程（五步）

1. **选场地**：查 [references/venue-catalog.md](references/venue-catalog.md) 取场地 ID 与规格（尺寸/地面材质/默认光源）。
2. **定光照模型**：室外 → `sky`；室内篮球场/教室 → `natural`；音乐厅 → `warm`；800人报告厅 → `screen`。
3. **算光照参数**：
   - 天空光：运行 `scripts/sun_position.py --preset nanchang --date <日期> --time <时刻>`（或 `--lat/--lon`），得阴影方位、影长系数、2.5D 偏移向量、色温与 key_tint；快速预览可用 morning/noon/evening 预设（见 lighting-model.md 第 2 节），**指定正式演出日期必须实算**；
   - 大屏光：运行 `scripts/screen_tint.py --color <屏色hex> --intensity <0-1>`，得 rim/front_fill/floor_bounce/ambient 四区 tint。
4. **组装 scene_light 参数对象**：按 [references/lighting-model.md](references/lighting-model.md) 第 5 节的 schema 输出，喂给渲染管线（L1 阴影偏移 + TintCache 重着色）。
5. **过质量门**后交付。

## 质量门

- 室外图：阴影方向与太阳方位反向一致（早晨影偏西、正午影缩脚下、傍晚影偏东且长）；影长与高度角匹配，不同时段截图对比可辨；
- 室内大屏：角色背屏侧轮廓可见屏色 rim，下部有地面反光，暗部不死黑；换屏色后四区 tint 同步更新；
- tint 只作用于白底精灵（sprite-forge 规范），深色底素材禁止直接 multiply；
- 场地尺寸与 venue-catalog 一致，改动需在 meta 中显式覆盖并注明。

## 与其他技能的关系

- 人物精灵来自 **stageos-sprite-forge**（白底、统一锚点是 tint 与阴影对齐的前提）；
- 渲染实现遵循 **stageos-25d-dressup** 的层级栈：阴影画 L1 层，tint 走 TintCache，导出走 ExportRenderer；
- 三个技能的接缝参数 = `scene_light` 对象（lighting-model.md 第 5 节）。

## 脚本

- `scripts/sun_position.py --preset nanchang --date YYYY-MM-DD --time HH:MM` → 太阳高度角/方位角/阴影向量/色温 JSON。内置南昌预设，其他城市用 `--lat/--lon`。
- `scripts/screen_tint.py --color "#3B82F6" --intensity 0.8 [--base "#FFFFFF"] [--floor "#8B8B8B"]` → 大屏四区反射 tint JSON。
