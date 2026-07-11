import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Box, CheckCircle2, Download, FileJson, FolderKanban, Settings2, Shapes } from 'lucide-react'
import { AppShell } from '@/components/app-shell'

const sections = {
  projects: { title: '项目', eyebrow: 'PROJECT REGISTRY', description: '管理演出项目、制作状态和关键交付日期。', icon: FolderKanban, items: ['2026 春季合唱汇演','青少年艺术节舞蹈','毕业季主题演出'] },
  modules: { title: '模块注册表', eyebrow: 'CAPABILITY MATRIX', description: '按成熟度追踪 StageOS 生产能力与 Release Gate。', icon: Shapes, items: ['计划生成引擎 · L1','舞台约束校验 · L2','服装采购匹配 · L1','3D 编队预览 · L1'] },
  exports: { title: '导出记录', eyebrow: 'DELIVERY LEDGER', description: '集中管理制作单、排练计划、舞台图与归档包。', icon: Download, items: ['春季汇演 · 制作交付包','艺术节舞蹈 · 服装总表','毕业季演出 · 风险清单'] },
  settings: { title: '设置', eyebrow: 'SYSTEM CONFIGURATION', description: '配置组织信息、默认制作参数与数据导入。', icon: Settings2, items: ['组织与成员','制作规则','采购数据源','导入与备份'] },
} as const

type Props = { params: Promise<{ section: string }> }
export default async function SectionPage({ params }: Props) {
  const { section } = await params
  const config = sections[section as keyof typeof sections]
  if (!config) notFound()
  const Icon = config.icon
  return <AppShell><div className="mx-auto max-w-6xl p-4 md:p-6"><header className="tech-grid border p-5 md:p-8"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow">{config.eyebrow}</p><h1 className="mt-3 text-3xl font-medium">{config.title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{config.description}</p></div><div className="grid size-12 place-items-center border bg-card text-primary"><Icon className="size-5" /></div></div></header><section className="mt-4 panel"><div className="flex items-center justify-between border-b p-4"><p className="eyebrow">CURRENT DATA</p>{section === 'projects' && <Link href="/projects/new" className="bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">新建项目</Link>}</div><div>{config.items.map((item,i)=><Link href={section === 'projects' ? `/projects/${['spring-choir','youth-dance','graduation'][i]}` : '#'} key={item} className="group flex items-center gap-4 border-b p-4 last:border-0 hover:bg-secondary/40"><span className="font-mono text-[10px] text-primary">{String(i+1).padStart(2,'0')}</span><span className="flex-1 text-sm">{item}</span>{section === 'modules' ? <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><CheckCircle2 className="size-3 text-primary" /> READY</span> : section === 'exports' ? <FileJson className="size-4 text-muted-foreground" /> : <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />}</Link>)}</div></section>{section === 'settings' && <div className="mt-4 border border-dashed p-6 text-center"><Box className="mx-auto size-5 text-primary" /><p className="mt-3 text-sm">业务数据导入接口已预留</p><p className="mt-1 text-xs text-muted-foreground">你提供数据文件后，将在这里完成字段映射与校验。</p></div>}</div></AppShell>
}
