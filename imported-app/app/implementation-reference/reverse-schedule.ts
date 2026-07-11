import type { MembershipTier, ProjectInput, ScheduleTask } from "./types";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function due(performanceDate: string, daysBefore: number): string {
  const date = new Date(`${performanceDate}T12:00:00`);
  date.setDate(date.getDate() - daysBefore);
  return isoDate(date);
}

type TaskSeed = Omit<ScheduleTask, "id" | "dueDate" | "completed">;

const CORE_TASKS: TaskSeed[] = [
  { title: "项目目标与节目内容确认", category: "策划", daysBefore: 45, owner: "项目负责人" },
  { title: "完成第一版整体方案", category: "方案", daysBefore: 38, owner: "带队教师" },
  { title: "完成队形草图", category: "队形", daysBefore: 32, owner: "编导/教师" },
  { title: "服装方向与预算确认", category: "服装", daysBefore: 30, owner: "服装负责人" },
  { title: "样衣或样品确认", category: "采购", daysBefore: 24, owner: "采购负责人" },
  { title: "背景、道具和音乐文件定稿", category: "舞台", daysBefore: 18, owner: "舞台负责人" },
  { title: "完成分段排练", category: "排练", daysBefore: 14, owner: "带队教师" },
  { title: "服装到货与试穿", category: "服装", daysBefore: 8, owner: "服装负责人" },
  { title: "完成第一次合成排练", category: "排练", daysBefore: 7, owner: "全体" },
  { title: "完成技术彩排", category: "现场", daysBefore: 3, owner: "技术负责人" },
  { title: "终检与应急包封装", category: "现场", daysBefore: 1, owner: "项目负责人" },
  { title: "正式演出", category: "演出", daysBefore: 0, owner: "全体" }
];

const MEMBER_TASKS: TaskSeed[] = [
  {
    title: "完成 2.5D 队形与舞台预演",
    category: "预演",
    daysBefore: 28,
    owner: "编导/教师",
    memberOnly: true,
    dependsOn: ["完成第一版整体方案"]
  },
  {
    title: "完成服装、灯光和背景联合校色",
    category: "视觉",
    daysBefore: 16,
    owner: "视觉负责人",
    memberOnly: true,
    dependsOn: ["样衣或样品确认", "背景、道具和音乐文件定稿"]
  },
  {
    title: "完成关键帧与走位冲突检查",
    category: "走位",
    daysBefore: 10,
    owner: "编导/教师",
    memberOnly: true,
    dependsOn: ["完成 2.5D 队形与舞台预演"]
  },
  {
    title: "完成遮挡与安全诊断",
    category: "安全",
    daysBefore: 6,
    owner: "安全负责人",
    memberOnly: true,
    dependsOn: ["完成第一次合成排练"]
  }
];

export function buildReverseSchedule(
  input: ProjectInput,
  tier: MembershipTier,
): ScheduleTask[] {
  const seeds = tier === "free" ? CORE_TASKS : [...CORE_TASKS, ...MEMBER_TASKS];
  const rehearsalBuffer =
    input.rehearsalFrequencyPerWeek < 3
      ? 5
      : input.performerCount > 60
        ? 3
        : 0;

  return seeds
    .map((task, index) => {
      const adjustedDays =
        task.category === "排练" || task.category === "走位"
          ? task.daysBefore + rehearsalBuffer
          : task.daysBefore;

      return {
        ...task,
        id: `schedule-${index + 1}`,
        daysBefore: adjustedDays,
        dueDate: due(input.performanceDate, adjustedDays),
        completed: false,
      };
    })
    .sort((a, b) => b.daysBefore - a.daysBefore);
}
