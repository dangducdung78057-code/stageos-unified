"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, AlertTriangle, Check, Plus, Trash2, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PROGRAM_TYPES,
  REHEARSAL_FREQUENCIES,
  SCHOOL_STAGES,
  validateStageInputDetailed,
  type StageInputData,
} from "@/lib/stageos"
import { createProjectFromWizard } from "@/app/actions/projects"

const DRAFT_KEY = "stageos:wizard:draft:next:v1"

type Student = NonNullable<StageInputData["students"]>[number]

const STEPS = [
  { key: "basic", title: "基础信息", hint: "项目标题、学段、节目类型与日程" },
  { key: "counts", title: "人数与预算", hint: "总人数 / 男女构成 / 人均预算" },
  { key: "visual", title: "视觉与期待", hint: "主题色、灯光风格与特殊期待" },
  { key: "roster", title: "学生名录", hint: "匿名 studentId，不采集真实姓名（可选）" },
  { key: "review", title: "校验与生成", hint: "确认信息 → 保存并生成本地规则方案" },
] as const

export function ProjectWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState("")
  const [data, setData] = useState<StageInputData>({ rehearsalFrequencyPerWeek: 3 })
  const [hydrated, setHydrated] = useState(false)
  const [pending, startTransition] = useTransition()
  const autosaveRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        setStep(d.step ?? 0)
        setTitle(d.title ?? "")
        setData(d.data ?? { rehearsalFrequencyPerWeek: 3 })
        toast.success("已恢复上次编辑的草稿")
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (autosaveRef.current) window.clearTimeout(autosaveRef.current)
    autosaveRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, title, data, savedAt: new Date().toISOString() }))
      } catch {
        /* quota */
      }
    }, 600)
    return () => {
      if (autosaveRef.current) window.clearTimeout(autosaveRef.current)
    }
  }, [hydrated, step, title, data])

  const set = <K extends keyof StageInputData>(k: K, v: StageInputData[K]) => setData((d) => ({ ...d, [k]: v }))

  const validation = useMemo(() => validateStageInputDetailed(data), [data])

  const stepBlockers = useMemo(() => {
    const blockers: string[] = []
    if (step === 0) {
      if (!title.trim()) blockers.push("请填写项目标题")
      if (!data.programType) blockers.push("请选择节目类型")
    }
    if (step === 1) {
      if (!data.performerCount || data.performerCount <= 0) blockers.push("请填写有效的总人数")
      blockers.push(...validation.errors.filter((e) => e.includes("人数") || e.includes("预算")))
    }
    if (step === 4) blockers.push(...validation.errors)
    return [...new Set(blockers)]
  }, [step, title, data, validation])

  const students = data.students ?? []

  const addStudent = () => {
    const next: Student = { studentId: `S${String(students.length + 1).padStart(3, "0")}`, gender: "female", heightCm: 150 }
    set("students", [...students, next])
  }
  const updateStudent = (i: number, patch: Partial<Student>) => {
    set(
      "students",
      students.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    )
  }
  const removeStudent = (i: number) => {
    set(
      "students",
      students.filter((_, idx) => idx !== i),
    )
  }

  const goNext = () => {
    if (stepBlockers.length > 0) {
      toast.error(stepBlockers[0])
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const submit = () => {
    if (!title.trim()) {
      toast.error("请填写项目标题")
      return
    }
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0])
      return
    }
    startTransition(async () => {
      try {
        const id = await createProjectFromWizard(title, data)
        localStorage.removeItem(DRAFT_KEY)
        toast.success("项目已创建，本地规则方案已生成")
        router.push(`/projects/${id}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "创建失败")
      }
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">新建项目 · 向导</h1>
        <p className="text-sm text-muted-foreground">草稿自动保存在本机，创建后生成确定性本地规则方案。</p>
      </div>

      <nav aria-label="向导步骤" className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-xs ${
              i === step
                ? "border-primary bg-primary/10 text-primary"
                : i < step
                  ? "border-border text-foreground"
                  : "border-border text-muted-foreground"
            }`}
          >
            {i < step ? <Check className="size-3" /> : <span className="font-mono">{i + 1}</span>}
            {s.title}
          </button>
        ))}
      </nav>

      <div className="panel space-y-4 p-4 md:p-5">
        <p className="eyebrow">{STEPS[step].hint}</p>

        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="w-title">项目标题 *</Label>
              <Input id="w-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：2026 春季合唱汇演" />
            </div>
            <div className="space-y-1.5">
              <Label>学段</Label>
              <Select value={data.schoolStage ?? ""} onValueChange={(v) => set("schoolStage", v ?? undefined)}>
                <SelectTrigger><SelectValue placeholder="选择学段" /></SelectTrigger>
                <SelectContent>
                  {SCHOOL_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>节目类型 *</Label>
              <Select value={data.programType ?? ""} onValueChange={(v) => set("programType", v ?? undefined)}>
                <SelectTrigger><SelectValue placeholder="选择节目类型" /></SelectTrigger>
                <SelectContent>
                  {PROGRAM_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-theme">节目主题</Label>
              <Input id="w-theme" value={data.programTheme ?? ""} onChange={(e) => set("programTheme", e.target.value)} placeholder="例：星辰大海" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-date">演出日期</Label>
              <Input id="w-date" type="date" value={data.performanceDate ?? ""} onChange={(e) => set("performanceDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>每周彩排频次</Label>
              <Select
                value={String(data.rehearsalFrequencyPerWeek ?? 3)}
                onValueChange={(v) => set("rehearsalFrequencyPerWeek", Number(v) as 2 | 3 | 5)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REHEARSAL_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={String(f)}>{`每周 ${f} 次`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-venue">场地类型</Label>
              <Input id="w-venue" value={data.venueType ?? ""} onChange={(e) => set("venueType", e.target.value)} placeholder="例：室内舞台 / 操场" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="w-count">总人数 *</Label>
              <Input id="w-count" type="number" min={1} value={data.performerCount ?? ""} onChange={(e) => set("performerCount", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-budget">人均预算（元）</Label>
              <Input id="w-budget" type="number" min={0} value={data.perPersonBudget ?? ""} onChange={(e) => set("perPersonBudget", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-male">男生人数</Label>
              <Input id="w-male" type="number" min={0} value={data.maleCount ?? ""} onChange={(e) => set("maleCount", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-female">女生人数</Label>
              <Input id="w-female" type="number" min={0} value={data.femaleCount ?? ""} onChange={(e) => set("femaleCount", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="w-color">屏幕主题色</Label>
              <Input id="w-color" value={data.screenThemeColor ?? ""} onChange={(e) => set("screenThemeColor", e.target.value)} placeholder="例：绯红 / #C0392B" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-light">灯光风格</Label>
              <Input id="w-light" value={data.lightingStyle ?? ""} onChange={(e) => set("lightingStyle", e.target.value)} placeholder="例：暖色正面光 + 轮廓光" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="w-expect">特殊期待</Label>
              <Textarea id="w-expect" rows={4} value={data.specialExpectation ?? ""} onChange={(e) => set("specialExpectation", e.target.value)} placeholder="对服装、配色、造型的特殊要求…" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                匿名 studentId + 性别 + 身高，用于尺码分档。当前 {students.length} 行。
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addStudent}>
                <Plus className="mr-1 size-3.5" />
                添加学生
              </Button>
            </div>
            {students.length === 0 && (
              <p className="border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                名录为可选项。跳过此步不影响方案生成。
              </p>
            )}
            {students.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2 border-b pb-2 last:border-0">
                <div className="space-y-1">
                  <Label htmlFor={`sid-${i}`} className="text-xs">studentId</Label>
                  <Input id={`sid-${i}`} value={s.studentId} onChange={(e) => updateStudent(i, { studentId: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">性别</Label>
                  <Select value={s.gender} onValueChange={(v) => updateStudent(i, { gender: v as "male" | "female" })}>
                    <SelectTrigger className="h-8 w-20 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">女</SelectItem>
                      <SelectItem value="male">男</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`sh-${i}`} className="text-xs">身高 cm</Label>
                  <Input id={`sh-${i}`} type="number" value={s.heightCm} onChange={(e) => updateStudent(i, { heightCm: Number(e.target.value) })} className="h-8 w-24 text-sm" />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeStudent(i)} aria-label="删除该行">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-3">
              <div><dt className="text-xs text-muted-foreground">标题</dt><dd className="font-medium">{title || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">节目类型</dt><dd>{PROGRAM_TYPES.find((p) => p.value === data.programType)?.label ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">演出日期</dt><dd className="font-mono">{data.performanceDate ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">总人数</dt><dd className="font-mono">{data.performerCount ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">男 / 女</dt><dd className="font-mono">{data.maleCount ?? "—"} / {data.femaleCount ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">人均预算</dt><dd className="font-mono">{data.perPersonBudget != null ? `¥${data.perPersonBudget}` : "—"}</dd></div>
            </dl>
            {validation.errors.length > 0 && (
              <div className="space-y-1 border border-destructive/40 bg-destructive/10 p-3">
                {validation.errors.map((e, i) => (
                  <p key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                    {e}
                  </p>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="space-y-1 border border-warning/40 bg-warning/10 p-3">
                {validation.warnings.map((w, i) => (
                  <p key={i} className="flex items-start gap-1.5 text-xs text-warning">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                    {w}
                  </p>
                ))}
              </div>
            )}
            {validation.errors.length === 0 && validation.warnings.length === 0 && (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <Check className="size-4" />
                校验通过，可以生成方案。
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="mr-1 size-4" />
          上一步
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" size="sm" onClick={goNext}>
            下一步
            <ArrowRight className="ml-1 size-4" />
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={submit} disabled={pending || validation.errors.length > 0}>
            <Wand2 className="mr-1 size-4" />
            {pending ? "生成中…" : "创建并生成方案"}
          </Button>
        )}
      </div>
    </div>
  )
}
