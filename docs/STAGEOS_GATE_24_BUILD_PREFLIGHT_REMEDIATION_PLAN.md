# StageOS Gate-24 Build Preflight Remediation Plan

> 本文档仅记录 `BUILD_PREFLIGHT_BLOCKED` 的整改方案，不构成 Build 启动、Release 或 Lifecycle Transition 授权。

| Status | Value |
|---|---|
| Gate-24 Build | `NOT_STARTED` |
| Approval | `APPROVED` |
| Authorization | `GRANTED` |
| Preflight | `BLOCKED` |

## 1. Remediation Objective

当前 Preflight 因以下条件未满足而阻塞：

- Dependency：项目依赖尚未安装和验证，无法确认依赖完整性、可重复性与环境稳定性。
- Artifact Output：Artifact、Manifest 与 Evidence 的唯一输出位置尚未固定。

整改目标是锁定依赖准备策略、环境规则、输出路径及验证要求，使后续重新 Preflight 能够形成可审计结论。本阶段不进入 Build，不安装依赖，也不生成 Artifact。

## 2. Dependency Preparation Strategy

固定工具版本：

- Node.js：`24.x`
- pnpm：`10.34.3`

依赖准备必须遵守以下规则：

1. 仅使用项目已提交的 `pnpm-lock.yaml`，不得无审批更新或重写 lockfile。
2. 使用 frozen install：`pnpm install --frozen-lockfile`。
3. 安装后验证依赖树完整、lockfile 未变化、无缺失或未解析依赖，并记录验证结果。
4. 依赖准备完成后必须重新执行 Build Preflight；依赖安装成功本身不代表 Build 获准启动。

## 3. Environment Lock Rules

- Runtime Version：Node.js 必须保持在 `24.x`，执行记录必须包含实际完整版本。
- Package Manager Version：pnpm 必须为 `10.34.3`。
- Environment Variables：仅允许使用经批准、按环境注入且不写入仓库的变量；不得记录或输出 Secret 值。Preflight 只记录变量名称、来源类别和可用性。
- Reproducible Build：相同 Source Commit、lockfile、Runtime、Package Manager、环境变量集合与命令必须产生可验证、可追踪的等价输出。
- 任一锁定条件漂移时，Preflight 必须恢复为 `BLOCKED`。

## 4. Artifact Output Path

固定输出路径如下：

- Artifact：`artifacts/gate-24/`
- Manifest：`artifacts/gate-24/manifest/`
- Evidence：`artifacts/gate-24/evidence/`

所有 Gate-24 Build 输出必须位于上述路径。路径固定后不得漂移；任何替代目录、重命名或仓库外输出均须先经过新的治理审批和 Preflight。

## 5. Artifact Verification Rules

- SHA-256 Verification：每个 Build Artifact 必须计算 SHA-256，并将文件路径、摘要和计算时间写入 Manifest。
- Manifest Validation：验证 Manifest 覆盖全部 Artifact，且不存在未登记、缺失或重复条目。
- Source Commit Reference：Manifest 与 Evidence 必须引用实际 Build Source Commit；计划基线为 `b586445a4b84c9a4570ad5d0183e2d59b17eda4c`。
- Evidence Reference：Manifest 必须关联 Build Log、执行时间、环境版本、Operator Identity 与 Validation Evidence。
- 任一完整性验证失败时，不得进入 Acceptance。

## 6. Preflight Recheck Criteria

重新 Preflight 只有在以下项目全部通过时才能判定为 `BUILD_PREFLIGHT_READY`：

- Repository Identity：`PASS`
- Dependency Readiness：`PASS`
- Output Path Availability：`PASS`
- Artifact Rules：`PASS`
- Rollback Readiness：`PASS`

重新检查还必须确认工作区、Branch、HEAD、Approval、Authorization 与 Phase 2 Tag 未发生未授权漂移。

## 7. Remaining Blockers

当前阻塞状态保持为：

- Dependency：`BLOCKED`
- Artifact Output：`BLOCKED`

仅创建本计划不会解除阻塞。依赖完成受控准备与验证、固定输出路径可用性验证通过后，才能重新执行 Preflight。

整改目标：`BUILD_PREFLIGHT_READY`。

## 8. Forbidden Actions

在重新 Preflight 通过前，明确禁止：

- Build Execution
- Release
- Lifecycle Transition
- 修改 `master`
- 移动 `stageos-phase-2-complete` Phase 2 Tag
- 修改 Gate-01～23
- 修改 Production Asset，包括 `G19-PROD-ASSET-001`
- 创建第二 Production Asset、Batch Production、Team Expansion 或 Procurement Release

## 9. Current Status

| Item | Status |
|---|---|
| Gate-24 Build | `NOT_STARTED` |
| Approval | `APPROVED` |
| Authorization | `GRANTED` |
| Preflight | `BLOCKED` |
| Dependency | `BLOCKED` |
| Artifact Output | `BLOCKED` |
| Remediation Plan | `CREATED` |
| Build Artifacts | `NOT_CREATED` |
| Release | `NOT_AUTHORIZED` |
| Lifecycle Transition | `NOT_AUTHORIZED` |

下一治理步骤仅为执行已批准的整改准备并重新运行只读 Preflight。该步骤不得被解释为 Build 已启动。
