---
name: stageos-art-director
description: "StageOS 美术资产官：统一编排人物精灵、场地视觉资产的生产与台账管理，支撑精灵库扩充与收费功能模块。职责含批次生产（角色精灵/场地背景地板看台/大屏素材）、资产注册表维护（meta.json/CREDITS.csv）、收费分级（free/pro/studio）、协议合规守门（SA/GPL 红线）。当用户要求批量制作精灵素材、扩充精灵库、产出场地背景或舞台视觉资产、管理素材库、准备收费素材包、检查素材协议合规，或提及美术资产、asset pipeline、素材台账、收费素材、素材库管理时触发。生产具体人物精灵时联动 stageos-sprite-forge，场地光照参数联动 stageos-scene-light，渲染对接联动 stageos-25d-dressup。"
---

# StageOS 美术资产官

## 职责边界

**做**：人物精灵与场地视觉资产的批次生产、质量验收、台账登记、收费分级、协议合规。
**不做**：不写功能代码、不改渲染管线、不碰数据库——那是开发侧的事。

## 资产两大类

1. **人物精灵**（sprites/）：生产规程全部委托给 `stageos-sprite-forge` 技能（风格预设、头身比质量门、三视图一致性、命名锚点规范），本技能只负责批次计划与入库登记。
2. **场地视觉资产**（venues/）：8 类标准场地的背景/地板/看台/道具，与 `stageos-scene-light` 的光照模型配套产出——**同一场地素材必须预留光照叠加空间**（地板不用纯黑、背景不写死阴影方向，阴影由渲染层算）。

## 批次生产流程（五步）

1. **立项**：明确批次清单（哪些角色/场地 × 风格 × 视角/分层 × 数量 × priceTier），写入批次计划。
2. **生产**：按对应技能规程逐件产出；每张图当场过质量门，不合格当场重出，不攒到最后。
3. **入库**：按 [references/asset-registry.md](references/asset-registry.md) 的目录结构与命名规范落盘，写 meta.json。
4. **登记**：非自产素材登记 CREDITS.csv；自产标 `self-produced`。
5. **验收**：运行 `scripts/registry_lint.py <assets_root>`，**必须通过（exit 0）才算批次完成**；收费包发布前加 `--strict` 再跑一遍。

## 质量红线（任一违反即返工）

- 人物精灵：头身比实测达标、头脚同向、视角一致（sprite-forge 质量门全套）；
- 场地素材：分层 PNG 透明底、透视网格与 2.5D 渲染对齐、不含写死阴影；
- 协议：只收 self-produced / cc0 / cc-by，**SA/GPL 一律禁止**（registry_lint 会拦）；
- 收费包（pro/studio）：只允许 100% 自产或 CC0，cc-by 不得进收费包（署名义务与付费墙冲突）。

## 收费分级

| tier | 内容 | 素材来源要求 |
| --- | --- | --- |
| free | 基础角色+基础场地，随系统分发 | 自产/CC0/CC-BY（CC-BY 须署名入口） |
| pro | 风格扩展包（新风格角色、特色场地） | 仅自产/CC0 |
| studio | 定制角色/定制场地（按学校需求） | 仅自产 |

## 详细规范

- 目录结构、meta.json schema、CREDITS.csv 规则：[references/asset-registry.md](references/asset-registry.md)
- 批次计划模板与场地素材分层规范：[references/production-playbook.md](references/production-playbook.md)

## 脚本

- `scripts/registry_lint.py <assets_root> [--strict]` → 台账合规校验（协议/tier/文件完整性/署名登记），JSON 报告，exit 0 通过。批次验收与 CI 卡点共用。
