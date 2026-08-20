---
name: stageos-sprite-forge
description: "StageOS 专属人物精灵标准化多风格制作技能。按统一规格生产可入库的角色精灵与多视角参考图：Q版卡通、儿童真人比例、少年、像素风等多风格预设，含头身比实测质量门、一致性锁定、命名/锚点/透明底规范化、协议合规登记与收费分级元数据。当用户要求制作角色精灵、人物参考图、三视图/多视角图、换装素材、扩充精灵库、制作收费素材包，或提及 StageOS 精灵、sprite、角色素材标准化、头身比、四边面拓扑参考图时触发。"
---

# StageOS 人物精灵标准化制作

## 核心流程（六步，按序执行）

1. **明确参数**：与用户锁定 年龄段｜风格预设｜所需槽位（body/head/top/bottom/shoes/accessory）｜视角集合（front / front_left / front_right / 8方向）｜用途（拓扑参考 / 直接入库 / 收费素材包）。
2. **选风格预设**：查 [references/style-presets.md](references/style-presets.md)，取目标头身比与提示词模板。
3. **生成参考图**：先出 front → 上传换取公开 URL → 以 front 为参考图生成其余视角锁定一致性。提示词必须包含「头脸朝向＝身体朝向＝脚尖朝向，禁止扭脖看镜头」。
4. **质量门**（全部通过才可交付，任一失败即重做该张）：
   - 运行 `scripts/measure_head_ratio.py <img>`，实测头身比必须落在预设区间；
   - 头脸朝向 = 身体朝向 = 脚尖朝向；
   - 左右标注核对：脸朝画面右侧 = 左前视图（front_left），脸朝画面左侧 = 右前视图（front_right），生成反了换名或重出；
   - 各视角脸/发型/服装/比例一致；
   - 服装、姿势、简化规格逐条对照用户原始要求。
5. **规范化入库**：按 [references/sprite-spec.md](references/sprite-spec.md) 执行画布尺寸、透明底、脚底中心锚点、命名规范；运行 `scripts/validate_sprite.py <sprite>` 全部通过；非自产素材登记 CREDITS.csv（协议速查见 [references/license-guide.md](references/license-guide.md)）。
6. **登记精灵库**：按 sprite-spec.md 的元数据 schema 写入条目，标注 priceTier 以支撑收费模块。

## 提示词工程要点（已验证的坑）

- **模型幼态偏置**：生成模型会把儿童角色幼化约 1 个头身。要落地 6.5 头身，提示词写「7 heads tall, legs half of total height, pre-teen, reduced baby fat」，生成后以实测值为准，不看宣传值。
- **渐变背景会毁掉测量**：任何头身比数字必须来自 `measure_head_ratio.py`（逐行背景估计），禁止用全局背景色目测或手算。
- **简化规格写进提示词**：并指手（thumb plus combined four-finger block）、无鞋带鞋（laceless slip-on）、头盔式块面头发（one smooth solid mass）、零褶皱（zero wrinkles/folds），面向低模拓扑时必写。
- **一致性锁定**：第二张起必须传第一张的公开 URL 作为参考图；本地图先上传换 URL，禁止直接传本地路径。

## 收费素材包规则

- 每个精灵包 = 1 个角色 × 1 种风格 × 约定视角集 × 约定槽位集，配一份元数据 JSON。
- priceTier：`free`（基础库，随系统分发）/ `pro`（风格扩展包）/ `studio`（定制角色）。
- 商用分发的素材只允许两类来源：自产（AI 生成 + 人工校验，版权归 StageOS）或 CC0；SA/GPL 素材禁止入库，核查方法见 license-guide.md。

## 脚本

- `scripts/measure_head_ratio.py <image>` → JSON：`{"total_px","head_px","ratio"}`。年龄比例质量门，逐行背景估计，抗渐变底。
- `scripts/validate_sprite.py <sprite.png> [--sizes 128x192,...] [--anchor-tol 8]` → 校验 PNG透明/画布尺寸/脚底中心锚点/命名规范，输出逐项 JSON，退出码 0 = 可入库。
