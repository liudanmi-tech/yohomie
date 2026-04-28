'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}

function normalizeLoginError(message: string): string {
  if (message.includes('验证码无效或已过期') || message.includes('已过期')) {
    return '验证码已过期，请重新获取'
  }
  if (message.includes('验证码错误') || message.includes('校验失败')) {
    return '验证码校验失败，请检查后重试'
  }
  return message
}

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

export default function LoginPage() {
  const router = useRouter()
  const [redirect, setRedirect] = useState('/')

  useEffect(() => {
    const nextRedirect = new URLSearchParams(window.location.search).get('redirect')
    setRedirect(nextRedirect || '/')
  }, [])

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [agreed, setAgreed] = useState(true)

  const emailCount = useCountdown()

  async function sendCode() {
    if (!email) {
      setMsg('请先填写邮箱')
      return
    }
    if (!isValidEmail(email)) {
      setMsg('邮箱格式不正确，请检查后重试')
      return
    }
    setLoading(true)
    setMsg('')
    try {
      const resp = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', purpose: 'login', target: email }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(normalizeLoginError(data.message || '发送失败'))
      setMsg('验证码已发送，请注意查收')
      emailCount.start()
    } catch (err) {
      const message = err instanceof Error ? err.message : '发送失败'
      setMsg(normalizeLoginError(message))
    } finally {
      setLoading(false)
    }
  }

  async function loginByCode() {
    if (!agreed) {
      setMsg('请先阅读并同意《用户服务协议》和《隐私政策》')
      return
    }
    if (!isValidEmail(email)) {
      setMsg('邮箱格式不正确，请检查后重试')
      return
    }
    setLoading(true)
    setMsg('')
    try {
      const resp = await fetch('/api/auth/verify-code-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', target: email, code }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(normalizeLoginError(data.message || '登录失败'))
      router.push(redirect)
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败'
      setMsg(normalizeLoginError(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 py-12 md:px-0">
      <div className="rounded-3xl border border-stone-200 bg-white/80 p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-semibold text-warm-ink">账号登录</h1>
        <p className="mt-2 text-sm text-stone-500">登录后即可继续订阅购买流程</p>

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
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="验证码"
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={loading || emailCount.seconds > 0}
              onClick={() => void sendCode()}
              className="rounded-xl border border-stone-200 px-3 py-2 text-sm disabled:opacity-50"
            >
              {emailCount.seconds > 0 ? `${emailCount.seconds}s` : '发送验证码'}
            </button>
          </div>
          <button
            type="button"
            disabled={loading || !agreed}
            onClick={() => void loginByCode()}
            className="w-full rounded-xl bg-sage-dark py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            验证码登录
          </button>
        </div>

        <label className="mt-5 flex items-start gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-stone-300 text-sage focus:ring-sage"
          />
          <span>
            我已阅读并同意
            <Link href="/terms" className="mx-1 text-sage-dark underline-offset-2 hover:underline">
              《用户服务协议》
            </Link>
            和
            <Link href="/privacy" className="ml-1 text-sage-dark underline-offset-2 hover:underline">
              《隐私政策》
            </Link>
            。
          </span>
        </label>

        {msg ? <p className="mt-4 text-sm text-stone-600">{msg}</p> : null}

      </div>
    </main>
  )
}
