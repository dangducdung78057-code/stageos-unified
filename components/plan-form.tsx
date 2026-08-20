'use client'

import { useState } from 'react'
import {
  ENVIRONMENTS,
  AGE_GROUPS,
  THEMES,
  LEVELS,
  PROPS,
  buildTimeline,
  type StagePlanInput,
} from '@/lib/stage-types'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Loader2,
  Mars,
  Venus,
  Users,
  CalendarClock,
  ListOrdered,
  Upload,
  ImagePlus,
  Lock,
} from 'lucide-react'

interface Props {
  onGenerate: (input: StagePlanInput) => void
  loading: boolean
}

function defaultPerformDate() {
  const d = new Date()
  d.setDate(d.getDate() + 45)
  return d.toISOString().slice(0, 10)
}

export function PlanForm({ onGenerate, loading }: Props) {
  const [performDate, setPerformDate] = useState<string>(defaultPerformDate())
  const [maleCount, setMaleCount] = useState<string>('10')
  const [femaleCount, setFemaleCount] = useState<string>('14')
  const [expectation, setExpectation] = useState<string>('')
  const [touched, setTouched] = useState(false)
  const [environment, setEnvironment] = useState<string>(ENVIRONMENTS[0].value)
  const [ageGroup, setAgeGroup] = useState<string>(AGE_GROUPS[0].value)
  const [theme, setTheme] = useState<string>(THEMES[0].value)
  const [targetLevel, setTargetLevel] = useState<string>(LEVELS[2].value)
  const [props, setProps] = useState<string[]>(['screen_panels'])

  const male = Number.parseInt(maleCount, 10)
  const female = Number.parseInt(femaleCount, 10)
  const maleValid = Number.isFinite(male) && male >= 0
  const femaleValid = Number.isFinite(female) && female >= 0
  const total = (maleValid ? male : 0) + (femaleValid ? female : 0)
  const countError = !maleValid || !femaleValid
  const totalError = !countError && (total < 4 || total > 80)
  const dateValid = !!performDate && !Number.isNaN(new Date(performDate).getTime())
  const dateError = !dateValid
  const formInvalid = countError || totalError || dateError

  const timeline = dateValid ? buildTimeline(performDate) : []

  function toggleProp(v: string) {
    setProps((prev) =>
      prev.includes(v) ? prev.filter((p) => p !== v) : [...prev, v],
    )
  }

  function handleSubmit() {
    setTouched(true)
    if (formInvalid) return
    onGenerate({
      performDate,
      peopleCount: total,
      maleCount: male,
      femaleCount: female,
      environment,
      ageGroup,
      theme,
      targetLevel,
      expectation: expectation.trim(),
      props,
    })
  }

  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="flex flex-col gap-7 p-5 md:p-6">
        {/* 演出时间（必填） */}
        <Field label="演出时间" required>
          <div className="relative">
            <CalendarClock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
            <Input
              type="date"
              value={performDate}
              onChange={(e) => setPerformDate(e.target.value)}
              className={`pl-9 ${touched && dateError ? 'border-destructive' : ''}`}
              aria-label="演出时间"
            />
          </div>
          {touched && dateError && (
            <p className="text-xs text-destructive">请选择有效的演出日期。</p>
          )}
        </Field>

        {/* 男女人数（必填） */}
        <Field
          label="男女人数"
          required
          hint={!formInvalid ? `共 ${total} 人` : undefined}
        >
          <div className="grid grid-cols-2 gap-3">
            <GenderInput
              icon={Mars}
              label="男生"
              tone="text-[oklch(0.55_0.1_235)]"
              value={maleCount}
              onChange={setMaleCount}
              invalid={touched && !maleValid}
            />
            <GenderInput
              icon={Venus}
              label="女生"
              tone="text-[oklch(0.6_0.12_5)]"
              value={femaleCount}
              onChange={setFemaleCount}
              invalid={touched && !femaleValid}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" aria-hidden />
            合计 {total} 人 · 适配区间 4–80 人
          </div>
          {touched && countError && (
            <p className="text-xs text-destructive">
              请填写有效的男生与女生人数（不能为空，且不小于 0）。
            </p>
          )}
          {touched && totalError && (
            <p className="text-xs text-destructive">
              总人数需在 4–80 人之间，当前为 {total} 人。
            </p>
          )}
        </Field>

        {/* 环境 */}
        <Field label="演出环境">
          <div className="grid grid-cols-2 gap-2">
            {ENVIRONMENTS.map((e) => (
              <OptionTile
                key={e.value}
                active={environment === e.value}
                onClick={() => setEnvironment(e.value)}
                title={e.label}
                desc={e.desc}
              />
            ))}
          </div>
        </Field>

        {/* 团队类型 */}
        <Field label="团队年龄 / 类型">
          <ChipGroup
            options={AGE_GROUPS}
            value={ageGroup}
            onChange={setAgeGroup}
          />
        </Field>

        {/* 主题 */}
        <Field label="主题方向">
          <ChipGroup options={THEMES} value={theme} onChange={setTheme} />
        </Field>

        {/* 目标层级 */}
        <Field label="目标层级">
          <div className="flex flex-col gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setTargetLevel(l.value)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  targetLevel === l.value
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/40'
                }`}
              >
                <span className="font-medium">{l.label}</span>
                <span className="text-xs text-muted-foreground">{l.hint}</span>
              </button>
            ))}
          </div>
        </Field>

        {/* 道具 */}
        <Field label="可用道具（可多选）">
          <div className="flex flex-wrap gap-2">
            {PROPS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => toggleProp(p.value)}
              >
                <Badge
                  variant={props.includes(p.value) ? 'default' : 'outline'}
                  className={`cursor-pointer px-3 py-1 text-sm ${
                    props.includes(p.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {p.label}
                </Badge>
              </button>
            ))}
          </div>
        </Field>

        {/* 期待描述 */}
        <Field label="期待描述">
          <Textarea
            value={expectation}
            onChange={(e) => setExpectation(e.target.value)}
            placeholder="例如：希望开场有气势、中段温暖叙事、结尾全员定点造型，整体偏国风雅致……"
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            一句话描述想要的舞台感觉，帮助系统更贴合你的预期。
          </p>
        </Field>

        {/* 倒排计划 */}
        <Field label="倒排计划" hint={timeline.length ? `${timeline.length} 个节点` : undefined}>
          {timeline.length ? (
            <ol className="relative flex flex-col gap-3 border-l border-[var(--gold)]/40 pl-4">
              {timeline.map((m, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[1.4rem] top-1 size-2.5 rounded-full border ${
                      i === timeline.length - 1
                        ? 'border-accent bg-accent'
                        : 'border-primary bg-card'
                    }`}
                    aria-hidden
                  />
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {m.title}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-primary">
                      {m.date}
                      <span className="ml-1 text-muted-foreground">
                        {m.weekLabel}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {m.desc}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-lg border border-dashed border-border/70 bg-secondary/30 p-3 text-xs text-muted-foreground">
              选择演出时间后，将自动按里程碑倒排出排练计划。
            </p>
          )}
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ListOrdered className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            以演出日为终点自动倒推；生成方案后可进一步细化每个节点。
          </div>
        </Field>

        {/* 占位：导入名单 / 上传实景图 */}
        <Field label="进阶资料（即将上线）">
          <div className="grid gap-2 sm:grid-cols-2">
            <PlaceholderUpload
              icon={Upload}
              title="导入名单"
              desc="批量导入演员名单与分组"
            />
            <PlaceholderUpload
              icon={ImagePlus}
              title="上传实景图"
              desc="上传场地照片预览实景效果"
            />
          </div>
        </Field>

        <Button
          size="lg"
          className="mt-1 w-full gap-2 text-base"
          disabled={loading || (touched && formInvalid)}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              正在编排舞台…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              生成舞台视觉方案
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">
          {label}
          {required && (
            <span className="ml-1 text-destructive" aria-hidden>
              *
            </span>
          )}
        </Label>
        {hint && (
          <span className="font-mono text-sm text-primary">{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function GenderInput({
  icon: Icon,
  label,
  tone,
  value,
  onChange,
  invalid,
}: {
  icon: React.ElementType
  label: string
  tone: string
  value: string
  onChange: (v: string) => void
  invalid: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Icon
          className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${tone}`}
          aria-hidden
        />
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pl-9 ${invalid ? 'border-destructive' : ''}`}
          aria-label={`${label}人数`}
        />
      </div>
      <span className="text-xs text-muted-foreground">{label}人数</span>
    </div>
  )
}

function PlaceholderUpload({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div
      aria-disabled
      title="即将上线"
      className="flex cursor-not-allowed flex-col gap-1 rounded-lg border border-dashed border-border/70 bg-secondary/20 p-3 opacity-70"
    >
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        {title}
        <Lock className="ml-auto size-3" aria-hidden />
      </div>
      <span className="text-xs leading-relaxed text-muted-foreground">
        {desc}
      </span>
    </div>
  )
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            value === o.value
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/40'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function OptionTile({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${
        active
          ? 'border-primary bg-primary/10'
          : 'border-border bg-secondary/40 hover:border-primary/40'
      }`}
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">
        {desc}
      </span>
    </button>
  )
}
