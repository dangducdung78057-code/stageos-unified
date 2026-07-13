# StageOS Gate-24 Validation Rules

> 本文档仅定义 Gate-24 Build 完成后的验证标准，不表示 Build 已执行，不授予 Build、Release 或 Lifecycle Transition 权限。

## Current Control State

| Item | Status |
|---|---|
| Gate-24 Build | `NOT_STARTED` |
| Validation Rules | `CREATED` |
| Human Approval | `PENDING` |
| Validation Execution | `NOT_STARTED` |
| Acceptance | `NOT_GRANTED` |

## 1. Validation Objective

Gate-24 验证用于判断未来经人工授权的 Build 输出是否符合批准范围、仓库完整性要求和审计要求。

验证对象包括 Build 输出物、关联文件、版本标识、Manifest、Build Evidence、Validation Evidence 和 Reviewer Record。

本规则的创建不代表 Gate-24 Build 已执行，也不代表验证已执行、结果已通过或人工 Acceptance 已授予。

## 2. Build Output Validation

未来 Build 完成后必须执行以下检查：

- **输出物检查：** 输出物必须与批准的 Build Objective 和 Output Requirements 一致，不得包含未授权功能或资产。
- **文件完整性：** 必需文件必须存在、可读取、非空且与 Build Evidence 中的文件清单一致；不得存在未申报文件。
- **结构验证：** 目录、命名、格式、字段和引用关系必须符合批准的 Gate-24 结构约束。
- **版本标识验证：** 每个输出物必须具有唯一、可追溯且与输入 commit、Build Evidence 和 Manifest 一致的版本标识。

任一检查失败时，Build 输出不得进入 Human Acceptance。

## 3. Artifact Integrity Check

- **SHA-256 校验要求：** 每个候选 Artifact 必须计算并记录 SHA-256；复核时重新计算并逐项匹配。缺失或不一致即为失败。
- **Artifact 来源追踪：** 必须记录 Repository、Branch、输入 Commit、Build Commit、生成方法、执行者或执行上下文及 UTC 时间。
- **Manifest 验证：** Manifest 必须列出全部 Artifact 的路径、版本、大小、SHA-256 和来源引用；Manifest 与实际输出必须一一对应，且不得存在遗漏、重复或未知条目。

完整性证据必须可重复验证，且不得依赖不可审计的外部状态。

## 4. Scope Drift Detection

验证必须明确检查：

- Gate-01～23 是否被修改；任何差异均视为 Scope Drift。
- Production Asset，尤其 `G19-PROD-ASSET-001`，是否被修改或重新标识；任何差异均视为 Unauthorized Change。
- `master` 是否被修改、merge、push 或改写；任何相关变化均导致验证失败。
- 实际 Build 是否超出 Human Approval Decision 与 Build Authorization Proposal 中定义的 Authorization Scope。

还必须确认未创建第二 Production Asset，且未启用 Batch Production、Team Expansion、Procurement Release、Release 或 Lifecycle Transition。

## 5. Regression Check

- **已有治理流程验证：** 确认既有 Gate、归档报告、Tag、审计链和人工审核流程仍可读取、可追溯且语义未变化。
- **基线兼容性检查：** 输出必须与 Phase 2 Baseline、Gate-24 Planning Commit 和 Gate-24 Authorization Commit 兼容，不得改写既有基线。
- **回归风险检查：** 检查权限扩大、隐式写入、自动 Release、自动生命周期转换、证据不可重复及治理边界弱化风险。

发现回归或无法证明无回归时，结果必须记录为失败或阻塞，不得推定通过。

## 6. Rollback Trigger

以下任一条件触发立即停止、证据保全和人工复核：

- **Validation Failure：** 任一必需验证失败、结果不可重复或证据缺失。
- **Unauthorized Change：** 发现未获明确人工批准的文件、历史、资产、Gate、Tag、分支或流程变更。
- **Scope Drift：** 实际操作或输出超出 Authorization Scope。
- **Artifact Integrity Failure：** SHA-256、来源追踪或 Manifest 验证失败。

Rollback 仅可处理未来获批 Gate-24 Build 所产生的候选变更，不得修改 Gate-01～23、Production Asset、`master`、Phase 2 Archive 或 Tag，也不得使用 force push、rebase 或 reset。

## 7. Human Acceptance Requirement

**Validation 完成 ≠ Acceptance。**

即使全部自动或人工验证项目通过，也必须由具名人工 Reviewer 审查 Build Evidence、Validation Evidence、范围差异与审计引用，并明确记录 Acceptance 决定。

在 Human Acceptance 产生前，不得进入下一生命周期阶段，不得 Release、部署或解释为 Production 授权。当前 Human Approval 为 `PENDING`，因此不得启动 Build 或验证执行。

## 8. Audit Evidence Requirement

每次未来验证必须记录：

- **Commit Reference：** 输入基线、Planning、Authorization、Human Approval、Build 和 Validation 相关 commit。
- **Build Evidence：** 批准范围、变更文件、构建过程、执行上下文、UTC 时间和结果。
- **Validation Evidence：** 检查方法、预期值、实际值、SHA-256、Manifest、通过/失败结论和异常。
- **Reviewer Record：** Reviewer 身份、审核范围、Acceptance 状态、UTC 时间、到期或撤销条件。

审计证据必须追加式、可追溯、可重复验证，并与 Repository 和 Artifact 建立明确引用。

## 9. Current Status

- Gate-24 Build: `NOT_STARTED`
- Validation Rules: `CREATED`
- Human Approval: `PENDING`
- Validation Execution: `NOT_STARTED`
- Human Acceptance: `NOT_GRANTED`
- Production Asset: `UNCHANGED`
- Gate-01～23: `FROZEN`
- Release: `NOT_AUTHORIZED`
- Lifecycle Transition: `NOT_AUTHORIZED`

本状态只表示规则文档已创建。它不产生执行授权，也不改变任何既有 Gate、Production Asset、Tag、`master` 或生命周期状态。
