# outdoor-stadium 场地素材包（batch-2026-07-foundation）

标准田径场（400m 塑胶跑道 + 天然草皮足球场），2.5D 分层素材，free 档，self-produced。

## 文件
| 文件 | 说明 |
| --- | --- |
| outdoor-stadium_bg_raw.png | 背景层：满画布，天空带15% + 树/校舍地平线 + 虚焦草坪 |
| outdoor-stadium_floor_raw.png | 地板层：等距菱形，压扁比实测 0.500，RGBA 透明，无写死阴影 |
| outdoor-stadium_stands_raw.png | 看台层：RGBA 透明，远景虚化物件层 |
| scene_light_morning/noon/evening.json | 南昌 preset 2026-07-22 实算三档光照（影长/影向/vector_25d/key_tint） |
| meta.json | 1/11 人物比例定标、stands 定位约定、bg 构图约定、场地规格 |

## 关键约定（8 套场地统一基准）
- bg 地平线 ≈ 画布 15–22%，与 floor 远端顶点衔接
- floor 压扁比 0.5，菱形中心 = 网格原点
- 精灵高 = floor 短轴 × 1/10–1/12（40 人 8×5 方阵余量）

> PNG 为二进制资产，随批次 zip 分发（见交付包 02），本 PR 仅含 JSON/文档。
