# 批次生产手册

## 目录
1. 批次计划模板
2. 人物精灵批次
3. 场地素材批次（分层规范）
4. 场地素材提示词要点

## 1. 批次计划模板

```json
{
  "batchId": "2026-08-sprites-v1",
  "items": [
    { "type": "sprite", "id": "girl-10y-school", "style": "realistic-child", "directions": ["front","front_left","front_right"], "slots": ["body","top","bottom","shoes"], "priceTier": "free" },
    { "type": "venue", "id": "hall-800", "layers": ["bg","floor"], "priceTier": "free" }
  ],
  "acceptance": "registry_lint exit 0 + 各技能质量门"
}
```

## 2. 人物精灵批次

逐件走 stageos-sprite-forge 六步流程，批次内追加两条：

1. **同批一致性**：同批多角色共用同一风格预设与提示词骨架，只换角色参数（年龄/性别/服装），保证库内视觉统一；
2. **抽样复测**：批次结束时随机抽 20% 复跑 `measure_head_ratio.py`，漂移即整批复审。

## 3. 场地素材批次（分层规范）

每个场地按层产出，层与渲染管线对应：

| 层 | 文件 | 规范 | 对应渲染层 |
| --- | --- | --- | --- |
| 背景 | bg.png | 1920×1080 透明底，看台/幕墙/天空；**不得含太阳/明确阴影方向**（光照方向由 scene-light 决定） | L0 之上、实体层之下 |
| 地板 | floor.png | 与 2.5D 等距网格透视对齐，gridAnchor 标定对齐点；**不得画死阴影**；材质按场地目录（塑胶红/草皮绿/木地板/花岗岩） | L0 |
| 看台 | stands.png | 可选，远景虚化 | L0 与 bg 之间 |
| 道具 | props/*.png | 可选，独立锚点 | L2 实体层参与深度排序 |

## 4. 场地素材提示词要点

```
{VENUE_SCENE}, {LAYER_DESCRIPTION}, 2.5D isometric game asset style,
flat even lighting, NO cast shadows, NO sun position hints,
transparent background PNG, clean vector-like surfaces, high quality.
```

- **NO cast shadows 是必须项**：阴影写死会和 scene-light 的动态光照打架；
- 天空元素单独成层（并入 bg），允许有亮度渐变但不得有明确日轮；
- 地板材质色参考场地目录，且保持中高明度——太暗会让 multiply tint 失效；
- 每批同一场地的各层用同一次生成或参考图锁定，保证透视一致。
