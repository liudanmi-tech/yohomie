import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { setDemoMemberCookieOnResponse } from '@/lib/auth/demo-member'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { plan?: 'month' | 'year' }
  const plan = body.plan === 'year' ? 'year' : 'month'
  const now = Date.now()
  const days = plan === 'year' ? 365 : 30
  const memberExpiresAt = new Date(now + days * 24 * 60 * 60 * 1000)
  const memberExpiresAtIso = memberExpiresAt.toISOString()
  const message = plan === 'year' ? '年度会员已开通' : '月度会员已开通'

  const user = await getAuthedUser()
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { memberExpiresAt },
    })
    return NextResponse.json({
      ok: true,
      memberExpiresAt: memberExpiresAtIso,
      message,
    })
  }

  const res = NextResponse.json({
    ok: true,
    memberExpiresAt: memberExpiresAtIso,
    message,
  })
  setDemoMemberCookieOnResponse(res, memberExpiresAt)
  return res
}
