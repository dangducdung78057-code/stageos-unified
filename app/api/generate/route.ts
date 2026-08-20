import { generateText, Output } from 'ai'
import { z } from 'zod'
import {
  ENVIRONMENTS,
  AGE_GROUPS,
  THEMES,
  LEVELS,
  PROPS,
  type StagePlanInput,
} from '@/lib/stage-types'

export const maxDuration = 60

const planSchema = z.object({
  title: z.string().describe('方案标题，简洁有作品感'),
  level: z.string().describe('实际定位层级，如 "L3 意境表达层"'),
  levelReason: z.string().describe('为什么定位在该层级，一句话'),
  summary: z.string().describe('整体视觉构思，2-3 句'),
  formationType: z.enum([
    'module_array',
    'layered_order',
    'density_flow',
    'central_axis',
    'morph_gradient',
  ]),
  formationDescription: z.string().describe('队形结构说明与变化逻辑'),
  layers: z.array(z.string()).describe('前/中/后三层的站位与高度安排，3-4 条'),
  genderPlacement: z.object({
    strategy: z.string().describe('男女站位策略名，如 "男后女前分层"、"中轴男女对称"、"外圈男内圈女"'),
    description: z
      .string()
      .describe('站位决策说明，必须明确结合男 N 人、女 M 人的具体数量与比例来安排分区'),
    maleZone: z.string().describe('男生主要站位区域与职责'),
    femaleZone: z.string().describe('女生主要站位区域与职责'),
  }),
  colors: z
    .array(
      z.object({
        name: z.string().describe('颜色中文名'),
        hex: z.string().describe('十六进制色值，如 #C0392B'),
        ratio: z.number().describe('画面占比百分比，主色约60、辅色约30、点缀约10'),
        role: z.string().describe('该色在舞台上的职责'),
      }),
    )
    .describe('遵循 主色60% + 辅色30% + 点缀10% 的结构，共3-4个颜色'),
  screenBackdrop: z.object({
    primaryHex: z.string().describe('背景LED大屏主题色，十六进制，如 #1B3A5B'),
    secondaryHex: z.string().describe('大屏辅助/渐变色，与主题色协调'),
    description: z.string().describe('大屏画面内容与氛围建议，需与服装色拉开层次、不要喧宾夺主'),
  }),
  costume: z.object({
    male: z.object({
      top: z.string().describe('男生上装配色与款式建议'),
      bottom: z.string().describe('男生下装配色建议'),
      accessory: z.string().describe('男生头饰/道具配色建议'),
      searchKeywords: z.object({
        precise: z
          .array(z.string())
          .describe(
            '2-3 个精准关键词：完整含「品类+人群/性别+风格+颜色」，搜索后结果 60% 以上符合本方案主题与配色（如 "儿童演出服 男 中国风 长衫 靛蓝"）',
          ),
        fallback: z
          .array(z.string())
          .describe(
            '2-3 个兜底通用词：当精准词买不到时使用，放宽风格/颜色限制但仍属同品类（如 "儿童中国风演出服 男"），保证一定能搜到现货',
          ),
      }),
    }),
    female: z.object({
      top: z.string().describe('女生上装配色与款式建议'),
      bottom: z.string().describe('女生下装配色建议'),
      accessory: z.string().describe('女生头饰/道具配色建议'),
      searchKeywords: z.object({
        precise: z
          .array(z.string())
          .describe(
            '2-3 个精准关键词：完整含「品类+人群/性别+风格+颜色」，搜索后结果 60% 以上符合本方案主题与配色（如 "儿童演出服 女 古典舞 飘逸 藕粉"）',
          ),
        fallback: z
          .array(z.string())
          .describe(
            '2-3 个兜底通用词：当精准词买不到时使用，放宽风格/颜色限制但仍属同品类（如 "儿童古典舞演出服 女"），保证一定能搜到现货',
          ),
      }),
    }),
    cohesionNote: z
      .string()
      .describe('男女两套服装如何在色彩与款式上保持整体统一、不割裂'),
  }),
  lightingNotes: z.array(z.string()).describe('灯光/自然光使用建议，2-4 条'),
  rehearsalFocus: z.array(z.string()).describe('排练重点，3-5 条'),
  riskNotes: z.array(z.string()).describe('避坑提示与风险点，3-5 条'),
})

function labelOf<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string,
) {
  return list.find((i) => i.value === value)?.label ?? value
}

export async function POST(req: Request) {
  const input = (await req.json()) as StagePlanInput

  const propsLabels = input.props
    .map((p) => labelOf(PROPS, p))
    .join('、') || '无指定道具'

  const system = `你是 StageOS / 艺演助手 的舞台视觉结构设计引擎，定位为「面向群众型表演与市级半专业团队的群体舞台视觉结构设计系统」。
你的核心能力是：在低到中等执行精度条件下，仍能保证群体舞台视觉结构稳定成立。
你不是替专业编导设计高难动作，而是用「队形结构 + 色彩工程 + 光影 + 层次」提高低门槛团队的舞台完成度与获奖率。

设计原则：
- 色彩：主色1个(约60%) + 辅色1-2个(约30%) + 点缀色(约10%)，避免多彩渐变和小碎花，高饱和负责视觉锚点，白色负责提亮。
- 队形类型只能从这五种中选：模块阵列稳定型(module_array)、分层秩序型(layered_order)、密度流动型(density_flow)、中轴强化仪式型(central_axis)、大形态渐变型(morph_gradient)。
- 室外自然光环境 = 色彩工程 + 空间构成，不依赖灯光；室内/礼堂可用光影叙事。
- 正面主视角优先，一镜成立，中远景可读。
- 层级定位参考：L1能完成(校级)、L2好看(区市级)、L3意境/作品感(市级一等/省级)、L4系统级(专业)。低动作门槛也能达到L3。
- 避坑要具体：卡点不齐、道具高度不统一、灯光不稳、屏风移动不齐都会破坏高级感。
所有输出使用简体中文。`

  const prompt = `请为以下群体表演生成一套完整的舞台视觉方案：
- 演出时间：${input.performDate || '未指定'}
- 表演人数：${input.peopleCount} 人（男 ${input.maleCount} 人、女 ${input.femaleCount} 人）
- 演出环境：${labelOf(ENVIRONMENTS, input.environment)}
- 团队年龄/类型：${labelOf(AGE_GROUPS, input.ageGroup)}
- 主题方向：${labelOf(THEMES, input.theme)}
- 目标层级：${labelOf(LEVELS, input.targetLevel)}
- 可用道具：${propsLabels}
- 期待描述：${input.expectation?.trim() || '无特别说明'}

请结合以下硬性要求生成方案：

【男女人数是必须参与决策的核心因素】
- 站位(genderPlacement)必须基于男 ${input.maleCount} 人、女 ${input.femaleCount} 人的真实数量与比例来设计分区，明确说明为什么这样分（如人数差、视觉平衡、力量感/柔美感分布）。
- 队形层次与服装方案都要体现男女构成；若某一性别人数为 0，则按全员同性别处理，不要凭空虚构。

【服装建议必须可购买、可落地】
- searchKeywords 分两级：precise（精准词）+ fallback（兜底通用词），都不能含任何网址或链接。
- precise 必须是能在淘宝、拼多多、抖音商城等平台直接搜到现货的关键词，包含「品类 + 适用人群/性别 + 风格 + 颜色」，例如「儿童演出服 男 中国风 长衫 靛蓝」；搜索后结果 60% 以上符合本方案主题与配色。
- fallback 在精准词买不到时使用，放宽风格/颜色但仍属同一品类，保证一定能搜到现货，例如「儿童中国风演出服 男」。
- 不要使用抽象、自创或买不到的描述；服装配色必须服从前面的色彩工程（主/辅/点缀比例）。

整体方案需可落地、低风险、视觉完整度高，正面主视角一镜成立。`

  try {
    const { experimental_output } = await generateText({
      model: 'openai/gpt-5.5',
      system,
      prompt,
      experimental_output: Output.object({ schema: planSchema }),
    })

    return Response.json(experimental_output)
  } catch (err) {
    console.log('[v0] generate stage plan error:', (err as Error).message)
    return Response.json(
      { error: '方案生成失败，请稍后重试。' },
      { status: 500 },
    )
  }
}
