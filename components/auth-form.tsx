"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const isSignUp = mode === "sign-up"
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("")
    const data = new FormData(event.currentTarget)
    const email = String(data.get("email")); const password = String(data.get("password")); const name = String(data.get("name") || "StageOS 用户")
    const result = isSignUp ? await authClient.signUp.email({ email, password, name }) : await authClient.signIn.email({ email, password })
    setPending(false)
    if (result.error) return setError(result.error.message ?? "操作失败，请重试")
    router.push("/"); router.refresh()
  }
  return <main className="flex min-h-screen items-center justify-center bg-muted p-4"><section className="w-full max-w-md border border-border bg-card p-8 shadow-xl">
    <div className="mb-8"><div className="mb-5 flex size-11 items-center justify-center bg-primary font-mono text-xs font-bold text-primary-foreground">SO</div><h1 className="text-balance text-3xl font-semibold">{isSignUp ? "创建 StageOS 账户" : "登录 StageOS"}</h1><p className="mt-2 text-sm text-muted-foreground">统一管理舞台方案、队形与制作交付。</p></div>
    <form className="flex flex-col gap-4" onSubmit={submit}>{isSignUp && <label className="text-sm font-medium">姓名<input name="name" required className="mt-2 w-full border border-border bg-background px-3 py-2.5" /></label>}<label className="text-sm font-medium">邮箱<input name="email" type="email" required className="mt-2 w-full border border-border bg-background px-3 py-2.5" /></label><label className="text-sm font-medium">密码<input name="password" type="password" minLength={8} required className="mt-2 w-full border border-border bg-background px-3 py-2.5" /></label>{error && <p className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={pending} className="mt-2">{pending ? "处理中…" : isSignUp ? "创建账户" : "登录"}</Button></form>
    <p className="mt-6 text-sm text-muted-foreground">{isSignUp ? "已有账户？" : "还没有账户？"} <Link className="font-medium text-primary" href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "直接登录" : "立即注册"}</Link></p>
  </section></main>
}
