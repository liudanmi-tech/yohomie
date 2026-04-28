'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type PayStatus = 'loading' | 'paid' | 'pending' | 'failed'

type OrderStatusResponse = {
  ok?: boolean
  message?: string
  order?: {
    status?: string
    outTradeNo?: string
  }
}

type ClaimResponse = { ok?: boolean; message?: string }

export default function PayResultClient() {
  const params = useSearchParams()
  const outTradeNo = params.get('out_trade_no') || params.get('outTradeNo') || ''
  const [status, setStatus] = useState<PayStatus>('loading')
  const [message, setMessage] = useState('正在确认支付状态...')
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    if (!outTradeNo) {
      setStatus('failed')
      setMessage('缺少订单号，请返回订阅页重新发起支付。')
      return
    }

    let cancelled = false
    const timer = window.setInterval(async () => {
      try {
        const resp = await fetch(`/api/pay/status?outTradeNo=${encodeURIComponent(outTradeNo)}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const data = (await resp.json().catch(() => ({}))) as OrderStatusResponse
        if (cancelled) return
        if (!resp.ok) {
          setStatus('failed')
          setMessage(data.message || '订单查询失败，请稍后重试。')
          window.clearInterval(timer)
          return
        }
        const orderStatus = data.order?.status
        if (orderStatus === 'PAID') {
          setStatus('paid')
          if (!claimed) {
            const claimResp = await fetch('/api/pay/claim', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ outTradeNo }),
            })
            const claimData = (await claimResp.json().catch(() => ({}))) as ClaimResponse
            if (claimResp.ok && claimData.ok !== false) {
              setClaimed(true)
              setMessage(claimData.message || '支付成功，会员权益已开通。')
            } else {
              setMessage(claimData.message || '支付成功，正在同步会员权益，请稍后刷新。')
            }
          } else {
            setMessage('支付成功，会员权益已开通。')
          }
          window.clearInterval(timer)
          return
        }
        if (orderStatus === 'FAILED' || orderStatus === 'CLOSED') {
          setStatus('failed')
          setMessage('该订单未支付成功，请重新发起订阅。')
          window.clearInterval(timer)
          return
        }
        setStatus('pending')
        setMessage('支付结果确认中，请稍候...')
      } catch {
        if (!cancelled) {
          setStatus('failed')
          setMessage('网络异常，暂时无法确认支付结果。')
          window.clearInterval(timer)
        }
      }
    }, 2500)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [outTradeNo, claimed])

  const toneClass =
    status === 'paid'
      ? 'text-sage-dark'
      : status === 'failed'
        ? 'text-red-600'
        : 'text-stone-700'

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-warm-ink">支付结果</h1>
      <p className={`mt-4 text-sm ${toneClass}`}>{message}</p>
      {outTradeNo ? <p className="mt-2 text-xs text-stone-500">订单号：{outTradeNo}</p> : null}
      <div className="mt-6 flex gap-3">
        <Link
          href="/#pricing"
          className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white"
        >
          返回订阅页
        </Link>
        <Link href="/member" className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700">
          查看会员专栏
        </Link>
      </div>
    </div>
  )
}
