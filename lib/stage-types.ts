// 艺演助手 — 共享类型与选项数据（基于 StageOS 文档抽象）

export const ENVIRONMENTS = [
  {
    value: 'indoor_stage',
    label: '室内舞台',
    desc: '有基础灯光，正面主视角',
  },
  {
    value: 'outdoor_sunlight',
    label: '室外自然光',
    desc: '阳光显色，靠色块构成',
  },
  {
    value: 'school_playground',
    label: '操场 / 广场',
    desc: '俯视与正面兼顾，人数多',
  },
  {
    value: 'auditorium',
    label: '礼堂 / 报告厅',
    desc: '专业灯光，意境表达',
  },
] as const

export const AGE_GROUPS = [
  { value: 'primary', label: '小学' },
  { value: 'junior', label: '初中' },
  { value: 'senior', label: '高中' },
  { value: 'teacher', label: '教师 / 成人团队' },
  { value: 'community', label: '社区 / 群众团队' },
] as const

export const THEMES = [
  { value: 'memory_of_life', label: '人生记忆 · 轻叙事' },
  { value: 'youth_vitality', label: '青春活力' },
  { value: 'ceremonial', label: '仪式 / 开场' },
  { value: 'patriotic', label: '家国主题' },
  { value: 'nature', label: '自然 / 山河' },
  { value: 'festival', label: '节庆欢腾' },
] as const

// 目标层级，对应分层评估模型 L1-L4
export const LEVELS = [
  { value: 'L1', label: 'L1 基础群体表演层', hint: '校级 · 能完成' },
  { value: 'L2', label: 'L2 视觉编排层', hint: '区/市级 · 好看' },
  { value: 'L3', label: 'L3 意境表达层', hint: '市级一等/省级 · 有作品感' },
  { value: 'L4', label: 'L4 工业舞台作品层', hint: '专业级 · 系统作品' },
] as const

export const PROPS = [
  { value: 'screen_panels', label: '屏风' },
  { value: 'fans', label: '扇子 / 绸' },
  { value: 'umbrellas', label: '伞' },
  { value: 'flags', label: '旗 / 标语' },
  { value: 'lanterns', label: '灯笼 / 光体' },
  { value: 'chairs', label: '凳 / 阶梯' },
] as const

export type FormationType =
  | 'module_array' // 模块阵列稳定型
  | 'layered_order' // 分层秩序型
  | 'density_flow' // 密度流动型
  | 'central_axis' // 中轴强化仪式型
  | 'morph_gradient' // 大形态渐变型

export const FORMATION_LABELS: Record<FormationType, string> = {
  module_array: '模块阵列稳定型',
  layered_order: '分层秩序型',
  density_flow: '密度流动型',
  central_axis: '中轴强化仪式型',
  morph_gradient: '大形态渐变型',
}

export interface StagePlanInput {
  performDate: string // 演出日期 yyyy-mm-dd
  peopleCount: number // 总人数 = 男 + 女
  maleCount: number
  femaleCount: number
  environment: string
  ageGroup: string
  theme: string
  targetLevel: string
  expectation: string // 期待描述
  props: string[]
}

// 倒排计划里程碑（按距演出天数倒排）
export interface RehearsalMilestone {
  offsetDays: number // 距演出还有多少天启动
  title: string
  desc: string
}

// 倒排计划以「周」为骨架（offsetWeeks = 距演出周数）
export const REHEARSAL_TEMPLATE: RehearsalMilestone[] = [
  { offsetDays: 42, title: '立项 · 确定主题与人数', desc: '确认节目方向、男女构成与目标层级，锁定演出环境。' },
  { offsetDays: 35, title: '方案设计 · 队形与配色', desc: '产出队形结构、配色工程与男女服装道具清单。' },
  { offsetDays: 28, title: '服装道具采购 / 制作', desc: '按配色方案分男女下单服装，准备道具与备用件。' },
  { offsetDays: 21, title: '基础队形排练', desc: '分声部/分块走位，按男女分区建立队形骨架与定位点。' },
  { offsetDays: 14, title: '动作与卡点合成', desc: '加入动作细节，对齐音乐卡点与队形转换。' },
  { offsetDays: 7, title: '带妆带服装连排', desc: '全要素连排，检查男女服装、道具与灯光配合。' },
  { offsetDays: 3, title: '场地实景彩排', desc: '在演出场地走台，校准间距、上下场与光位。' },
  { offsetDays: 0, title: '正式演出', desc: '最终呈现，留出候场与应急预案时间。' },
]

export interface TimelineNode {
  date: string
  daysToShow: number
  weeksToShow: number // 距演出整周数（向上取整）
  weekLabel: string // 如 "演出前 6 周" / "演出周"
  title: string
  desc: string
}

// 根据演出日期把模板转为具体里程碑日期（精确到周）
export function buildTimeline(performDate: string): TimelineNode[] {
  const target = new Date(performDate + 'T00:00:00')
  if (Number.isNaN(target.getTime())) return []
  return REHEARSAL_TEMPLATE.map((m) => {
    const d = new Date(target)
    d.setDate(d.getDate() - m.offsetDays)
    const weeks = Math.ceil(m.offsetDays / 7)
    return {
      date: `${d.getMonth() + 1}月${d.getDate()}日`,
      daysToShow: m.offsetDays,
      weeksToShow: weeks,
      weekLabel:
        m.offsetDays === 0
          ? '演出周'
          : weeks <= 1
            ? '演出前 1 周内'
            : `演出前 ${weeks} 周`,
      title: m.title,
      desc: m.desc,
    }
  })
}

export interface ColorRole {
  name: string
  hex: string
  ratio: number // 占比百分比
  role: string // 该色在舞台上的职责
}

// 购物关键词分级：精准词 + 兜底通用词
export interface KeywordTiers {
  precise: string[]
  fallback: string[]
}

export interface StagePlan {
  title: string
  level: string
  levelReason: string
  summary: string
  formationType: FormationType
  formationDescription: string
  layers: string[] // 前中后层次说明
  // 男女站位决策：如何按性别分区/对称/层次
  genderPlacement: {
    strategy: string // 站位策略名，如 "男后女前分层" / "中轴男女对称"
    description: string // 站位决策说明，必须结合男女人数
    maleZone: string // 男生主要站位
    femaleZone: string // 女生主要站位
  }
  colors: ColorRole[] // 主/辅/点缀
  screenBackdrop: {
    primaryHex: string // 大屏主题色
    secondaryHex: string // 大屏辅助/渐变色
    description: string // 大屏画面与氛围建议
  }
  // 服装：男女分两套，并说明如何统一/区分
  costume: {
    male: {
      top: string
      bottom: string
      accessory: string
      searchKeywords: KeywordTiers // 购物平台可搜关键词（精准 + 兜底）
    }
    female: {
      top: string
      bottom: string
      accessory: string
      searchKeywords: KeywordTiers
    }
    cohesionNote: string // 男女两套如何在色彩/款式上保持整体统一
  }
  lightingNotes: string[]
  rehearsalFocus: string[]
  riskNotes: string[]
}
