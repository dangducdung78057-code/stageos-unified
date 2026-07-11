'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Box, Check, Ruler, Save, Users } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const creating = id === 'new'
  const [title, setTitle] = useState(creating ? '' : id === 'spring-choir' ? '2026 春季合唱汇演' : '舞台制作项目')
  const [count, setCount] = useState(creating ? 36 : 48)
  const [theme, setTheme] = useState('山海新声')
  const save = () => toast.success(creating ? '项目草稿已创建' : '项目已保存')
  return <AppShell><div className="mx-auto max-w-6xl p-4 md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Link href="/projects" aria-label="返回项目"><ArrowLeft className="size-4" /></Link><div><p className="eyebrow">{creating ? 'NEW PROJECT' : `PROJECT / ${id.toUpperCase()}`}</p><h1 className="mt-1 text-xl font-medium">{creating ? '建立制作项目' : title}</h1></div></div><button onClick={save} className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Save className="size-4" />保存项目</button></div><div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]"><section className="panel"><div className="border-b p-4"><p className="eyebrow">CORE INPUT</p><h2 className="mt-1 text-sm">项目基本信息</h2></div><div className="grid gap-5 p-4 sm:grid-cols-2"><Field label="项目标题"><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="输入项目标题" /></Field><Field label="演出日期"><input type="date" defaultValue="2026-04-18" /></Field><Field label="参与人数"><input type="number" value={count} onChange={(e)=>setCount(Number(e.target.value))} /></Field><Field label="节目类型"><select defaultValue="choir"><option value="choir">合唱</option><option value="dance">舞蹈</option><option value="drama">戏剧</option></select></Field><div className="sm:col-span-2"><Field label="节目主题"><textarea rows={3} value={theme} onChange={(e)=>setTheme(e.target.value)} /></Field></div></div></section><aside className="flex flex-col gap-4"><div className="panel p-4"><p className="eyebrow">INPUT STATUS</p><div className="mt-4 flex flex-col gap-3">{[['基本信息',Check],['人员规模',Users],['场地尺寸',Ruler],['舞台方案',Box]].map(([label,Icon])=><div key={String(label)} className="flex items-center justify-between border-b pb-3 text-sm last:border-0 last:pb-0"><span>{String(label)}</span><Icon className="size-4 text-primary" /></div>)}</div></div><Link href="/formation-3d" className="flex items-center justify-between border bg-card p-4 text-sm hover:border-primary"><span>打开 3D 编队工作区</span><Box className="size-4 text-primary" /></Link><div className="border border-dashed p-4"><p className="text-xs font-medium">数据状态</p><p className="mt-2 text-xs leading-5 text-muted-foreground">当前使用交接包 mock。正式学生、尺码与预算数据待你补传后接入。</p></div></aside></div></div></AppShell>
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="flex flex-col gap-2 text-xs text-muted-foreground"><span className="eyebrow">{label}</span><div className="[&_input]:h-10 [&_input]:w-full [&_input]:border [&_input]:bg-background [&_input]:px-3 [&_input]:text-sm [&_input]:text-foreground [&_select]:h-10 [&_select]:w-full [&_select]:border [&_select]:bg-background [&_select]:px-3 [&_select]:text-sm [&_textarea]:w-full [&_textarea]:border [&_textarea]:bg-background [&_textarea]:p-3 [&_textarea]:text-sm [&_textarea]:text-foreground">{children}</div></label> }
