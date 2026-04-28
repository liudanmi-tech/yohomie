import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthedUser } from '@/lib/auth/session'
import { getAlipayClient, getAlipayUrls } from '@/lib/pay/alipay'
import { normalizePlanType, planAmount, planTitle } from '@/lib/pay/plans'

type CreatePayBody = {
  planType?: 'month' | 'year'
  amount?: string
}

function createOutTradeNo() {
  const now = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  const ts = `${now.getFullYear()}${p2(now.getMonth() + 1)}${p2(now.getDate())}${p2(
    now.getHours(),
  )}${p2(now.getMinutes())}${p2(now.getSeconds())}`
  const rand = Math.random().toString().slice(2, 8)
  return `YH${ts}${rand}`
}

function safeMessage(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : JSON.stringify(err)
  // 避免把疑似密钥/签名串直接回传到前端
  return raw
    .replace(/-----BEGIN[\s\S]*?-----END[\s\S]*?-----/g, '[PEM]')
    .replace(/[A-Za-z0-9+/=]{120,}/g, '[REDACTED]')
    .slice(0, 240)
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser()

  try {
    const body = (await req.json().catch(() => ({}))) as CreatePayBody
    const planType = normalizePlanType(body.planType)
    const amountText = planAmount(planType)
    const amountCents = Math.round(Number(amountText) * 100)
    if (body.amount && Number(body.amount).toFixed(2) !== amountText) {
      return NextResponse.json({ ok: false, message: '订单金额校验失败' }, { status: 400 })
    }

    const outTradeNo = createOutTradeNo()
    await prisma.paymentOrder.create({
      data: {
        outTradeNo,
        userId: user?.id ?? null,
        planType,
        amount: amountCents,
      },
    })

    let alipay: ReturnType<typeof getAlipayClient>
    let urls: ReturnType<typeof getAlipayUrls>
    try {
      alipay = getAlipayClient()
      urls = getAlipayUrls()
    } catch (e) {
      return NextResponse.json(
        { ok: false, message: `支付配置异常：${safeMessage(e)}` },
        { status: 500 },
      )
    }
    const passbackParams = encodeURIComponent(
      JSON.stringify({ userId: user?.id ?? null, planType, outTradeNo }),
    )
    const payRequest = {
      notify_url: urls.notifyUrl,
      return_url: `${urls.returnUrl}?out_trade_no=${outTradeNo}`,
      bizContent: {
        out_trade_no: outTradeNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: amountText,
        subject: planTitle(planType),
        passback_params: passbackParams,
      },
    }
    let pageRedirectionData = ''
    let payUrl = ''
    try {
      pageRedirectionData = (await alipay.pageExec('alipay.trade.page.pay', {
        method: 'POST',
        ...payRequest,
      })) as string
      payUrl = (await alipay.pageExec('alipay.trade.page.pay', {
        method: 'GET',
        ...payRequest,
      })) as string
    } catch (e) {
      return NextResponse.json(
        { ok: false, message: `创建支付订单失败：${safeMessage(e)}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      outTradeNo,
      pageRedirectionData,
      payUrl,
    })
  } catch (error) {
    console.error('create alipay order failed:', error)
    return NextResponse.json(
      { ok: false, message: `创建支付订单失败：${safeMessage(error)}` },
      { status: 500 },
    )
  }
}
