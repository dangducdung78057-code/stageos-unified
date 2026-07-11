'use client'

import { Box, Camera, Maximize, Rotate3d, Users } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { StageScene } from '@/components/stage-scene'

export default function Formation3DPage() {
  return <AppShell><div className="flex min-h-[calc(100dvh-3rem)] flex-col"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><p className="eyebrow">FORMATION VIEWPORT / LIVE</p><h1 className="mt-1 text-lg font-medium">春季合唱汇演 · 队形预览</h1></div><div className="flex items-center gap-2">{[[Users,'9 / 48'],[Rotate3d,'轨道'],[Camera,'截图']].map(([Icon,label])=><button key={String(label)} className="flex h-8 items-center gap-2 border px-3 text-xs hover:bg-secondary"><Icon className="size-3.5 text-primary" />{String(label)}</button>)}</div></div><div className="relative min-h-[440px] flex-1 bg-background"><StageScene /><div className="pointer-events-none absolute left-4 top-4 border bg-background/90 p-3"><p className="eyebrow">SCENE DATA</p><dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs"><dt className="text-muted-foreground">阵型</dt><dd>双弧合唱</dd><dt className="text-muted-foreground">舞台</dt><dd className="font-mono">14 × 10m</dd><dt className="text-muted-foreground">间距</dt><dd className="font-mono">1.5m</dd></dl></div><div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 border bg-background/90 px-3 py-2 text-[10px] text-muted-foreground"><Box className="size-3 text-primary" />拖动旋转 · 滚轮缩放 <Maximize className="ml-2 size-3" /></div></div></div></AppShell>
}
