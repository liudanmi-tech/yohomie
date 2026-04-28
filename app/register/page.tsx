'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function useCountdown(initial = 60) {
  const [seconds, setSeconds] = useState(0)
  const start = () => {
    if (seconds > 0) return
    setSeconds(initial)
    const timer = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  return { seconds, start }
}

export default function RegisterPage() {
  const router = useRouter()
  const [redirect, setRedirect] = useState('/')

  useEffect(() => {
    const nextRedirect = new URLSearchParams(window.location.search).get('redirect')
    setRedirect(nextRedirect || '/')
  }, [])

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const count = useCountdown()

  async function sendCode() {
    if (!email) {
      setMsg('请先填写邮箱')
      return
    }
    setLoading(true)
    setMsg('')
    try {
      const resp = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'email',
          purpose: 'register',
          target: email,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || '发送失败')
      setMsg('验证码已发送，请注意查收')
      count.start()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '发送失败')
    } finally {
      setLoading(false)
    }
  }

  async function submitRegister() {
    setLoading(true)
    setMsg('')
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', target: email, code, password }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || '注册失败')
      router.push(redirect)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 py-12 md:px-0">
      <div className="rounded-3xl border border-stone-200 bg-white/80 p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-semibold text-warm-ink">注册账号</h1>
        <p className="mt-2 text-sm text-stone-500">注册后即可继续订阅购买流程</p>

        <div className="mt-6 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="邮箱"
            className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="验证码" className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm" />
            <button disabled={loading || count.seconds > 0} onClick={sendCode} className="rounded-xl border border-stone-200 px-3 py-2 text-sm disabled:opacity-50">{count.seconds > 0 ? `${count.seconds}s` : '发送验证码'}</button>
          </div>
          <input value={password} type="password" onChange={(e) => setPassword(e.target.value)} placeholder="设置登录密码（至少8位）" className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
          <button disabled={loading} onClick={submitRegister} className="w-full rounded-xl bg-sage-dark py-2.5 text-sm font-medium text-white disabled:opacity-50">注册并登录</button>
        </div>

        {msg ? <p className="mt-4 text-sm text-stone-600">{msg}</p> : null}

        <p className="mt-6 text-sm text-stone-500">
          已有账号？
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="ml-1 text-sage-dark underline-offset-2 hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </main>
  )
}
