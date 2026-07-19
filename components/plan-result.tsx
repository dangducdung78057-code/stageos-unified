'use client'

import type { StagePlan, KeywordTiers } from '@/lib/stage-types'
import { FORMATION_LABELS } from '@/lib/stage-types'
import { FormationCanvas } from '@/components/formation-canvas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Users,
  UsersRound,
  Mars,
  Venus,
  Search,
  Palette,
  Shirt,
  Lightbulb,
  ListChecks,
  TriangleAlert,
  Layers,
  MonitorPlay,
  FileDown,
  Bookmark,
  Share2,
  Printer,
} from 'lucide-react'

const PLACEHOLDER_ACTIONS = [
  { icon: FileDown, label: '导出方案' },
  { icon: Printer, label: '生成排练单' },
  { icon: Bookmark, label: '保存到方案库' },
  { icon: Share2, label: '分享给团队' },
]

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-primary" aria-hidden />
      <h3 className="text-sm font-semibold tracking-wide">{children}</h3>
    </div>
  )
}

export function PlanResult({
  plan,
  peopleCount,
  maleCount,
  femaleCount,
}: {
  plan: StagePlan
  peopleCount: number
  maleCount?: number
  femaleCount?: number
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* 标题区 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">
            {plan.level}
          </Badge>
          <Badge
            variant="outline"
            className="border-[var(--gold)]/50 text-accent-foreground"
          >
            {FORMATION_LABELS[plan.formationType]}
          </Badge>
        </div>
        <h2 className="text-balance font-serif text-2xl font-bold tracking-wide md:text-3xl">
          {plan.title}
        </h2>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          {plan.summary}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="text-foreground">层级判断：</span>
          {plan.levelReason}
        </p>

        {/* 功能占位操作栏 */}
        <div className="flex flex-wrap gap-2 pt-1">
          {PLACEHOLDER_ACTIONS.map((a) => (
            <Button
              key={a.label}
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
              onClick={() => toast.info(`「${a.label}」功能即将上线`)}
            >
              <a.icon className="size-3.5" aria-hidden />
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 队形可视化 */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" aria-hidden />
            队形结构 · {peopleCount} 人
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="aspect-[100/64] w-full">
            <FormationCanvas
              type={plan.formationType}
              count={peopleCount}
              colors={plan.colors}
              maleCount={maleCount}
              femaleCount={femaleCount}
            />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {plan.formationDescription}
          </p>

          {/* 男女站位决策 */}
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--gold)]/30 bg-secondary/30 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle icon={UsersRound}>男女站位决策</SectionTitle>
              <Badge
                variant="outline"
                className="border-[var(--gold)]/50 text-accent-foreground"
              >
                {plan.genderPlacement.strategy}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {plan.genderPlacement.description}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card/50 p-3 text-sm leading-relaxed">
                <div className="mb-1 flex items-center gap-1.5 font-medium text-[oklch(0.5_0.1_235)]">
                  <Mars className="size-4" aria-hidden />
                  男生{typeof maleCount === 'number' ? ` · ${maleCount} 人` : ''}
                </div>
                <span className="text-muted-foreground">
                  {plan.genderPlacement.maleZone}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-3 text-sm leading-relaxed">
                <div className="mb-1 flex items-center gap-1.5 font-medium text-[oklch(0.55_0.12_5)]">
                  <Venus className="size-4" aria-hidden />
                  女生{typeof femaleCount === 'number' ? ` · ${femaleCount} 人` : ''}
                </div>
                <span className="text-muted-foreground">
                  {plan.genderPlacement.femaleZone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SectionTitle icon={Layers}>层次安排</SectionTitle>
            <ul className="flex flex-col gap-1.5">
              {plan.layers.map((l, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="text-primary">·</span>
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {/* 配色 */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="size-4 text-primary" aria-hidden />
              配色方案
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* 占比条 */}
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {plan.colors.map((c, i) => (
                <div
                  key={i}
                  style={{ width: `${c.ratio}%`, backgroundColor: c.hex }}
                  title={`${c.name} ${c.ratio}%`}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {plan.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="size-9 shrink-0 rounded-md border border-border"
                    style={{ backgroundColor: c.hex }}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="font-mono text-xs uppercase text-muted-foreground">
                        {c.hex}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {c.ratio}%
                      </span>
                    </div>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {c.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 服装建议（男女分套 + 购物关键词） */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shirt className="size-4 text-primary" aria-hidden />
            服装建议 · 男女分套
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CostumeBlock
              gender="male"
              count={maleCount}
              data={plan.costume.male}
            />
            <CostumeBlock
              gender="female"
              count={femaleCount}
              data={plan.costume.female}
            />
          </div>
          <div className="rounded-lg border border-[var(--gold)]/30 bg-secondary/30 p-3 text-sm leading-relaxed">
            <span className="font-medium text-foreground">整体统一：</span>
            <span className="text-muted-foreground">
              {plan.costume.cohesionNote}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 背景大屏主题色 */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MonitorPlay className="size-4 text-primary" aria-hidden />
            背景大屏主题色
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-stretch">
          {/* 大屏预览 */}
          <div
            className="flex aspect-video w-full shrink-0 items-end justify-center rounded-xl border border-border p-4 md:w-64"
            style={{
              backgroundImage: `linear-gradient(160deg, ${plan.screenBackdrop.primaryHex}, ${plan.screenBackdrop.secondaryHex})`,
            }}
          >
            <span className="rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground">
              LED 背景大屏预览
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <SwatchChip label="主题色" hex={plan.screenBackdrop.primaryHex} />
              <SwatchChip label="渐变色" hex={plan.screenBackdrop.secondaryHex} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {plan.screenBackdrop.description}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <InfoCard
          icon={Lightbulb}
          title="灯光 / 光影"
          items={plan.lightingNotes}
        />
        <InfoCard
          icon={ListChecks}
          title="排练重点"
          items={plan.rehearsalFocus}
        />
        <InfoCard
          icon={TriangleAlert}
          title="避坑提示"
          items={plan.riskNotes}
          danger
        />
      </div>
    </div>
  )
}

function SwatchChip({ label, hex }: { label: string; hex: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 py-1.5 pl-1.5 pr-3">
      <span
        className="size-7 rounded-md border border-border"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <div className="flex flex-col leading-tight">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs uppercase">{hex}</span>
      </div>
    </div>
  )
}

function CostumeBlock({
  gender,
  count,
  data,
}: {
  gender: 'male' | 'female'
  count?: number
  data: {
    top: string
    bottom: string
    accessory: string
    searchKeywords: KeywordTiers
  }
}) {
  const isMale = gender === 'male'
  const Icon = isMale ? Mars : Venus
  const tone = isMale ? 'text-[oklch(0.5_0.1_235)]' : 'text-[oklch(0.55_0.12_5)]'

  function copyKeyword(k: string) {
    navigator.clipboard?.writeText(k).then(
      () => toast.success(`已复制：${k}`),
      () => toast.info(k),
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4">
      <div className={`flex items-center gap-1.5 font-medium ${tone}`}>
        <Icon className="size-4" aria-hidden />
        {isMale ? '男生' : '女生'}
        {typeof count === 'number' ? ` · ${count} 人` : ''}
      </div>
      <div className="flex flex-col gap-1.5 text-sm leading-relaxed">
        <div>
          <span className="text-muted-foreground">上装：</span>
          {data.top}
        </div>
        <div>
          <span className="text-muted-foreground">下装：</span>
          {data.bottom}
        </div>
        <div>
          <span className="text-muted-foreground">头饰 / 道具：</span>
          {data.accessory}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Search className="size-3.5" aria-hidden />
          购物平台搜索关键词（点击复制）
        </div>
        <KeywordRow
          label="精准词"
          hint="≥60% 命中主题配色"
          keywords={data.searchKeywords.precise}
          onCopy={copyKeyword}
          highlight
        />
        <KeywordRow
          label="兜底词"
          hint="买不到时放宽搜索"
          keywords={data.searchKeywords.fallback}
          onCopy={copyKeyword}
        />
      </div>
    </div>
  )
}

function KeywordRow({
  label,
  hint,
  keywords,
  onCopy,
  highlight,
}: {
  label: string
  hint: string
  keywords: string[]
  onCopy: (k: string) => void
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Badge
          variant={highlight ? 'default' : 'outline'}
          className={highlight ? '' : 'text-muted-foreground'}
        >
          {label}
        </Badge>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((k, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onCopy(k)}
            className={`rounded-full px-3 py-1 text-xs text-foreground transition-colors ${
              highlight
                ? 'border border-[var(--gold)]/50 bg-secondary/50 hover:border-primary hover:bg-secondary'
                : 'border border-dashed border-border bg-secondary/20 hover:border-primary/60 hover:bg-secondary/40'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  items,
  danger,
}: {
  icon: React.ElementType
  title: string
  items: string[]
  danger?: boolean
}) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon
            className={`size-4 ${danger ? 'text-destructive' : 'text-primary'}`}
            aria-hidden
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
            >
              <span className={danger ? 'text-destructive' : 'text-primary'}>
                {danger ? '!' : '·'}
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
