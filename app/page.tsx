'use client'

import { useState } from 'react'
import type { StagePlan, StagePlanInput } from '@/lib/stage-types'
import { PlanForm } from '@/components/plan-form'
import { PlanResult } from '@/components/plan-result'
import { SAMPLE_PLAN } from '@/lib/sample-plan'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  Drama,
  Layers,
  Palette,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  Users,
} from 'lucide-react'

const PILLARS = [
  { icon: Layers, label: '稳定队形结构' },
  { icon: Palette, label: '色彩工程配色' },
  { icon: Drama, label: '光影意境表达' },
  { icon: ShieldCheck, label: '低风险可落地' },
]

const WORKFLOW = [
  {
    icon: ClipboardList,
    title: '描述节目',
    desc: '填写人数、环境、年龄与主题，明确目标层级与可用道具。',
  },
  {
    icon: Sparkles,
    title: '智能生成',
    desc: '系统结合分层评估模型，输出适配的队形结构与配色工程。',
  },
  {
    icon: Users,
    title: '可视化预览',
    desc: '队形点阵与配色块实时呈现，正面、俯视双视角都心中有数。',
  },
  {
    icon: ShieldCheck,
    title: '落地排练',
    desc: '给出服装、灯光、排练重点与避坑提示，直接指导执行。',
  },
]

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<StagePlan | null>(null)
  const [count, setCount] = useState(24)
  const [male, setMale] = useState<number | undefined>(undefined)
  const [female, setFemale] = useState<number | undefined>(undefined)

  async function handleGenerate(input: StagePlanInput) {
    setLoading(true)
    setPlan(null)
    setCount(input.peopleCount)
    setMale(input.maleCount)
    setFemale(input.femaleCount)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('生成失败')
      const data = (await res.json()) as StagePlan
      setPlan(data)
      setTimeout(
        () =>
          document
            .getElementById('result')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        100,
      )
    } catch {
      toast.error('方案生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh stage-spotlight">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-lg font-bold tracking-wide">
                艺演助手
              </span>
              <span className="text-xs tracking-[0.2em] text-muted-foreground">
                STAGEOS
              </span>
            </div>
          </div>
          <span className="hidden font-serif text-sm tracking-wide text-muted-foreground sm:block">
            群体舞台视觉结构设计系统
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-10">
        <div className="overflow-hidden rounded-3xl border border-[var(--gold)]/30 jade-panel">
          <div className="relative">
            <img
              src="/hero-stage.jpg"
              alt="国风与芭蕾融合的舞台主视觉：水彩晕染的舞台、琵琶古筝、足尖鞋与舞者"
              className="aspect-[1382/768] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.99_0.01_95)] via-transparent to-transparent" />
          </div>
          <div className="px-6 pb-8 pt-2 text-center md:px-12">
            <p className="mb-4 inline-block rounded-full border border-[var(--gold)]/40 bg-accent/15 px-3.5 py-1 text-xs tracking-wide text-accent-foreground">
              面向群众型表演 · 市级 / 半专业团队
            </p>
            <h1 className="text-balance font-serif text-3xl font-bold leading-tight tracking-wide text-foreground md:text-5xl">
              让每位孩子的舞台，
              <br className="hidden sm:block" />
              都被认真对待
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              输入环境、人数与主题，艺演助手自动生成配色、队形、服装与避坑方案——
              用结构、色彩与光影，让低门槛团队也能做出高完成度的舞台。
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {PILLARS.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-card/70 px-3.5 py-1.5 text-sm text-secondary-foreground"
                >
                  <p.icon className="size-4 text-primary" aria-hidden />
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 主体：表单 + 结果 */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-3 font-serif text-base font-semibold tracking-wide text-secondary-foreground">
            <span className="text-[var(--gold)]">壹 ·</span> 描述你的节目
          </h2>
          <PlanForm onGenerate={handleGenerate} loading={loading} />
        </div>

        <div id="result" className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-serif text-base font-semibold tracking-wide text-secondary-foreground">
              <span className="text-[var(--gold)]">贰 ·</span> 生成的舞台方案
            </h2>
            {!loading && !plan && (
              <Badge
                variant="outline"
                className="border-[var(--gold)]/50 text-accent-foreground"
              >
                示例预览
              </Badge>
            )}
          </div>
          {loading ? (
            <LoadingState />
          ) : plan ? (
            <PlanResult
              plan={plan}
              peopleCount={count}
              maleCount={male}
              femaleCount={female}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-dashed border-border/70 bg-card/30 p-4 text-pretty text-sm leading-relaxed text-muted-foreground">
                下方是一份示例方案，帮助你了解输出效果。在左侧填写节目信息并点击「生成舞台视觉方案」，即可得到专属于你节目的队形、配色与避坑建议。
              </div>
              <PlanResult
                plan={SAMPLE_PLAN}
                peopleCount={36}
                maleCount={15}
                femaleCount={21}
              />
            </div>
          )}
        </div>
      </section>

      {/* 工作流程 / 模块占位 */}
      <section className="border-t border-[var(--gold)]/25 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mx-auto mb-3 h-px w-40 gold-rule" />
          <h2 className="text-balance text-center font-serif text-2xl font-bold tracking-wide md:text-3xl">
            一套流程，覆盖从构思到排练
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-center leading-relaxed text-muted-foreground">
            艺演助手把舞台视觉设计拆解为四个可落地的环节，让没有专业编导的团队也能稳定产出。
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((w, i) => (
              <div
                key={w.title}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--gold)]/25 jade-panel p-6 text-center"
              >
                <span className="flex size-14 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-primary/10 text-primary">
                  <w.icon className="size-6" aria-hidden />
                </span>
                <span className="font-serif text-sm text-[var(--gold)]">
                  其 0{i + 1}
                </span>
                <h3 className="font-serif text-lg font-semibold">{w.title}</h3>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--gold)]/25">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-10 text-center">
          <div className="flex items-center gap-2 font-serif text-base font-semibold tracking-wide">
            <Drama className="size-4 text-primary" aria-hidden />
            艺演助手 · StageOS
          </div>
          <p className="text-sm text-muted-foreground">
            让每位孩子的舞台，都被认真对待
          </p>
        </div>
      </footer>
    </main>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="aspect-[100/64] w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    </div>
  )
}
