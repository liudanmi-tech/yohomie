import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthedUser } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser()

  const outTradeNo = req.nextUrl.searchParams.get('outTradeNo')
  if (!outTradeNo) {
    return NextResponse.json({ ok: false, message: '缺少订单号' }, { status: 400 })
  }

  const order = await prisma.paymentOrder.findUnique({
    where: { outTradeNo },
    select: {
      outTradeNo: true,
      status: true,
      planType: true,
      amount: true,
      paidAt: true,
      createdAt: true,
      userId: true,
    },
  })
  if (!order) {
    return NextResponse.json({ ok: false, message: '订单不存在' }, { status: 404 })
  }
  if (order.userId && (!user || order.userId !== user.id)) {
    return NextResponse.json({ ok: false, message: '订单不存在' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    order: {
      outTradeNo: order.outTradeNo,
      status: order.status,
      planType: order.planType,
      amount: (order.amount / 100).toFixed(2),
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    },
  })
}
