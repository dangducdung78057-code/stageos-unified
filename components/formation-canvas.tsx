'use client'

import { useMemo } from 'react'
import type { FormationType } from '@/lib/stage-types'
import { FORMATION_LABELS } from '@/lib/stage-types'

interface Dot {
  x: number // 0-100
  y: number // 0-100
  size: number
  accent?: boolean
  gender?: 'male' | 'female'
}

const VIEW_W = 100
const VIEW_H = 64

// 给已生成的点按性别分配：依据队形语义（前/后、左/右、中心）让男女各自成区
function assignGenders(
  dots: Dot[],
  type: FormationType,
  maleCount: number,
  femaleCount: number,
): Dot[] {
  const total = dots.length
  if (total === 0) return dots
  // 按比例换算到当前可视点数
  const ratioMale = maleCount + femaleCount > 0
    ? maleCount / (maleCount + femaleCount)
    : 0.5
  let maleQuota = Math.round(total * ratioMale)

  // 排序键：不同队形用不同的"分区轴"
  const indexed = dots.map((d, i) => ({ d, i }))
  if (type === 'layered_order' || type === 'density_flow') {
    // 后排（y大）优先给男生，形成"男后女前"层次
    indexed.sort((a, b) => b.d.y - a.d.y)
  } else if (type === 'central_axis') {
    // 离中轴越远越靠两翼 → 男生站两翼，女生靠中轴
    indexed.sort(
      (a, b) => Math.abs(b.d.x - 50) - Math.abs(a.d.x - 50),
    )
  } else if (type === 'morph_gradient') {
    // 外圈男生、内圈女生
    const dist = (d: Dot) => Math.hypot(d.x - 50, d.y - 50)
    indexed.sort((a, b) => dist(b.d) - dist(a.d))
  } else {
    // module_array：左半男、右半女
    indexed.sort((a, b) => a.d.x - b.d.x)
    maleQuota = Math.round(total * ratioMale)
  }

  indexed.forEach((item, rank) => {
    item.d.gender = rank < maleQuota ? 'male' : 'female'
  })
  return dots
}

function buildDots(type: FormationType, count: number): Dot[] {
  const n = Math.max(4, Math.min(count, 80))
  const dots: Dot[] = []

  if (type === 'module_array') {
    // 5-8 人小单元拼成大画面
    const unit = 6
    const groups = Math.ceil(n / unit)
    const cols = Math.ceil(Math.sqrt(groups))
    const rows = Math.ceil(groups / cols)
    let placed = 0
    for (let g = 0; g < groups; g++) {
      const gc = g % cols
      const gr = Math.floor(g / cols)
      const cx = ((gc + 0.5) / cols) * 100
      const cy = ((gr + 0.5) / rows) * 100
      const per = Math.min(unit, n - placed)
      const ucols = Math.ceil(Math.sqrt(per))
      for (let i = 0; i < per; i++) {
        const ic = i % ucols
        const ir = Math.floor(i / ucols)
        dots.push({
          x: cx + (ic - (ucols - 1) / 2) * 6,
          y: cy + (ir - 0.5) * 9,
          size: 1.9,
          accent: i === 0,
        })
      }
      placed += per
    }
  } else if (type === 'layered_order') {
    // 前中后三层，高度递进
    const layers = 3
    for (let i = 0; i < n; i++) {
      const layer = Math.floor((i / n) * layers)
      const inLayer = n / layers
      const idxInLayer = i - Math.floor((layer / layers) * n)
      const y = 22 + layer * 28
      const x = ((idxInLayer + 0.5) / inLayer) * 100
      dots.push({ x, y, size: 1.6 + layer * 0.5 })
    }
  } else if (type === 'density_flow') {
    // 疏密变化
    for (let i = 0; i < n; i++) {
      const t = i / n
      const x = 8 + t * 84
      // 中段密集，两端稀疏
      const jitter = Math.sin(t * Math.PI) * 26
      const rows = 3
      const r = i % rows
      dots.push({
        x: x + (Math.random() - 0.5) * 4,
        y: 50 + (r - 1) * jitter * 0.6,
        size: 1.8,
      })
    }
  } else if (type === 'central_axis') {
    // 中轴对称仪式型
    const rows = Math.ceil(n / 6)
    let placed = 0
    for (let r = 0; r < rows && placed < n; r++) {
      const per = Math.min(6, n - placed)
      const y = 18 + (r / Math.max(1, rows - 1)) * 60
      for (let i = 0; i < per; i++) {
        const offset = i - (per - 1) / 2
        dots.push({
          x: 50 + offset * 13,
          y,
          size: 1.9,
          accent: offset === 0 && r === Math.floor(rows / 2),
        })
        placed++
      }
    }
  } else {
    // morph_gradient: 圆阵
    const rings = Math.max(2, Math.round(Math.sqrt(n / 3)))
    let placed = 0
    for (let ring = 0; ring < rings && placed < n; ring++) {
      const ringCount =
        ring === 0 ? 1 : Math.min(n - placed, Math.round((ring / rings) * n))
      const radius = (ring / rings) * 42
      for (let i = 0; i < ringCount && placed < n; i++) {
        const angle = (i / ringCount) * Math.PI * 2 - Math.PI / 2
        dots.push({
          x: 50 + Math.cos(angle) * radius * (VIEW_H / VIEW_W),
          y: 50 + Math.sin(angle) * radius * 0.78,
          size: 1.9,
          accent: ring === 0,
        })
        placed++
      }
    }
  }

  return dots
}

export function FormationCanvas({
  type,
  count,
  colors,
  maleCount,
  femaleCount,
}: {
  type: FormationType
  count: number
  colors: { hex: string }[]
  maleCount?: number
  femaleCount?: number
}) {
  const hasGender =
    typeof maleCount === 'number' &&
    typeof femaleCount === 'number' &&
    maleCount + femaleCount > 0
  const dots = useMemo(() => {
    const base = buildDots(type, count)
    return hasGender
      ? assignGenders(base, type, maleCount as number, femaleCount as number)
      : base
  }, [type, count, hasGender, maleCount, femaleCount])
  const primary = colors[0]?.hex ?? '#E6B85C'
  const accent = colors[1]?.hex ?? '#7FB3C8'
  // 男女区分色：男=冷色，女=暖色（独立于服装配色，仅用于站位示意）
  const maleColor = '#4F8BB8'
  const femaleColor = '#D98AA0'

  function fillFor(d: Dot) {
    if (hasGender && d.gender) {
      return d.gender === 'male' ? maleColor : femaleColor
    }
    return d.accent ? accent : primary
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/40">
      {/* 舞台地面网格 */}
      <div className="absolute inset-0 stage-spotlight" aria-hidden />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="relative h-full w-full"
        role="img"
        aria-label={`${FORMATION_LABELS[type]}队形示意，共 ${count} 人${
          hasGender ? `，男 ${maleCount} 女 ${femaleCount}` : ''
        }`}
      >
        <defs>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.93 0.022 130)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="oklch(0.88 0.03 120)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#floor)" />
        {/* 中轴线 */}
        <line
          x1="50"
          y1="2"
          x2="50"
          y2={VIEW_H - 2}
          stroke="currentColor"
          strokeWidth="0.15"
          strokeDasharray="1 1.5"
          className="text-border"
        />
        {/* 观众主视角标记 */}
        <text
          x="50"
          y={VIEW_H - 1.5}
          textAnchor="middle"
          fontSize="2.4"
          className="fill-muted-foreground"
        >
          ▲ 观众主视角
        </text>
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.size}
            fill={fillFor(d)}
            stroke="oklch(0.99 0.01 95)"
            strokeWidth="0.3"
          >
            <title>
              {hasGender && d.gender
                ? d.gender === 'male'
                  ? '男生位'
                  : '女生位'
                : d.accent
                  ? '锚点 / 主角位'
                  : '群体位'}
            </title>
          </circle>
        ))}
      </svg>
      {hasGender && (
        <div className="absolute right-2 top-2 flex gap-2 rounded-md border border-border bg-background/85 px-2 py-1 text-[10px]">
          <span className="flex items-center gap-1">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: maleColor }}
              aria-hidden
            />
            男 {maleCount}
          </span>
          <span className="flex items-center gap-1">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: femaleColor }}
              aria-hidden
            />
            女 {femaleCount}
          </span>
        </div>
      )}
    </div>
  )
}
