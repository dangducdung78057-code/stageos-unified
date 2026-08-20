# 风格预设表

每个预设给出：目标头身比（实测判定区间）＋ 提示词模板关键词。生成模型有幼态偏置，提示词中的头身数字要**比目标多报约 1 个头身**，最终以 `measure_head_ratio.py` 实测为准。

## 预设一览

| 预设 ID | 风格 | 目标头身比 | 合格区间 | 适用场景 |
| --- | --- | --- | --- | --- |
| `chibi-q` | Q版卡通 | 4.0 | 3.5–4.5 | 可爱向课件、低龄演出 |
| `realistic-child` | 儿童真人比例（10岁） | 6.5 | 6.2–6.8 | StageOS 主力：K12 演出预览 |
| `realistic-teen` | 少年比例（13-15岁） | 7.0 | 6.7–7.3 | 初中演出 |
| `pixel-32` | 像素风 32px | 不按头身比 | 按像素网格评审 | 复古游戏化模块 |
| `lowpoly-3d` | 低模3D渲染帧 | 与对应年龄预设一致 | 同上 | 收费 3D 素材包 |

## 提示词模板

### chibi-q / realistic-child / realistic-teen（同一骨架，换比例句）

```
Character design turnaround reference sheet, {VIEW} VIEW, full body head to toe, centered.
A {AGE}-year-old {GENDER}, {PROPORTION_SENTENCE}, friendly stylized cartoon face.
Black hair rendered as ONE SMOOTH SOLID MASS like a helmet, no hair strands.
She/He wears: {COSTUME}. MITTEN HANDS: thumb plus one combined four-finger block,
NO individual fingers. Neutral A-pose, arms slightly away from body.
ZERO wrinkles, ZERO folds, ZERO seams, ZERO accessories.
Flat even studio lighting, SOLID FLAT single-color background (no gradient),
character fills 85% of frame height, high quality clean render.
Her/His whole body, head, face, gaze AND toes all point toward {FACING_DIRECTION}.
Head is NOT twisted back toward camera.
```

PROPORTION_SENTENCE：
- chibi-q: `stylized 3D cartoon chibi proportions, big head, about 4 heads tall`
- realistic-child: `REALISTIC HUMAN PROPORTIONS, exactly 7 heads tall, legs half of total height, pre-teen face with reduced baby fat, NOT a toddler, NOT chibi`（目标落地 6.5）
- realistic-teen: `REALISTIC HUMAN PROPORTIONS, exactly 8 heads tall, long slim limbs, teenage`（目标落地 7.0）

背景必须写明 **solid flat single-color background, no gradient**——渐变底会干扰测量与抠图。

### pixel-32

```
32x32 pixel art character sprite, {DIRECTION} view, {AGE}-year-old {GENDER},
{COSTUME}, transparent background, crisp nearest-neighbor pixels,
limited 16-color palette, no anti-aliasing, centered on 32x32 canvas.
```

### lowpoly-3d

先用对应年龄预设产出三视图 → 低模拓扑（四边面，顶点预算 ≤2800）→ 渲染 8 方向帧 → 按 sprite-spec 入库。拓扑简化规格：并指手、无带鞋、块面发、零褶皱。

## 多视角生成顺序

1. 先生成 front；
2. 上传 front 换公开 URL；
3. 其余视角以该 URL 为参考图生成，提示词写 `Exact same character as the reference image, identical face/hair/costume`；
4. 每张图生成后立即过质量门，不合格当场重出，不带到下一张。
