"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, Box, Check, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge, ToneBadge } from "@/components/status-badge"
import { PROGRAM_TYPES } from "@/lib/stageos"
import { regeneratePlan, updateConfirmation } from "@/app/actions/projects"

type PlanItem = { category: string; description: string; qty: number; unitEstimate: number; subtotal: number; sizing?: string }
type Risk = { level: "low" | "medium" | "high"; title: string; detail: string }
type ScheduleItem = { daysBefore: number; task: string; owner: string; date?: string }
type SearchItem = { platform: string; query: string; url: string; note: string }

type Snapshot = {
  id: string
  version: number
  mode: string
  costumePlan: Record<string, unknown>
  risks: unknown[]
  reverseSchedule: unknown[]
  platformSearch: unknown[]
  providerStatus: string
  createdAt: string
}

export function ProjectDetailView({
  project,
  stageInput,
  snapshots,
  confirmation,
}: {
  project: {
    id: string
    title: string
    status: string
    performanceDate: string | null
    performerCount: number | null
    programType: string | null
    theme: string | null
  }
  stageInput: Record<string, unknown> | null
  snapshots: Snapshot[]
  confirmation: { status: string; note: string | null } | null
}) {
  const [activeVersion, setActiveVersion] = useState(snapshots[0]?.version ?? 0)
  const [pending, startTransition] = useTransition()
  const snapshot = snapshots.find((s) => s.version === activeVersion) ?? snapshots[0]

  const plan = snapshot?.costumePlan as
    | {
        femalePlan?: PlanItem[]
        malePlan?: PlanItem[]
        accessories?: PlanItem[]
        totalEstimate?: number
        sizingReminders?: string[]
        purchaseStrategy?: string[]
        planB?: string[]
        visualPlan?: {
          palette?: { name: string; hex: string; role?: string }[]
          formation?: { name: string; summary: string; rows: number; spacingRule: string; tips?: string[] }
          stage?: { venueType: string; screenThemeColor: string; lightingStyle: string; backgroundGuidance: string }
          props?: { strategy: string; guidance: string[] }
        }
        constraints?: { ruleId: string; level: string; scope: string; reason: string; alternative?: string }[]
      }
    | undefined

  const risks = (snapshot?.risks ?? []) as Risk[]
  const schedule = (snapshot?.reverseSchedule ?? []) as ScheduleItem[]
  const searches = (snapshot?.platformSearch ?? []) as SearchItem[]

  const onRegenerate = () => {
    startTransition(async () => {
      try {
        await regeneratePlan(project.id)
        toast.success("已生成新版本方案")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "生成失败")
      }
    })
  }

  const onConfirm = (status: string) => {
    startTransition(async () => {
      await updateConfirmation(project.id, status)
      toast.success(status === "confirmed" ? "方案已确认" : "已标记为待修订")
    })
  }

  const programLabel = PROGRAM_TYPES.find((p) => p.value === project.programType)?.label ?? project.programType ?? "—"

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/projects" aria-label="返回项目列表">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <p className="eyebrow">PROJECT DETAIL</p>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-medium">
              {project.title}
              <StatusBadge status={project.status} />
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={pending || !stageInput}>
            <RefreshCw className="mr-1 size-3.5" />
            重新生成方案
          </Button>
          {confirmation?.status !== "confirmed" ? (
            <Button size="sm" onClick={() => onConfirm("confirmed")} disabled={pending || !snapshot}>
              <Check className="mr-1 size-3.5" />
              确认方案
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onConfirm("needs_revision")} disabled={pending}>
              标记待修订
            </Button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["演出日期", project.performanceDate ?? "—"],
          ["人数", project.performerCount != null ? String(project.performerCount) : "—"],
          ["节目类型", programLabel],
          ["主题", project.theme ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="panel p-3">
            <dt className="eyebrow">{k}</dt>
            <dd className="metric mt-1 text-sm">{v}</dd>
          </div>
        ))}
      </dl>

      {!snapshot && (
        <p className="panel p-8 text-center text-sm text-muted-foreground">
          尚未生成方案。完善舞台输入后点击「重新生成方案」。
        </p>
      )}

      {snapshot && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">方案版本</span>
            {snapshots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveVersion(s.version)}
                className={`border px-2 py-1 font-mono text-xs ${
                  s.version === snapshot.version ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                v{s.version}
              </button>
            ))}
            <span className="font-mono text-[10px] text-muted-foreground">
              {new Date(snapshot.createdAt).toLocaleString("zh-CN", { hour12: false })} · {snapshot.providerStatus}
            </span>
          </div>

          <Tabs defaultValue="costume">
            <TabsList>
              <TabsTrigger value="costume">服装总表</TabsTrigger>
              <TabsTrigger value="visual">视觉与队形</TabsTrigger>
              <TabsTrigger value="risks">风险与约束</TabsTrigger>
              <TabsTrigger value="schedule">倒排计划</TabsTrigger>
              <TabsTrigger value="search">平台搜索</TabsTrigger>
            </TabsList>

            <TabsContent value="costume" className="space-y-4">
              {(["femalePlan", "malePlan", "accessories"] as const).map((key) => {
                const items = plan?.[key] ?? []
                if (items.length === 0) return null
                const label = key === "femalePlan" ? "女生方案" : key === "malePlan" ? "男生方案" : "配饰与备件"
                return (
                  <div key={key} className="panel">
                    <p className="border-b px-4 py-2.5 text-sm font-medium">{label}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="px-4 py-2 font-medium">类目</th>
                            <th className="px-4 py-2 font-medium">说明</th>
                            <th className="px-4 py-2 text-right font-medium">数量</th>
                            <th className="px-4 py-2 text-right font-medium">单价</th>
                            <th className="px-4 py-2 text-right font-medium">小计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="px-4 py-2.5 whitespace-nowrap">{it.category}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {it.description}
                                {it.sizing && <span className="ml-1 text-xs">（{it.sizing}）</span>}
                              </td>
                              <td className="metric px-4 py-2.5 text-right">{it.qty}</td>
                              <td className="metric px-4 py-2.5 text-right">¥{it.unitEstimate}</td>
                              <td className="metric px-4 py-2.5 text-right">¥{it.subtotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
              <div className="flex flex-wrap items-center justify-between gap-2 border border-primary/40 bg-primary/5 px-4 py-3">
                <span className="text-sm font-medium">预算总估算</span>
                <span className="metric text-lg text-primary">¥{plan?.totalEstimate ?? 0}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["尺码提醒", plan?.sizingReminders ?? []],
                  ["采购策略", plan?.purchaseStrategy ?? []],
                  ["Plan B", plan?.planB ?? []],
                ].map(([label, list]) => (
                  <div key={label as string} className="panel p-4">
                    <p className="eyebrow">{label as string}</p>
                    <ul className="mt-2 space-y-1.5">
                      {(list as string[]).map((t, i) => (
                        <li key={i} className="text-xs leading-relaxed text-muted-foreground">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="visual" className="space-y-4">
              {plan?.visualPlan?.palette && plan.visualPlan.palette.length > 0 && (
                <div className="panel p-4">
                  <p className="eyebrow">配色方案</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {plan.visualPlan.palette.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="size-6 border" style={{ backgroundColor: c.hex }} aria-hidden />
                        <div>
                          <p className="text-xs font-medium">{c.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {c.hex}
                            {c.role ? ` · ${c.role}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {plan?.visualPlan?.formation && (
                <div className="panel p-4">
                  <p className="eyebrow">推荐队形</p>
                  <p className="mt-2 text-sm font-medium">
                    {plan.visualPlan.formation.name}
                    <span className="metric ml-2 text-xs text-muted-foreground">{plan.visualPlan.formation.rows} 排</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.visualPlan.formation.summary}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{plan.visualPlan.formation.spacingRule}</p>
                  <div className="mt-3">
                    <Link href={`/formation-3d?projectId=${project.id}&count=${project.performerCount ?? 24}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Box className="size-3.5" />
                      在编队中预览与保存
                    </Link>
                  </div>
                </div>
              )}
              {plan?.visualPlan?.stage && (
                <div className="panel p-4">
                  <p className="eyebrow">舞台与灯光</p>
                  <dl className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                    <div><dt className="text-muted-foreground">场地</dt><dd>{plan.visualPlan.stage.venueType}</dd></div>
                    <div><dt className="text-muted-foreground">屏幕主题色</dt><dd className="font-mono">{plan.visualPlan.stage.screenThemeColor}</dd></div>
                    <div><dt className="text-muted-foreground">灯光风格</dt><dd>{plan.visualPlan.stage.lightingStyle}</dd></div>
                    <div><dt className="text-muted-foreground">背景建议</dt><dd className="text-muted-foreground">{plan.visualPlan.stage.backgroundGuidance}</dd></div>
                  </dl>
                </div>
              )}
              {plan?.visualPlan?.props && (
                <div className="panel p-4">
                  <p className="eyebrow">道具策略 · {plan.visualPlan.props.strategy === "minimal" ? "从简" : "重点道具"}</p>
                  <ul className="mt-2 space-y-1">
                    {plan.visualPlan.props.guidance.map((g, i) => (
                      <li key={i} className="text-xs text-muted-foreground">{g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {risks.map((r, i) => (
                  <div key={i} className="panel flex items-start gap-3 p-4">
                    <ShieldAlert
                      className={`mt-0.5 size-4 shrink-0 ${
                        r.level === "high" ? "text-destructive" : r.level === "medium" ? "text-warning" : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {r.title}
                        <ToneBadge tone={r.level === "high" ? "destructive" : r.level === "medium" ? "warning" : "muted"}>
                          {r.level === "high" ? "高" : r.level === "medium" ? "中" : "低"}
                        </ToneBadge>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              {plan?.constraints && plan.constraints.length > 0 && (
                <div className="panel">
                  <p className="border-b px-4 py-2.5 text-sm font-medium">反向约束命中（{plan.constraints.length}）</p>
                  <ul className="divide-y">
                    {plan.constraints.map((c, i) => (
                      <li key={i} className="space-y-1 px-4 py-3">
                        <p className="flex items-center gap-2 text-xs">
                          <ToneBadge tone={c.level === "hard_block" ? "destructive" : c.level === "soft_warn" ? "warning" : "muted"}>
                            {c.level === "hard_block" ? "硬性" : c.level === "soft_warn" ? "软性" : "提示"}
                          </ToneBadge>
                          <span className="font-mono text-[10px] text-muted-foreground">{c.ruleId} · {c.scope}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{c.reason}</p>
                        {c.alternative && <p className="text-xs text-primary">替代：{c.alternative}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule">
              <div className="panel overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-medium">提前天数</th>
                      <th className="px-4 py-2 font-medium">日期</th>
                      <th className="px-4 py-2 font-medium">任务</th>
                      <th className="px-4 py-2 font-medium">负责人</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((s, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="metric px-4 py-2.5">D-{s.daysBefore}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{s.date ?? "—"}</td>
                        <td className="px-4 py-2.5">{s.task}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{s.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-3">
              {searches.map((s, i) => (
                <div key={i} className="panel flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="text-sm font-medium">{s.platform}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{s.query}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{s.note}</p>
                  </div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    打开搜索
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
