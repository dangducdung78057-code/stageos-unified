'use client'

import Link from 'next/link'
import { ArrowRight, Box, CalendarDays, CircleAlert, Download, Plus, Users } from 'lucide-react'
import { AppShell } from '@/components/app-shell'

type ProjectSummary = { id: string; title: string; status: string; performanceDate: string | null; performerCount: number | null }

export function Dashboard({ projects }: { projects: ProjectSummary[] }) {
  return <AppShell><div className="mx-auto max-w-[1500px] p-4 md:p-6">
    <section className="tech-grid border border-border p-5 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div><p className="eyebrow">STAGE PRODUCTION OPERATING SYSTEM</p><h1 className="mt-3 max-w-3xl text-balance text-3xl font-medium tracking-tight md:text-5xl">把舞台方案变成可执行的制作系统。</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">从节目输入、服装排产到 3D 编队与交付导出，所有关键决策都在同一条生产链路上。</p></div>
        <Link href="/projects/new" className="inline-flex h-10 items-center justify-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="size-4" />新建项目</Link>
      </div>
    </section>

    <section className="mt-4 grid grid-cols-2 border-l border-t sm:grid-cols-4">
      {[['项目总数','12',Box],['参与学生','386',Users],['风险事项','03',CircleAlert],['本月导出','28',Download]].map(([label,value,Icon]) => <div key={String(label)} className="border-b border-r bg-card p-4 md:p-5"><div className="flex items-center justify-between"><span className="eyebrow">{String(label)}</span><Icon className="size-4 text-primary" /></div><div className="metric mt-5 text-2xl md:text-3xl">{String(value)}</div></div>)}
    </section>

    <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
      <section className="panel min-w-0"><div className="flex items-center justify-between border-b px-4 py-3"><div><p className="eyebrow">ACTIVE PROJECTS</p><h2 className="mt-1 text-sm font-medium">近期制作项目</h2></div><Link href="/projects" className="flex items-center gap-1 text-xs text-primary">全部项目 <ArrowRight className="size-3" /></Link></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-[10px] uppercase tracking-widest text-muted-foreground"><tr>{['项目','状态','演出日期','人数','进度',''].map((h) => <th key={h} className="border-b px-4 py-3 font-normal">{h}</th>)}</tr></thead><tbody>{projects.length ? projects.map((p) => <tr key={p.id} className="group border-b last:border-0 hover:bg-secondary/40"><td className="px-4 py-4 font-medium">{p.title}</td><td className="px-4 py-4"><span className="border border-border px-2 py-1 text-xs">{p.status === 'draft' ? '草稿' : p.status}</span></td><td className="px-4 py-4 font-mono text-xs text-muted-foreground">{p.performanceDate ?? '待设置'}</td><td className="px-4 py-4 font-mono">{p.performerCount ?? '—'}</td><td className="px-4 py-4"><span className="font-mono text-[10px] text-muted-foreground">数据待完善</span></td><td className="px-4 py-4"><Link href={`/projects/${p.id}`} aria-label={`查看${p.title}`}><ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" /></Link></td></tr>) : <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">暂无项目。创建第一个制作项目后，进度会显示在这里。</td></tr>}</tbody></table></div>
      </section>
      <aside className="panel"><div className="border-b p-4"><p className="eyebrow">NEXT MILESTONES</p><h2 className="mt-1 text-sm font-medium">生产时间轴</h2></div><div className="p-4">{[['07/14','服装尺码复核'],['07/18','第一轮走台'],['07/22','灯光方案冻结'],['08/02','正式交付包']].map(([date,item],i)=><div key={item} className="flex gap-4 pb-5 last:pb-0"><div className="flex flex-col items-center"><span className="mt-1 size-2 bg-primary" />{i<3&&<span className="mt-1 h-full w-px bg-border" />}</div><div><div className="font-mono text-[10px] text-muted-foreground">{date}</div><div className="mt-1 text-sm">{item}</div></div></div>)}</div><Link href="/projects/spring-choir" className="flex items-center justify-between border-t p-4 text-xs hover:bg-secondary/40"><span className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />查看完整倒排计划</span><ArrowRight className="size-3" /></Link></aside>
    </div>
  </div></AppShell>
}
