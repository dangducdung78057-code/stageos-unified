# StageOS outfit-004 — Gate-11 Phase 1 Asset Expansion Rules

## 状态

- Gate-11 Phase 1 Rebuild Completed
- Gate-11 Phase 1 Human Sign-off Pending
- Gate-11 Phase 2 Not Started

本目录是依据 Gate-01～10 冻结契约重新建立的 Phase 1 交付，不是恢复的历史原件。规则只决定 `outfit-004` 资产扩展请求是否允许、需要复核或必须拒绝，不修改任何冻结设计或生产资产。

## 规则域

| 文件 | 责任 |
|---|---|
| `character-reuse-rules.json` | 角色、年龄、节目与适用范围复用边界 |
| `material-dna-migration-rules.json` | Material DNA 迁移分级与五维检查 |
| `palette-expansion-rules.json` | Signature、Premium、Basic 比例与扩色边界 |
| `cloud-collar-compatibility-rules.json` | CC-001～CC-004 的兼容条件 |
| `age-program-boundary-rules.json` | Primary / Teen 与节目类型适配矩阵 |
| `expansion-validation-rules.json` | 不可跳步的扩展验证管线 |
| `validation-cases.json` | 10 类可审计验证案例 |
| `GATE-11-PHASE-1-MANIFEST.json` | 交付文件、状态和提交元数据 |
| `GATE-11-PHASE-1-REBUILD-REPORT.md` | 重建、验证、冻结范围与签署建议 |

## 决策语义

- `Allowed`：满足全部前提，可进入既有生产流程。
- `Conditional` / `Review Required`：必须完成规则列出的人工或局部复验。
- `Full Review`：年龄或角色职责等身份边界发生变化，需完整复核。
- `Forbidden` / `Reject`：不得扩展。

## 强制验证顺序

`Expansion Request → Character Check → Material DNA Check → Palette Check → Cloud Collar Check → Age / Program Check → Production Check → Visual Integrity Check → Allow / Review / Reject`

任何阶段均不得跳过。任一阶段拒绝时最终结果为 `Reject`；任一阶段要求复核时，在复核完成前不得视为 `Allowed`。

## 冻结边界

本交付不得修改 Gate-01～10、Blueprint、Production Specification 或视觉资产，也不得启动 Compatibility Boundary System 或 Gate-11 Phase 2。Human Sign-off 必须以仓库文件、规则 ID、验证输出和 Git 提交为证据。
