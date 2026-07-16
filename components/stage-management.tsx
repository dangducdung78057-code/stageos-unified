'use client'

import { useState } from 'react'
import { buildReverseSchedule, CATEGORY_COLORS } from '@/lib/reverse-schedule'
import type { MembershipTier, ProjectInput, ScheduleTask } from '@/lib/types'
import { Button } from '@/components/ui/button'

const DEFAULT_INPUT: ProjectInput = {
  name: '',
  performanceDate: '',
  performerCount: 30,
  rehearsalFrequencyPerWeek: 3,
  venue: '',
  budget: 0,
  notes: '',
}

function ProjectForm({
  onGenerate,
}: {
  onGenerate: (input: ProjectInput, tier: MembershipTier) => void
}) {
  const [input, setInput] = useState<ProjectInput>(DEFAULT_INPUT)
  const [tier, setTier] = useState<MembershipTier>('free')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.name || !input.performanceDate) return
    onGenerate(input, tier)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            项目名称 <span className="text-destructive">*</span>
          </label>
          <input
            required
            type="text"
            placeholder="例：2026 年春季汇演"
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            演出日期 <span className="text-destructive">*</span>
          </label>
          <input
            required
            type="date"
            value={input.performanceDate}
            onChange={(e) =>
              setInput({ ...input, performanceDate: e.target.value })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            演员人数
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={input.performerCount}
            onChange={(e) =>
              setInput({ ...input, performerCount: Number(e.target.value) })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            每周排练次数
          </label>
          <input
            type="number"
            min={1}
            max={7}
            value={input.rehearsalFrequencyPerWeek}
            onChange={(e) =>
              setInput({
                ...input,
                rehearsalFrequencyPerWeek: Number(e.target.value),
              })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            演出场地
          </label>
          <input
            type="text"
            placeholder="例：学校礼堂"
            value={input.venue}
            onChange={(e) => setInput({ ...input, venue: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            预算（元）
          </label>
          <input
            type="number"
            min={0}
            value={input.budget}
            onChange={(e) =>
              setInput({ ...input, budget: Number(e.target.value) })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          备注
        </label>
        <textarea
          rows={2}
          placeholder="节目特殊要求或其他说明…"
          value={input.notes}
          onChange={(e) => setInput({ ...input, notes: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          账号类型
        </label>
        <div className="flex gap-3">
          {(['free', 'member'] as MembershipTier[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                tier === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-foreground hover:bg-accent'
              }`}
            >
              {t === 'free' ? '免费版' : '会员版'}
            </button>
          ))}
        </div>
        {tier === 'member' && (
          <p className="mt-1 text-xs text-muted-foreground">
            会员版包含 2.5D 预演、遮挡安全诊断和高级甘特图等专属任务。
          </p>
        )}
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        生成倒排计划
      </Button>
    </form>
  )
}

function ScheduleView({
  tasks,
  projectName,
}: {
  tasks: ScheduleTask[]
  projectName: string
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const doneCount = completed.size
  const progress = Math.round((doneCount / tasks.length) * 100)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {projectName} — 倒排计划
        </h2>
        <span className="text-sm text-muted-foreground">
          {doneCount}/{tasks.length} 已完成
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                截止日期
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                任务
              </th>
              <th className="hidden px-4 py-2 text-left font-medium text-muted-foreground sm:table-cell">
                类别
              </th>
              <th className="hidden px-4 py-2 text-left font-medium text-muted-foreground sm:table-cell">
                负责人
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                状态
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const done = completed.has(task.id)
              return (
                <tr
                  key={task.id}
                  className={`transition-colors ${done ? 'bg-muted/30' : 'hover:bg-accent/30'}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {task.dueDate}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-medium ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                    >
                      {task.title}
                    </span>
                    {task.memberOnly && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                        会员
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[task.category] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {task.category}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {task.owner}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(task.id)}
                      aria-label={done ? '标记未完成' : '标记完成'}
                      className={`flex size-5 items-center justify-center rounded border transition-colors ${
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background hover:border-primary'
                      }`}
                    >
                      {done && (
                        <svg
                          viewBox="0 0 12 12"
                          className="size-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="1,6 4,10 11,2" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function StageManagement() {
  const [schedule, setSchedule] = useState<ScheduleTask[] | null>(null)
  const [projectName, setProjectName] = useState('')

  function handleGenerate(input: ProjectInput, tier: MembershipTier) {
    const tasks = buildReverseSchedule(input, tier)
    setSchedule(tasks)
    setProjectName(input.name)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <svg
            aria-hidden="true"
            className="size-7 shrink-0 text-primary"
            fill="none"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path
              d="M14.2 14.2H17V6.9375C17 4.76288 15.2371 3 13.0625 3H5.8V5.8M14.2 14.2V7.79063L7.79062 14.2H14.2ZM14.2 14.2V17H6.9375C4.76288 17 3 15.2371 3 13.0625V5.8H5.8M5.8 5.8V12.2313L12.2313 5.8H5.8Z"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <h1 className="text-lg font-bold leading-tight text-foreground">
              StageOS
            </h1>
            <p className="text-xs text-muted-foreground">艺演管理助手</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-foreground">
            新建演出项目
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            填写演出基本信息，自动生成完整的倒排计划。
          </p>
          <ProjectForm onGenerate={handleGenerate} />
        </div>

        {schedule && (
          <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
            <ScheduleView tasks={schedule} projectName={projectName} />
          </div>
        )}
      </main>
    </div>
  )
}
