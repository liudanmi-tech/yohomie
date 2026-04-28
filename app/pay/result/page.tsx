import { Suspense } from 'react'
import PayResultClient from './PayResultClient'

export default function PayResultPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-16">
      <Suspense
        fallback={
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-warm-ink">支付结果</h1>
            <p className="mt-4 text-sm text-stone-700">正在确认支付状态...</p>
          </div>
        }
      >
        <PayResultClient />
      </Suspense>
    </main>
  )
}
