# StageOS 对接映射与接缝点

## 能力映射总表

| 本技能模块 | StageOS 需求 | 改造要点 |
| --- | --- | --- |
| IsometricEngine | 2.5D 舞台俯视预览 | tile 换舞台地板纹理；网格单元 = 一个站位点 |
| DepthSorter | 队形前后排遮挡 | 排序键 = (排 + 列)；40 实体为性能基线 |
| LayerStack / SpriteComposer | 队员换装叠层 | 6 槽位固定序；精灵全部来自 sprite-forge 规范库 |
| DragDropHandler | 队形编排 + 换装 | 双目标拖拽：名单→站位点；服装→角色槽位 |
| SlotManager | 队形 + 服装双槽位 | formation.json（声部/排/列/编号）+ costumes.json |
| SyncManager | 多人协同编排 | 沿用 LWW；乐观锁留后续迭代 |
| ExportRenderer | 队形图高清导出 | 离屏 2x/3x，离线可用 |
| TintCache | 舞台色彩系统 | (服装ID, 色号) 缓存；支撑配色方案实时预览 |

## 本技能不覆盖（StageOS 另需模块）

- 快照持久化与刷新恢复：localStorage/IndexedDB，独立模块实现；
- 服装采购链接、供应商数据：数据层，与渲染无关；
- 3D 可拖拽微调：超出 2.5D Canvas 范围，属 3D 展厅模块。

## 接缝点（改动时检查这些接口）

1. **精灵入库接口**：`public/assets/sprites/{character-id}/` + meta.json，schema 见 sprite-forge 的 sprite-spec.md；
2. **数据接口**：`formation.json` / `costumes.json` 的槽位枚举必须与 SlotManager 一致；
3. **同步协议**：WebSocket 消息类型 `equip.change / formation.move / player.join / player.leave`，新增类型须双端同步定义；
4. **导出接口**：渲染函数必须上下文无关（可传入离屏 ctx），禁止在渲染路径里读全局 canvas；
5. **配色接口**：色号进入 TintCache 前统一转 hex，禁止 rgba 字符串直传。
