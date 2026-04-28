import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAlipayClient, getAlipayUrls } from '@/lib/pay/alipay'
import { planDays } from '@/lib/pay/plans'

type NotifyParams = Record<string, string>

function textResponse(content: 'success' | 'failure') {
  return new NextResponse(content, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

function parseNotifyParams(bodyText: string): NotifyParams {
  const params = new URLSearchParams(bodyText)
  const obj: NotifyParams = {}
  for (const [key, value] of params.entries()) {
    obj[key] = value
  }
  return obj
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    const params = parseNotifyParams(bodyText)
    if (!params.out_trade_no || !params.sign) return textResponse('failure')

    const alipay = getAlipayClient()
    const signOk = await alipay.checkNotifySign(params)
    if (!signOk) return textResponse('failure')

    const urls = getAlipayUrls()
    const notifyAppId = params.app_id || params.merchant_app_id
    if (!notifyAppId || notifyAppId !== urls.appId) return textResponse('failure')

    const tradeStatus = params.trade_status
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return textResponse('success')
    }

    const outTradeNo = params.out_trade_no
    const totalAmount = Number(params.total_amount || 0)
    const order = await prisma.paymentOrder.findUnique({ where: { outTradeNo } })
    if (!order) return textResponse('failure')

    const orderAmount = Number((order.amount / 100).toFixed(2))
    if (Math.abs(orderAmount - totalAmount) > 0.0001) {
      return textResponse('failure')
    }
    if (order.status === 'PAID') return textResponse('success')

    const paidAt = new Date()
    const baseUpdates = prisma.paymentOrder.update({
      where: { outTradeNo },
      data: {
        status: 'PAID',
        tradeNo: params.trade_no || null,
        paidAt,
        rawNotify: bodyText.slice(0, 4000),
      },
    })

    if (!order.userId) {
      await baseUpdates
      return textResponse('success')
    }

    const days = planDays(order.planType === 'year' ? 'year' : 'month')
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { memberExpiresAt: true },
    })
    if (!user) return textResponse('failure')

    const startAt =
      user.memberExpiresAt && user.memberExpiresAt > paidAt ? user.memberExpiresAt : paidAt
    const nextExpire = new Date(startAt.getTime() + days * 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      baseUpdates,
      prisma.user.update({
        where: { id: order.userId },
        data: { memberExpiresAt: nextExpire },
      }),
    ])

    return textResponse('success')
  } catch (error) {
    console.error('alipay notify handle error:', error)
    return textResponse('failure')
  }
}
