'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Box, Download, FolderKanban, LayoutDashboard, Menu, Settings, Shapes, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navigation = [
  { href: '/', label: '工作台', icon: LayoutDashboard, code: '01' },
  { href: '/projects', label: '项目', icon: FolderKanban, code: '02' },
  { href: '/modules', label: '模块注册表', icon: Shapes, code: '03' },
  { href: '/formation-3d', label: '3D 编队', icon: Box, code: '04' },
  { href: '/exports', label: '导出记录', icon: Download, code: '05' },
  { href: '/settings', label: '设置', icon: Settings, code: '06' },
]

function Sidebar({ close }: { close?: () => void }) {
  const pathname = usePathname()
  return <div className="flex h-full flex-col bg-sidebar">
    <div className="flex h-16 items-center justify-between border-b px-5">
      <Link href="/" className="flex items-center gap-3" onClick={close}>
        <span className="grid size-8 place-items-center border border-primary bg-primary text-primary-foreground"><Shapes className="size-4" /></span>
        <span><b className="block text-sm tracking-[.16em]">STAGEOS</b><span className="eyebrow">UNIFIED / V5</span></span>
      </Link>
      {close && <button type="button" onClick={close} aria-label="关闭导航"><X className="size-5" /></button>}
    </div>
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="主导航">
      {navigation.map(({ href, label, icon: Icon, code }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return <Link key={href} href={href} onClick={close} className={cn('flex items-center gap-3 border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-sidebar-accent hover:text-foreground', active && 'border-border bg-sidebar-accent text-foreground')}>
          <span className="font-mono text-[10px] text-primary">{code}</span><Icon className="size-4" /><span>{label}</span>
        </Link>
      })}
    </nav>
    <div className="border-t p-4"><p className="eyebrow">SYSTEM STATUS</p><div className="mt-2 flex items-center gap-2 text-xs"><span className="size-1.5 bg-primary" />NEON READY</div></div>
  </div>
}

export function AppShell({ children, userName }: { children: React.ReactNode; userName?: string }) {
  const [open, setOpen] = useState(false)
  return <div className="flex min-h-dvh bg-background">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r lg:block"><Sidebar /></aside>
    {open && <div className="fixed inset-0 z-40 bg-background/80 lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-72 border-r" onClick={(e) => e.stopPropagation()}><Sidebar close={() => setOpen(false)} /></aside></div>}
    <div className="min-w-0 flex-1 lg:pl-60">
      <header className="sticky top-0 z-20 flex h-12 items-center border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <button type="button" className="mr-3 lg:hidden" onClick={() => setOpen(true)} aria-label="打开导航"><Menu className="size-5" /></button>
        <div className="eyebrow">PRODUCTION CONTROL / CHINA</div>
        <div className="ml-auto flex items-center gap-3">{userName && <span className="hidden text-xs text-muted-foreground sm:inline">{userName}</span>}<span className="border border-border px-2 py-1 font-mono text-[10px]">MODE: LIVE</span></div>
      </header>
      <main>{children}</main>
    </div>
  </div>
}
