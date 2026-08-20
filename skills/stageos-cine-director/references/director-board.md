# 导演分镜表（Director Board）Schema 与模板

## 1. Schema

```json
{
  "title": "节目名称",
  "category": "choir",
  "headcount": 38,
  "duration_sec": 360,
  "venue_id": "hall-800",
  "createdAt": "2026-07-22",
  "sections": [
    {
      "t_start": 0,
      "t_end": 60,
      "narrative": "开场·建立",
      "mood": "期待、含蓄",
      "formation": "标准方阵式",
      "shot": { "size": "EW", "angle": "front", "render_target": "3d" },
      "light": { "model": "screen", "kelvin": 4000, "screen_color": "#8FA8BE", "intensity": 0.6 },
      "costume_palette": "莫兰迪雾蓝系",
      "sprite_id": "girl-10y-school",
      "venue_id": "hall-800",
      "formation_id": "std-grid",
      "note": "屏色与服装错开色相，亮度含蓄"
    }
  ]
}
```

## 2. 字段约束

- `category` ∈ `choir | class-choir | small-choir | orchestra | small-ensemble | dance | drama | recitation`（人数/时长上限见 storyboard_lint 内置规格，以当届官方文件为准）
- `sections` 时间轴单调不重叠，总时长 ≤ 品类上限
- `shot.size` ∈ `EW | W | M | C | CU`；`shot.angle` ∈ `front | high | low | judge`
- `shot.render_target` ∈ `2.5d | 3d | ai-still`：2.5D 只支持 front + zoom，其余标 3d/ai-still
- `costume_palette` 用 color-script.md 色系库名称，自定义需给出主/辅/点缀三个 hex
- 引用资产（sprite_id/venue_id/formation_id）必须已在资产库，否则 lint 输出缺口清单

## 3. 资源缺口处理

lint 报 missing_assets 时：
1. 缺口清单 → art-director 按批次流程下单生产；
2. 分镜表中该段落标注 `"asset_status": "pending"`，资产入库后复跑 lint；
3. 禁止用"差不多"的现有资产顶替——风格错位的素材比缺口更显廉价。

## 4. 交付物

一份可执行分镜表 = JSON（过 lint）+ 人读版（段落×镜头×色×队形的一页表）+ 缺口下单清单（如有）。
