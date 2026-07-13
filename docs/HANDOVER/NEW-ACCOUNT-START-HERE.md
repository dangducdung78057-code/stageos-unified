# NEW ACCOUNT — START HERE

> StageOS 新账号和新 AI 的强制入口。开始任何修改前，必须完整阅读本文件。

## 1. 当前项目状态

- Gate-01～10：**Frozen**。
- Gate-10 Final：**Passed**。
- Gate-11 Phase 1：**已重建并正式落库**，交付路径为 `art-delivery/outfit-004/asset-expansion-rules/`。
- Gate-11 Phase 1 规则交付 Commit：`e0a018d199bb959da8651d1dc0850862beae4dbf`。
- Gate-11 Phase 1 Human Sign-off：**Pending / 尚未完成**。
- Gate-11 Phase 2：**Not Started / Blocked**。
- 下一步唯一允许任务：**Gate-11 Phase 1 Human Sign-off**。
- 四个 Production 角色单元：`primary-girl-basic-white`、`primary-boy-basic-white`、`teen-girl-basic-white`、`teen-boy-basic-white`。

## 2. 必须先阅读哪些文件

按以下顺序阅读：

1. `docs/HANDOVER/NEW-ACCOUNT-START-HERE.md`（本文件）
2. `docs/HANDOVER/PROJECT_HANDOVER_v1.md`
3. `art-delivery/outfit-004/asset-expansion-rules/README.md`
4. `art-delivery/outfit-004/asset-expansion-rules/GATE-11-PHASE-1-REBUILD-REPORT.md`
5. `art-delivery/outfit-004/asset-expansion-rules/GATE-11-PHASE-1-MANIFEST.json`
6. `docs/2.5d-character-asset-spec.md`
7. `docs/checklists/2.5d-character-onboarding.md`
8. `docs/checklists/2.5d-character-promotion.md`
9. `lib/stage-shared/stage-constraints.ts`
10. 与获批任务直接相关的实际文件

随后必须检查：

```text
git status
git log --oneline --decorate
git diff <approved-baseline>...HEAD
```

不得仅根据聊天、文件名或历史报告判断当前状态。

## 3. 当前不能做什么

- 不能修改 Gate-01～10。
- 不能修改 Blueprint 或 Production Specification。
- 不能修改任何 Frozen / Production 视觉资产。
- 不能启动 Gate-11 Phase 2。
- 不能自动创建 Gate-12 或后续路线。
- 不能把运行时代码当成缺失的 Gate 原始交付。
- 不能把“历史声明完成”当成“文件真实存在”。
- 不能把新写规则称为“恢复的原件”。
- 不能为了测试通过而放宽 Design DNA、Material DNA、Cloud Collar、Palette、Visual Integrity 或 Production Rules。
- 不能将 Center Variant 自动扩展到全队。
- 不能跨年龄段或跨节目类型自动复用服装。
- 未获明确授权时，不得继续开发、生成资产或改动规则。

## 4. 下一步唯一允许执行的任务

在项目负责人明确授权后：

**执行 Gate-11 Phase 1 Human Sign-off。**

签署对象：

```text
art-delivery/outfit-004/asset-expansion-rules/
```

规则交付已在 Commit `e0a018d199bb959da8651d1dc0850862beae4dbf` 中完成重建。Human Sign-off 必须保持只读验收，不得修改规则以制造通过结果，也不得启动 Gate-11 Phase 2。

Human Sign-off 至少复核以下八项：

1. Teen Girl → Primary Girl：Reject。
2. Center Variant → 全队成员：Reject。
3. Choral → Dance：Review Required。
4. Signature ≤ 12%。
5. Premium ≤ 35%。
6. Basic ≥ 60%。
7. 新增高饱和颜色：Reject 或 Review Required。
8. 同角色、同节目、增加人数：Allowed。

每项必须引用真实规则 ID、输入、实际输出和 PASS/FAIL；不能只抄写预期结果。

## 5. 如何判断项目没有跑偏

开始前、修改中和提交前逐项确认：

- [ ] 修改范围只包含获批路径。
- [ ] Gate-01～10 的 Git diff 为空。
- [ ] Blueprint 与 Production Specification 的 Git diff 为空。
- [ ] Production 角色和视觉资产的 Git diff 为空。
- [ ] 没有 Phase 2 文件或实现。
- [ ] 所有 JSON 可解析且不是占位内容。
- [ ] Revision Report 引用的规则 ID 在实际 JSON 中存在。
- [ ] 八项压力测试执行的是实际规则，而非人工写死结论。
- [ ] Center Variant、年龄边界、节目边界没有被放宽。
- [ ] Palette 比例和高饱和扩色限制仍有效。
- [ ] 新交付被如实标记为重建，不冒充恢复文件。
- [ ] Human Sign-off 结论有仓库证据和提交哈希。
- [ ] 状态变化已同步更新 `PROJECT_HANDOVER_v1.md`。

如果任一项无法证明，状态必须保持 `Pending` 或 `Revision Required`，不得宣布 Passed。

## 单一事实来源规则

后续账号和 AI 应以仓库中的以下文档作为交接入口：

- `docs/HANDOVER/PROJECT_HANDOVER_v1.md`
- `docs/HANDOVER/NEW-ACCOUNT-START-HERE.md`

实际文件与 Git 历史始终高于文档描述。若发现冲突，应先停止开发、记录证据并更新交接文档；不得依赖不可访问的历史聊天补全事实。
