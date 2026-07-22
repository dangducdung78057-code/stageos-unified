---
name: stageos-25d-dressup
description: "StageOS 2.5D 等距多人拖拽换装能力技能。基于 HTML5 Canvas 实现等距场景渲染、精灵深度排序、装备槽位数据模型、DOM+Canvas 混合拖拽换装、WebSocket 多人实时同步，以及分层渲染管线、HiDPI 适配、离屏高清导出与图层重着色。当用户要求开发或调整 StageOS 的 2.5D 舞台预览、队形编排工作台、换装系统、等距/isometric 场景、Canvas 拖拽交互、多人协同编辑、装备/服装槽位，或提及 2.5D 换装、精灵深度排序、WebSocket 同步、高清导出队形图时触发。"
---

# StageOS 2.5D 多人拖拽换装

## 模块速览（与 StageOS 的对接映射）

| 模块 | StageOS 用途 |
| --- | --- |
| IsometricEngine 等距坐标 | 2.5D 舞台俯视网格，网格单元 = 站位点 |
| DepthSorter（y+x 排序） | 30–40 人队形前后排遮挡 |
| LayerStack + SpriteComposer | 单角色 6 槽位固定叠层（L2a下装→L2b鞋→L2c底模→L2d上装→L2e头→L2f饰品） |
| DragDropHandler | 双拖拽目标：队员名单→舞台站位点；服装→角色槽位 |
| SlotManager | 队形槽位（声部/排/列）+ 服装槽位双模型 |
| WebSocket SyncManager | 多人协同编排，LWW 冲突策略 |
| ExportRenderer | 离屏 2x/3x PNG 导出，无外部依赖 |
| TintCache | 服装运行时重着色，支撑舞台色彩系统 |

## 实施工作流

1. 先读 [references/implementation-spec.md](references/implementation-spec.md) 的「渲染管线设计规范」——层级栈、锚点、HiDPI、导出、重着色、性能预算都在其中；
2. 再读 [references/stageos-mapping.md](references/stageos-mapping.md) 确认本次改动落在哪些接缝点；
3. 按「等距场景 → 深度排序 → 槽位模型 → 拖拽 → 同步」顺序实现，不跳步；
4. 精灵素材一律来自 stageos-sprite-forge 技能产出的规范库，禁止临时手绘或来源不明素材；
5. 完成后过质量门。

## 质量门（交付前逐项核验）

- 坐标转换函数有单元测试；devicePixelRatio=2 下无模糊无偏移；
- 单角色 6 槽位叠层顺序正确，换装零像素偏移（统一锚点）；
- 拖拽命中区与视觉一致，无效区域有回弹反馈；
- 两窗口换装同步 < 500ms；同槽位并发 = 最后写入胜出；
- 离屏导出 2x PNG 成功且离线可用；
- 40 实体同屏 60fps，单帧脚本 ≤ 8ms；
- sprites/ 目录无 SA/GPL 素材（CI 扫描通过）。

## 约束

- 桌面端鼠标交互优先，移动端触控不在本技能范围；
- 精灵用独立 PNG，不做图集；
- 快照持久化用 localStorage/IndexedDB，刷新可恢复。
