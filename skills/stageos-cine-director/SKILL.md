---
name: stageos-cine-director
description: "StageOS 电影导演级视觉整合技能。位于所有资源技能之上的决策层：为一个演出节目制定完整视觉叙事方案——镜头语言（景别/角度/构图）、色彩脚本（开场-发展-高潮-结尾的光色弧）、光影设计（联动 scene-light）、叙事化队形（联动队形库）、服装与屏色搭配（联动精灵库/资产台账），输出可执行的导演分镜表并校验资源缺口。当用户要求做演出视觉总方案、分镜脚本、电影感/大片感舞台效果、色彩脚本、导演级效果图/宣传片、把节目做出电影质感，或提及镜头、景别、运镜、分镜、调色、视觉叙事时触发。"
---

# StageOS 电影导演

## 定位

决策层技能，**不亲自生产素材、不改代码**。读取全部资源库状态，输出导演分镜表，把执行参数下发给：
- `stageos-sprite-forge`（角色素材缺口）
- `stageos-art-director`（资产批次下单与台账）
- `stageos-scene-light`（光照/屏色参数）
- `stageos-25d-dressup`（渲染与导出）

## 工作流程（六步）

1. **读作品**：节目类型（映射品类 choir/dance/drama…）、人数、时长、主题、文化背景、比赛/演出场地。
2. **定视觉叙事弧**：按 [references/color-script.md](references/color-script.md) 把节目切成 3–6 个叙事段落，每段定情绪、主色、光色温、屏色。
3. **排镜头**：按 [references/shot-language.md](references/shot-language.md) 为每段配景别/角度/构图；高潮段必须有景别对比，禁止全程同景别。
4. **配资源**：每段指定 sprite_id / venue_id / formation / 服装色板；查资产库确认存在，缺口记入下单清单。
5. **写分镜表**：按 [references/director-board.md](references/director-board.md) 的 schema 输出 JSON。
6. **校验**：运行 `scripts/storyboard_lint.py <分镜表> --assets <资产库>`，exit 0 才交付；资产缺口清单交 art-director 下单。

## 导演原则（不可妥协）

- **叙事先行**：每个视觉元素（色/光/队形/镜头）必须回答"它为这段情绪做了什么"，答不上来的删掉；
- **声场优先**：队形与动作不得破坏发声/演奏效果（百合模式：动作服务音乐）；
- **对比出高潮**：色温、景别、队形密度在高潮段必须与前段形成可感知对比；
- **可执行性**：人数/时长不碰品类红线（lint 内置展演规格），舞台条件不假设不存在的设备。

## 脚本

- `scripts/storyboard_lint.py <storyboard.json> [--assets <root>] [--specs <file>]` → 校验时间轴/人数规格/资源存在性/色彩合法性，输出缺口清单。内置第八届展演人数与时长规格，`--specs` 可覆盖为当届官方文件。

## 待吸收资料

`references/` 下预留 `cine-language.md` 位置：电影镜头美学深度调研报告到达后，蒸馏其核心方法论写入该文件并在 SKILL.md 登记链接，原有章节不删。
