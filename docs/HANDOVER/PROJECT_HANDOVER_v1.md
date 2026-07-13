# StageOS Project Handover v1

> 版本：v1  
> 基线日期：2026-07-12  
> 仓库：`dangducdung78057-code/stageos-unified`  
> 当前分支：`v0/1003521464-8594-6c957961`  
> 事实优先级：仓库中的实际文件与 Git 历史高于历史状态声明。本文件记录“项目声明状态”和“仓库可验证状态”之间的差异，不以推测填补缺失交付。

## 一、项目概述

StageOS 是面向舞台节目规划、角色编排、服装方案、队形及 2.5D/3D 舞台预览的一体化系统。Costume System 的当前定位是：在学段、角色、节目类型、主题、舞台条件与制作约束下，生成可复用、可生产、可采购并可在角色资产上可靠预览的服装系统，而不是仅生成单张概念图。

当前开发阶段是 **Gate-11 Asset Expansion，Phase 1 阻塞恢复/重建阶段**。Gate-01～10 被项目治理状态声明为 Frozen，Gate-10 Final 被声明为 Passed；但 Gate-11 Phase 1 的原始交付在当前仓库及可恢复 Git 来源中不存在，因此尚未 Human Sign-off，Phase 2 未启动。

## 二、Gate 开发历史

> Gate-01～08 的名称来自已确认的 Gate 清单。Gate-09、Gate-10 的正式标题和逐项原始交付未在当前仓库中找到；不能伪造其名称或路径。它们的冻结/通过状态属于项目治理声明，后续若取得原始归档，应补齐本节证据链接。

### Gate-01 — Base Garment

- 目标：建立服装基础版型和基础服装单元。
- 已完成内容：项目状态声明为已完成。
- 状态：**Passed / Frozen**。
- 关键交付文件：当前仓库未发现原始 `art-delivery/` 交付，路径待外部归档补证。
- 是否允许修改：**不允许**。

### Gate-02 — Cloud Collar

- 目标：建立 Cloud Collar 的造型、适配与使用边界。
- 已完成内容：项目状态声明为已完成。
- 状态：**Passed / Frozen**。
- 关键交付文件：当前仓库未找到原始规则目录，待补证。
- 是否允许修改：**不允许**。

### Gate-03 — Palette System

- 目标：建立服装配色层级、组合和扩展边界。
- 已完成内容：项目状态声明为已完成；代码仓库现有 `lib/stage-shared/palette-data.ts`、`lib/stage-shared/palette-library.ts` 等运行时配色实现，但它们不能替代 Gate 原始交付。
- 状态：**Passed / Frozen**。
- 关键交付文件：运行时配色文件存在；Gate 原始交付路径缺失。
- 是否允许修改：**不允许修改已冻结规则**。

### Gate-04 — Team Composition

- 目标：建立角色与团队的组合、编排和一致性机制。
- 已完成内容：项目状态声明为已完成；应用已有共享场景、角色清单和队形编辑能力。
- 状态：**Passed / Frozen**。
- 关键交付文件：当前仓库未找到 Gate 原始交付；相关运行时代码位于 `domain/stageos/`、`components/formation/`。
- 是否允许修改：**不允许修改冻结规则**。

### Gate-05 — Aesthetic Engine / Material DNA

- 目标：建立审美决策引擎，以及材质选择、迁移和一致性约束。
- 已完成内容：两个 Gate-05 模块均被声明为已完成。
- 状态：**Passed / Frozen**。
- 关键交付文件：Material DNA 原始规则目录当前缺失；运行时约束不能视为原始设计交付。
- 是否允许修改：**不允许**。

### Gate-06 — Thin Veil Overlay

- 目标：建立 Thin Veil 叠层的视觉、材质和制作规则。
- 已完成内容：项目状态声明为已完成。
- 状态：**Passed / Frozen**。
- 关键交付文件：当前仓库未找到原始 Thin Veil 目录。
- 是否允许修改：**不允许**。

### Gate-07 — Costume Assembly / Priority Rules

- 目标：建立服装部件装配顺序、冲突消解和优先级规则。
- 已完成内容：两个 Gate-07 模块均被声明为已完成。
- 状态：**Passed / Frozen**。
- 关键交付文件：当前仓库未找到原始 Assembly/Priority 交付目录。
- 是否允许修改：**不允许**。

### Gate-08 — Production Blueprint / Cost Layer

- 目标：把服装方案转换为可制作的 Blueprint，并叠加成本层级与预算约束。
- 已完成内容：两个 Gate-08 模块均被声明为已完成。
- 状态：**Passed / Frozen**。
- 关键交付文件：Blueprint、Production Specification、Cost 原始目录在当前仓库中不可见；它们仍被视为冻结对象。
- 是否允许修改：**绝对不允许**。

### Gate-09 — 正式标题待原始归档确认

- 目标：正式目标记录缺失；不得根据聊天或相邻 Gate 自行命名。
- 已完成内容：项目治理状态将 Gate-01～10 整体声明为 Frozen。
- 状态：**Passed / Frozen（状态声明），证据路径待补齐**。
- 关键交付文件：当前仓库未识别到可验证的 Gate-09 原始交付。
- 是否允许修改：**不允许**。

### Gate-10 — Final

- 目标：完成 Gate-01～10 的最终整体验收与冻结。
- 已完成内容：项目状态明确为 `Gate-10 Final: Passed`。
- 状态：**Passed / Frozen**。
- 关键交付文件：当前仓库未找到独立 Final 签署文档；需保留这一证据缺口。
- 是否允许修改：**不允许**。

### Gate-11 — Asset Expansion

- 目标：在不破坏冻结 Design DNA、Material DNA、角色边界和生产约束的前提下，建立资产复用与扩展规则。
- 已完成内容：曾声明 Phase 1 Revision Completed，但原始交付未进入当前仓库，且无法从工作区、分支、stash、reflog 或 Git 对象恢复。
- 状态：**Phase 1 Pending Rebuild / Human Sign-off Failed；Phase 2 Not Started**。
- 预期关键交付目录：`art-delivery/outfit-004/asset-expansion-rules/`。
- 预期文件：`README.md`、`character-reuse-rules.json`、`material-dna-migration-rules.json`、`palette-expansion-rules.json`、`cloud-collar-compatibility-rules.json`、`age-program-boundary-rules.json`、`expansion-validation-rules.json`、`validation-cases.json`、`GATE-11-PHASE-1-REVISION-REPORT.md`。
- 是否允许修改：只允许在获得明确任务后重建 Phase 1 的上述交付；不得触碰 Gate-01～10 或启动 Phase 2。

## 三、当前冻结状态

- Gate-01～10：**Frozen**。
- Gate-10 Final：**Passed**。
- Gate-11 Phase 1：原始交付未找到；恢复失败；必须显式重建；当前 Revision 不能视为仓库完成；**Human Sign-off 未通过**。
- Gate-11 Phase 2：**Not Started / Blocked**。

## 四、当前所有规则目录

### 仓库实际状态

当前仓库中 **不存在 `art-delivery/` 目录**。因此下列目录是项目架构中应有或历史状态所指向的规则域，不可误报为当前已存在：

- Costume System：基础服装、装配和角色着装规则。
- Material DNA：材质身份、替换、迁移与兼容边界。
- Thin Veil：薄纱叠层的视觉和生产约束。
- Blueprint：把设计决策转换为生产蓝图。
- Production：规格、工艺、尺寸、落地与质量边界。
- Cost：成本层级、预算比例与成本风险。
- Procurement：采购候选、替代材料、供应风险与人工核验；代码中存在采购 feature flag 和候选机制，但不是冻结交付目录。
- Asset Expansion：角色复用、材质迁移、Palette 扩展、Cloud Collar 兼容、年龄/节目边界与验证案例。

Gate-11 预期目标路径为：

```text
art-delivery/outfit-004/asset-expansion-rules/
```

该路径当前不存在，不能用根目录文件或运行时代码冒充。

## 五、当前资产状态

### 已通过、可复用角色单元

以下四个角色包的 Manifest 均标记为 `assetStatus: production`、`placeholder: false`、`productionReady: true`：

- `primary-girl-basic-white`
- `primary-boy-basic-white`
- `teen-girl-basic-white`
- `teen-boy-basic-white`

位置：`public/assets/stage-2.5d/characters/<characterId>/basic-white/`。它们支持正面、左前、右前三方向；生产资产不得因 Gate-11 重建而被修改。

### 被拒绝或历史阻塞资产

- 仓库中的 `public/PREVIEW_ASSET_AUDIT_REPORT.md` 记录过旧 `primary-boy-basic-white` RGB PNG 缺少 Alpha 通道导致灰色矩形的问题。
- 当前 Manifest 已是 Production 状态且无 blocker；历史报告中的 development 状态不是当前 Manifest 状态。
- 未找到一份可作为“全部被拒绝资产清单”的权威目录，不得自行补写拒绝名单。

### Center Variant

Center Variant 是角色/服装适用范围的一种特殊变体。Gate-11 压力测试的预期边界是：**Center Variant 不得直接扩展到全队成员，预期决策为 Reject**。对应原始规则文件缺失，因此该结论仍须在 Phase 1 重建后由实际规则 ID 固化并重新签署。

### 团队合成机制

团队由共享场景模型、performer/角色单位、sprite manifest 与队形编辑器组合。Gate-04 Team Composition 已冻结；Gate-11 只能定义资产是否可复用，不得重写团队合成机制。

## 六、当前阻塞项

1. `art-delivery/outfit-004/asset-expansion-rules/` 不存在。
2. Gate-11 Phase 1 的九个预期交付文件均未找到。
3. 原始交付无法从当前文件系统、分支、stash、reflog、worktree、reachable/unreachable Git 对象恢复。
4. Gate-11 Phase 1 的“Completed”历史声明缺少仓库证据，不能作为完成依据。
5. 八项压力测试没有真实规则 ID 可执行，Human Sign-off 未通过。
6. Gate-09 正式标题、目标和交付路径缺少原始证据。
7. Gate-01～10 的 `art-delivery` 原始目录未随当前仓库提供；必须维持冻结，不得因不可见而重建或覆盖。
8. 如无外部归档可提供，Gate-11 Phase 1 必须重建，而不是继续恢复。

恢复审计见仓库根目录：`GATE-11-PHASE-1-DELIVERY-RECOVERY-REPORT.md`。

## 七、下一步开发路线

### 唯一下一步

在获得明确授权后，**重建 Gate-11 Phase 1 Asset Expansion 规则交付**，仅写入预期目录，并完成 JSON 校验、规则 ID 映射、八项压力测试和新的 Human Sign-off。

八项必须验证的预期行为：

1. Teen Girl → Primary Girl：Reject。
2. Center Variant → 全队成员：Reject。
3. Choral → Dance：Review Required。
4. Signature ≤ 12%。
5. Premium ≤ 35%。
6. Basic ≥ 60%。
7. 新增高饱和颜色：Reject 或 Review Required。
8. 同角色、同节目、增加人数：Allowed。

### Gate-11 Phase 2

只有 Phase 1 重建且 Human Sign-off 通过后才可规划或启动。当前没有经过授权的 Phase 2 实施范围，不得自行推断。

### Gate-11 之后

当前仓库没有获批准的 Gate-12 或后续 Gate 路线图。不得自行创建 Gate 编号、目标或资产；应先由项目负责人补充正式 Roadmap。

## 八、绝对禁止事项

- 不得修改 Gate-01～10。
- 不得修改任何已冻结视觉资产或 Production 角色包。
- 不得修改 Blueprint。
- 不得修改 Production Specification。
- 不得为了让 Gate-11 测试通过而放宽既有 Design DNA、Material DNA、Cloud Collar 或 Palette 边界。
- 不得把运行时代码、聊天文本或推测内容冒充原始 `art-delivery`。
- 不得把 Center Variant 扩展到全队。
- 不得跨年龄段、跨节目类型自动复用服装。
- 不得在 Gate-11 Phase 1 Human Sign-off 前启动 Phase 2。
- 不得自动晋级、重绘、替换或批量修改 Production 角色资产。

## 九、项目技术约束

### 核心约束

- Design DNA：定义整体审美身份，是所有下游规则的上位约束。
- Material DNA：在 Design DNA 内规定材质身份、质感、迁移与替代边界。
- Cloud Collar：受 Design DNA、年龄、节目类型、角色范围和生产可行性共同约束。
- Palette：必须保持既定色彩层级和比例；扩展不能引入失控的高饱和颜色。
- Visual Integrity：三方向角色、透明通道、mask、锚点、尺度、区域换色和团队画面必须一致。
- Production Rules：Blueprint、制作规格、成本与采购必须服从视觉规则，同时保证可制作和可审计。

### 依赖关系

```text
Design DNA
├── Base Garment
├── Cloud Collar
├── Palette System
└── Aesthetic Engine
    └── Material DNA
        └── Thin Veil / Costume Assembly
            └── Priority Rules
                └── Production Blueprint
                    ├── Production Specification
                    ├── Cost Layer
                    └── Procurement
                        └── Asset Expansion（只能在上述冻结边界内扩展）
```

运行时还有 65 条学段×主题×节目×舞台约束，入口为 `lib/stage-shared/stage-constraints.ts`，分为 `hard_block`、`soft_warn`、`info_note`。这些运行时规则是产品逻辑证据，但不能替代缺失的 Gate 交付。

## 十、已知问题

### 已修复或已晋级

- Primary Girl 的预览 mask 曾被误判；审计确认其 RGBA mask 可正常工作。
- 旧 Primary Boy RGB PNG 曾造成灰色背景矩形；当前角色已晋级 Production。
- Primary Girl、Primary Boy、Teen Girl、Teen Boy 当前 Manifest 均为 Production Ready。
- 角色资产已有 validator、onboarding 与 promotion 规范。

### 尚未修复

- Gate-11 Phase 1 原始交付缺失且不可恢复。
- Gate-11 Phase 1 Human Sign-off 未通过。
- Gate-01～10 原始 `art-delivery` 在当前仓库不可见。
- Gate-09 的正式档案信息不完整。

### AI 容易犯的错误

- 只检查仓库根目录，而不检查规定的嵌套路径。
- 把“聊天中说完成”当作“仓库里真实存在”。
- 找不到原件时凭预期结果重造，并称其为“恢复”。
- 把当前运行时代码误当成冻结 Gate 原始交付。
- 忽略 `HEAD`、`origin/master`、工作区和 Git 对象之间的差异。
- 在 Human Sign-off 前提前启动 Phase 2。
- 修改已冻结 Gate 或视觉资产来规避规则失败。
- 把历史审计报告里的旧状态当作当前 Manifest 状态。

### 特别注意

每次状态判定都必须列出：实际路径、文件存在性、Git 基线、规则 ID、测试输入、实际输出和签署状态。证据不足时必须写 `Unknown`、`Missing` 或 `Pending Rebuild`，不能写 `Passed`。

## 十一、新账号接手说明

新账号的操作入口为：

`docs/HANDOVER/NEW-ACCOUNT-START-HERE.md`

该文件定义必读顺序、禁止事项、唯一允许任务和防跑偏检查。任何后续 AI 在修改项目前必须先阅读它，再阅读本文件和恢复审计报告。

## 文档治理

- 本文档是仓库内交接事实入口，不依赖聊天记录。
- 若本文档与实际文件冲突，以实际文件和 Git 历史为准，并在同一提交中更新本文档。
- 不允许只在聊天中更新 Gate 状态；状态改变必须落到仓库文档并引用可验证交付。
- 每次 Gate Human Sign-off 后，应更新版本、提交哈希、规则 ID、测试结果和允许修改范围。
