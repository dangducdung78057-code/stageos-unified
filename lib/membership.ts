import "server-only"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import type { MembershipTier } from "@/domain/stageos/types"

/** 读取当前登录用户的会员等级;未登录返回 null。等级是服务端权限判定的唯一来源。 */
export async function getSessionTier(): Promise<{ userId: string; tier: MembershipTier } | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const [row] = await db
    .select({ tier: user.membershipTier })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)
  const tier = (row?.tier ?? "free") as MembershipTier
  return { userId: session.user.id, tier }
}
