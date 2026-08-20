# StageOS 精灵入库规格

## 目录
1. 画布与格式
2. 锚点规范
3. 视角与帧
4. 命名规范
5. 目录结构
6. 元数据 schema（含收费分级）
7. CREDITS.csv 登记规则

## 1. 画布与格式

- 单帧统一画布：默认 `128×192`（低模渲染源可用 `256×384`，入库时缩放归一）
- 格式：PNG，RGBA，透明背景；空区域必须透明，禁止白底
- 底色偏好：服装件以白/浅灰为底，保证运行时 multiply 重着色可用

## 2. 锚点规范

- 角色与全部装备件：锚点 = 脚底中心，归一化坐标 `(0.5, 1.0)`
- 校验：`validate_sprite.py` 取最底部非透明像素的水平中心，与画布中心偏差 ≤ 8px
- 所有槽位共用同一画布尺寸与锚点 → 换装零偏移，禁止逐件配 offset

## 3. 视角与帧

- 基础集：`front` / `front_left` / `front_right`（3 视角，参考图与预览用）
- 完整集（等距场景入库）：8 方向 = `front, back, left, right, front_left, front_right, back_left, back_right`
- 帧：idle 从 1 帧起步；walk 动画帧列入后续迭代
- 标注约定：**脸朝画面右侧 = front_left（看到角色左前）；脸朝画面左侧 = front_right**

## 4. 命名规范

```
{slot}/{id}_{direction}_{frame}.png
```

- slot ∈ `body | head | top | bottom | shoes | accessory`
- id：小写字母/数字/连字符，如 `vest-white`、`sneaker-canvas`
- 示例：`top/vest-white_front_0.png`、`shoes/sneaker-white_front_left_0.png`

## 5. 目录结构

```
sprites/
├── CREDITS.csv
├── LICENSE-assets.md
├── {character-id}/
│   ├── meta.json
│   ├── body/
│   ├── head/
│   ├── top/
│   ├── bottom/
│   ├── shoes/
│   └── accessory/
```

## 6. 元数据 schema（meta.json）

```json
{
  "id": "girl-10y-school",
  "name": "四年级女生·校服日常",
  "style": "realistic-child",
  "headRatio": 6.5,
  "headRatioMeasured": 6.48,
  "ageRange": "9-11",
  "directions": ["front", "front_left", "front_right"],
  "slots": ["body", "head", "top", "bottom", "shoes", "accessory"],
  "frames": { "idle": 1 },
  "canvas": "128x192",
  "license": "self-produced",
  "source": "ai-generated+human-verified",
  "priceTier": "free",
  "createdAt": "2026-07-22",
  "version": 1
}
```

- `license` ∈ `self-produced | cc0 | cc-by`（其余协议禁止入库）
- `priceTier` ∈ `free | pro | studio`，收费模块据此控制访问
- `headRatioMeasured` 必须来自 `measure_head_ratio.py` 实测

## 7. CREDITS.csv 登记规则

非自产素材逐行登记：

```csv
file,title,author,license,source_url
top/vest-white_front_0.png,White Vest,Kenney,CC0,https://kenney.nl/assets/...
```

- CC0 素材建议登记（溯源用），非强制
- CC-BY 素材必须登记并在应用内提供可见署名入口
- SA/GPL 素材禁止入库
