# StageOS 资产注册表规范

## 目录
1. 目录结构
2. sprites meta.json
3. venues meta.json
4. CREDITS.csv
5. 验收与 CI

## 1. 目录结构

```
assets/
├── CREDITS.csv
├── LICENSE-assets.md
├── sprites/{asset-id}/
│   ├── meta.json
│   ├── body/ head/ top/ bottom/ shoes/ accessory/   # 命名规范见 sprite-forge
└── venues/{venue-id}/
    ├── meta.json
    ├── bg.png            # 背景层（看台/幕墙/天空等）
    ├── floor.png         # 地板/地面层（与 2.5D 网格透视对齐）
    ├── stands.png        # 看台/远景层（可选）
    └── props/            # 道具层（可选）
```

- venue-id 必须使用 scene-light 场地目录的 ID：`outdoor-stadium / outdoor-field / mall-roadshow / plaza-open / indoor-basketball / classroom-50 / concert-hall / hall-800`
- 所有 PNG 透明底；地板与背景**不得画死阴影**（阴影由渲染层按光照参数实时算）

## 2. sprites meta.json

沿用 stageos-sprite-forge 的 sprite-spec.md schema，art-director 额外要求三个字段必填：

```json
{
  "id": "girl-10y-school",
  "name": "四年级女生·校服日常",
  "license": "self-produced",
  "priceTier": "free",
  "files": ["body/front_0.png", "top/vest-white_front_0.png"],
  "...": "其余字段见 sprite-forge sprite-spec.md 第 6 节"
}
```

## 3. venues meta.json

```json
{
  "id": "hall-800",
  "name": "800人多功能报告厅",
  "license": "self-produced",
  "priceTier": "free",
  "files": ["bg.png", "floor.png"],
  "canvas": "1920x1080",
  "gridAnchor": { "x": 0.5, "y": 0.72 },
  "lightModel": "screen",
  "defaultLight": { "intensity": 0.75, "kelvin": 3600 },
  "createdAt": "2026-07-22",
  "version": 1
}
```

- `lightModel` ∈ `sky | natural | warm | screen`，必须与 scene-light 场地目录一致
- `gridAnchor`：地板与等距网格的对齐点（归一化坐标），渲染层据此定位
- `defaultLight`：该场地默认光照参数（scene-light 模型的输入默认值）

## 4. CREDITS.csv

```csv
asset_id,title,author,license,source_url
hall-800,Report Hall BG,Kenney,CC-BY,https://kenney.nl/assets/...
```

- `asset_id` 必须等于 meta.json 的 `id`（lint 据此核对）
- cc-by 必须登记 + 应用内署名入口；cc0 建议登记；self-produced 不登记

## 5. 验收与 CI

- 批次验收：`registry_lint.py assets/` exit 0
- 收费包发布：`registry_lint.py assets/ --strict` exit 0，且人工复核 pro/studio 包内无 cc-by
- CI 卡点：构建前跑 lint，失败即阻断发布
