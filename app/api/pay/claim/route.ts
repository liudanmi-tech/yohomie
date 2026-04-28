import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthedUser } from '@/lib/auth/session'
import { planDays } from '@/lib/pay/plans'
import { setDemoMemberCookieOnResponse } from '@/lib/auth/demo-member'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { outTradeNo?: string }
  const outTradeNo = body.outTradeNo?.trim()
  if (!outTradeNo) {
    return NextResponse.json({ ok: false, message: '缺少订单号' }, { status: 400 })
  }

  const order = await prisma.paymentOrder.findUnique({
    where: { outTradeNo },
    select: {
      status: true,
      planType: true,
      userId: true,
      paidAt: true,
    },
  })
  if (!order) {
    return NextResponse.json({ ok: false, message: '订单不存在' }, { status: 404 })
  }
  if (order.status !== 'PAID') {
    return NextResponse.json({ ok: false, message: '订单未支付' }, { status: 400 })
  }

  const user = await getAuthedUser()
  const paidAt = order.paidAt ?? new Date()
  const days = planDays(order.planType === 'year' ? 'year' : 'month')

  // 已登录：将订单绑定到账号并开通会员（幂等）
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { memberExpiresAt: true },
    })
    if (!dbUser) {
      return NextResponse.json({ ok: false, message: '账号不存在' }, { status: 404 })
    }
    const startAt =
      dbUser.memberExpiresAt && dbUser.memberExpiresAt > paidAt ? dbUser.memberExpiresAt : paidAt
    const nextExpire = new Date(startAt.getTime() + days * 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.paymentOrder.update({
        where: { outTradeNo },
        data: { userId: user.id },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { memberExpiresAt: nextExpire },
      }),
    ])

    return NextResponse.json({ ok: true, message: '会员权益已开通' })
  }

  // 未登录：写入本机 Cookie 解锁阅读（不落库）
  const expiresAt = new Date(paidAt.getTime() + days * 24 * 60 * 60 * 1000)
  const res = NextResponse.json({ ok: true, message: '会员权益已开通' })
  setDemoMemberCookieOnResponse(res, expiresAt)
  return res
}

