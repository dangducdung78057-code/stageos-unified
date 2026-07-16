export type MembershipTier = 'free' | 'member' | 'custom'

export interface Position {
  x: number
  z: number
  riserLevel?: number
}

export interface Appearance {
  upperColor: string
  lowerColor: string
  footwearColor: string
}

export interface Performer {
  id: string
  heightCm: number
  gender: 'male' | 'female'
  role: string
  group: string
  position: Position
  appearance: Appearance
}

export interface ProjectInput {
  name: string
  performanceDate: string
  performerCount: number
  rehearsalFrequencyPerWeek: number
  venue: string
  budget: number
  notes?: string
}

export type ScheduleCategory =
  | '策划'
  | '方案'
  | '队形'
  | '服装'
  | '采购'
  | '舞台'
  | '排练'
  | '现场'
  | '演出'
  | '预演'
  | '视觉'
  | '走位'
  | '安全'

export interface ScheduleTask {
  id: string
  title: string
  category: ScheduleCategory
  daysBefore: number
  dueDate: string
  owner: string
  completed: boolean
  memberOnly?: boolean
  dependsOn?: string[]
}

export interface StagePlan {
  id: string
  projectId: string
  version: number
  createdAt: string
  schedule: ScheduleTask[]
  performers: Performer[]
}

export interface Project {
  id: string
  input: ProjectInput
  tier: MembershipTier
  createdAt: string
  plan?: StagePlan
}
