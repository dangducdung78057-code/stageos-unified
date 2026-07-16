import type { MembershipTier, ProjectInput, ScheduleCategory, ScheduleTask } from './types'

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function due(performanceDate: string, daysBefore: number): string {
  const date = new Date(`${performanceDate}T12:00:00`)
  date.setDate(date.getDate() - daysBefore)
  return isoDate(date)
}

type TaskSeed = Omit<ScheduleTask, 'id' | 'dueDate' | 'completed'>

const CORE_TASKS: TaskSeed[] = [
  { title: '项目目标与节目内容确认', category: '策划' as ScheduleCategory, daysBefore: 45, owner: '项目负责人' },
  { title: '完成第一版整体方案', category: '方案' as ScheduleCategory, daysBefore: 38, owner: '带队教师' },
  { title: '完成队形草图', category: '队形' as ScheduleCategory, daysBefore: 32, owner: '编导/教师' },
  { title: '服装方向与预算确认', category: '服装' as ScheduleCategory, daysBefore: 30, owner: '服装负责人' },
  { title: '样衣或样品确认', category: '采购' as ScheduleCategory, daysBefore: 24, owner: '采购负责人' },
  { title: '背景、道具和音乐文件定稿', category: '舞台' as ScheduleCategory, daysBefore: 18, owner: '舞台负责人' },
  { title: '完成分段排练', category: '排练' as ScheduleCategory, daysBefore: 14, owner: '带队教师' },
  { title: '服装到货与试穿', category: '服装' as ScheduleCategory, daysBefore: 8, owner: '服装负责人' },
  { title: '完成第一次合成排练', category: '排练' as ScheduleCategory, daysBefore: 7, owner: '全体' },
  { title: '完成技术彩排', category: '现场' as ScheduleCategory, daysBefore: 3, owner: '技术负责人' },
  { title: '终检与应急包封装', category: '现场' as ScheduleCategory, daysBefore: 1, owner: '项目负责人' },
  { title: '正式演出', category: '演出' as ScheduleCategory, daysBefore: 0, owner: '全体' },
]

const MEMBER_TASKS: TaskSeed[] = [
  {
    title: '完成 2.5D 队形与舞台预演',
    category: '预演' as ScheduleCategory,
    daysBefore: 28,
    owner: '编导/教师',
    memberOnly: true,
    dependsOn: ['完成第一版整体方案'],
  },
  {
    title: '完成服装、灯光和背景联合校色',
    category: '视觉' as ScheduleCategory,
    daysBefore: 16,
    owner: '视觉负责人',
    memberOnly: true,
    dependsOn: ['样衣或样品确认', '背景、道具和音乐文件定稿'],
  },
  {
    title: '完成关键帧与走位冲突检查',
    category: '走位' as ScheduleCategory,
    daysBefore: 10,
    owner: '编导/教师',
    memberOnly: true,
    dependsOn: ['完成 2.5D 队形与舞台预演'],
  },
  {
    title: '完成遮挡与安全诊断',
    category: '安全' as ScheduleCategory,
    daysBefore: 6,
    owner: '安全负责人',
    memberOnly: true,
    dependsOn: ['完成第一次合成排练'],
  },
]

export function buildReverseSchedule(
  input: ProjectInput,
  tier: MembershipTier,
): ScheduleTask[] {
  const seeds = tier === 'free' ? CORE_TASKS : [...CORE_TASKS, ...MEMBER_TASKS]
  const rehearsalBuffer =
    input.rehearsalFrequencyPerWeek < 3
      ? 5
      : input.performerCount > 60
        ? 3
        : 0

  return seeds
    .map((task, index) => {
      const adjustedDays =
        task.category === '排练' || task.category === '走位'
          ? task.daysBefore + rehearsalBuffer
          : task.daysBefore

      return {
        ...task,
        id: `schedule-${index + 1}`,
        daysBefore: adjustedDays,
        dueDate: due(input.performanceDate, adjustedDays),
        completed: false,
      }
    })
    .sort((a, b) => b.daysBefore - a.daysBefore)
}

export const CATEGORY_COLORS: Record<string, string> = {
  策划: 'bg-purple-100 text-purple-800',
  方案: 'bg-blue-100 text-blue-800',
  队形: 'bg-cyan-100 text-cyan-800',
  服装: 'bg-pink-100 text-pink-800',
  采购: 'bg-orange-100 text-orange-800',
  舞台: 'bg-teal-100 text-teal-800',
  排练: 'bg-green-100 text-green-800',
  现场: 'bg-red-100 text-red-800',
  演出: 'bg-yellow-100 text-yellow-800',
  预演: 'bg-indigo-100 text-indigo-800',
  视觉: 'bg-violet-100 text-violet-800',
  走位: 'bg-lime-100 text-lime-800',
  安全: 'bg-rose-100 text-rose-800',
}
