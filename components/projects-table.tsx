"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { deleteProject } from "@/app/actions/projects"

type Row = {
  id: string
  title: string
  status: string
  performanceDate: string | null
  performerCount: number | null
  updatedAt: string
}

export function ProjectsTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("")
  const [pending, startTransition] = useTransition()
  const filtered = rows.filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()))

  const onDelete = (id: string, title: string) => {
    if (!window.confirm(`确认删除项目「${title}」？该操作不可撤销。`)) return
    startTransition(async () => {
      await deleteProject(id)
      toast.success("项目已删除")
    })
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">项目</h1>
          <p className="text-sm text-muted-foreground">全部演出服装排产项目。</p>
        </div>
        <Link href="/projects/new" className="inline-flex h-8 items-center gap-1 bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="size-4" />
          新建项目 · 向导
        </Link>
      </div>
      <div className="panel">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="relative w-full max-w-72">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索标题…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-8 pl-7 text-sm"
            />
          </div>
          <span className="eyebrow hidden md:inline">GET /projects</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">演出日期</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">人数</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">更新时间</th>
                <th className="w-28 px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    {rows.length === 0 ? "暂无项目，点击右上角创建。" : "无匹配项目"}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                    {r.performanceDate ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs md:table-cell">{r.performerCount ?? "—"}</td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground lg:table-cell">
                    {new Date(r.updatedAt).toLocaleString("zh-CN", { hour12: false })}
                  </td>
                  <td className="space-x-2 px-4 py-3">
                    <Link href={`/projects/${r.id}`} className="text-xs text-primary hover:underline">
                      打开
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(r.id, r.title)}
                      disabled={pending}
                      aria-label={`删除${r.title}`}
                      className="align-middle text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
