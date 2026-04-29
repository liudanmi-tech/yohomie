'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type SessionUser = {
  id: string
  phone: string | null
  email: string | null
  memberExpiresAt?: string | null
  isMember?: boolean
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

function accountDisplayLabel(u: SessionUser): string {
  if (u.phone) return maskPhone(u.phone)
  if (u.email) return u.email
  return `用户 ${u.id.slice(0, 8)}…`
}

type SessionApiResponse = {
  user?: SessionUser | null
  demoMemberExpiresAt?: string | null
}

function isDemoMemberActive(iso: string | null | undefined): boolean {
  if (!iso) return false
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && d > new Date()
}

type CreatePayResponse = {
  ok?: boolean
  message?: string
  pageRedirectionData?: string
  payUrl?: string
  qrCode?: string | null
}

/**
 * YoHomie — 企业官网单页（ICP 展示用）
 *
 * 修改说明：
 * - 公司全称、备案号、协议链接等集中在下方常量，便于后续替换。
 */

// ========== 公司 / 备案 / 法务（请按需修改）==========
/** 营业执照上的公司全称 */
const COMPANY_FULL_NAME = '北京有厚米科技有限公司'

/** 产品英文名 */
const APP_NAME_EN = 'YoHomie'

/**
 * ICP 备案号（与工信部公示一致）。
 */
const ICP_RECORD_NUMBER = '京ICP备2026017788号'

/** 用户协议 */
const URL_USER_AGREEMENT = '/terms'

/** 隐私政策 */
const URL_PRIVACY_POLICY = '/privacy'

// ========== 页面文案 ==========
/** 产品整体定性（对外表述） */
const PRODUCT_POSITIONING = '在线图文资讯与深度专题报告服务平台'

const SLOGAN = '在线图文资讯与深度专题服务'

function IconSpark() {
  return (
    <svg
      className="h-8 w-8 text-sage"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
      />
    </svg>
  )
}

function IconWave() {
  return (
    <svg
      className="h-8 w-8 text-sage"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
      />
    </svg>
  )
}

function IconTrend() {
  return (
    <svg
      className="h-8 w-8 text-sage"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  )
}

function IconUserCircle() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  )
}

const FEATURES = [
  {
    title: '在线图文资讯专栏',
    desc: '围绕情绪管理、压力调节与关系沟通，持续更新可在线阅读的图文内容。',
    icon: IconSpark,
  },
  {
    title: '心情调整专栏',
    desc: '以通俗语言整理心理健康常识与典型场景，帮助读者快速理解核心要点。',
    icon: IconWave,
  },
  {
    title: '深度研究报告',
    desc: '聚焦职场与家庭关系主题，提供结构化图文解读与案例观察。',
    icon: IconTrend,
  },
] as const

const PRICING_PLANS = [
  {
    name: '月度会员',
    price: '￥29',
    period: '/月',
    tag: '按月订阅',
    highlight: true,
    benefits: [
      '解锁《职场与家庭关系》系列所有专栏文章',
      '在线阅读深度分析报告',
      '会员专区图文内容持续更新',
    ],
  },
  {
    name: '年度会员',
    price: '￥268',
    period: '/年',
    tag: '按年订阅',
    highlight: false,
    benefits: [
      '解锁《职场与家庭关系》系列所有专栏文章',
      '在线阅读深度分析报告',
      '会员专区图文内容持续更新',
      '全年权益更优惠',
    ],
  },
] as const

type PricingPlan = (typeof PRICING_PLANS)[number]
const SKILLS = [
  {
    title: '职场情绪管理案例专栏',
    desc: '聚焦常见职场沟通场景，拆解边界感建立与冲突缓和的可行路径。',
    icon: IconTrend,
  },
  {
    title: '情绪觉察图文百科',
    desc: '用图文方式整理常见情绪信号与压力来源，方便在线快速检索。',
    icon: IconSpark,
  },
  {
    title: '关系沟通专题专栏',
    desc: '围绕表达方式与沟通步骤，提供易理解、可复用的专题内容。',
    icon: IconWave,
  },
  {
    title: '家庭关系深度研究报告',
    desc: '从真实案例切入，解读家庭关系中的常见矛盾与应对思路。',
    icon: IconTrend,
  },
] as const

const SKILL_BG_MAP: Record<string, string> = {
  职场情绪管理案例专栏: '/skills/skill-workplace-001.png',
  情绪觉察图文百科: '/skills/skill-mood-001.png',
  关系沟通专题专栏: '/skills/skill-eq-001.png',
  家庭关系深度研究报告: '/skills/skill-family-001.png',
}

const CONTENT_CATALOG = [
  '《2026职场沟通与边界感实操指南》',
  '《家庭关系中的非暴力沟通深度专栏》',
  '《情绪觉察与压力排解图文百科》',
] as const

const SERVICE_FLOW_STEPS = [
  {
    title: '选择计划',
    desc: '根据需求选择月度或年度会员订阅方案',
  },
  {
    title: '在线支付',
    desc: '支持支付宝在线支付，支付流程由主流支付平台担保',
  },
  {
    title: '即刻阅读',
    desc: '权限自动开通，全站有偿图文资讯专栏即刻在线浏览',
  },
] as const

function App() {
  const [isPayRedirecting, setIsPayRedirecting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [demoMemberExpiresAt, setDemoMemberExpiresAt] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const refreshSession = useCallback(async () => {
    try {
      const resp = await fetch('/api/auth/session', {
        cache: 'no-store',
        credentials: 'include',
      })
      if (resp.ok) {
        const data = (await resp.json()) as SessionApiResponse
        setSessionUser(data.user ?? null)
        setDemoMemberExpiresAt(data.demoMemberExpiresAt ?? null)
      } else {
        setSessionUser(null)
        setDemoMemberExpiresAt(null)
      }
    } catch {
      setSessionUser(null)
      setDemoMemberExpiresAt(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const resp = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'include',
        })
        if (cancelled) return
        if (resp.ok) {
          const data = (await resp.json()) as SessionApiResponse
          setSessionUser(data.user ?? null)
          setDemoMemberExpiresAt(data.demoMemberExpiresAt ?? null)
        } else {
          setSessionUser(null)
          setDemoMemberExpiresAt(null)
        }
      } catch {
        if (!cancelled) {
          setSessionUser(null)
          setDemoMemberExpiresAt(null)
        }
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onFocus = () => {
      void refreshSession()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshSession])

  useEffect(() => {
    if (!userMenuOpen) return
    const onDocDown = (e: MouseEvent) => {
      const el = userMenuRef.current
      if (el && !el.contains(e.target as Node)) setUserMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenuOpen])

  const handleLogout = async () => {
    try {
      const resp = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      if (resp.ok) {
        setSessionUser(null)
        setUserMenuOpen(false)
        void refreshSession()
      } else {
        setToastMessage('退出失败，请重试')
        window.setTimeout(() => setToastMessage(''), 3200)
      }
    } catch {
      setToastMessage('退出失败，请重试')
      window.setTimeout(() => setToastMessage(''), 3200)
    }
  }

  const fetchAlipayPayUrl = useCallback(async (plan: PricingPlan): Promise<string | null> => {
    const planType = plan.period === '/年' ? 'year' : 'month'
    const amount = planType === 'year' ? '268.00' : '29.00'
    const createResp = await fetch('/api/pay/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ planType, amount }),
    })
    const createData = (await createResp.json().catch(() => ({}))) as CreatePayResponse
    if (!createResp.ok || !createData.payUrl) {
      const msg = createData.message || '创建支付订单失败，请稍后重试'
      setToastMessage(msg)
      window.setTimeout(() => setToastMessage(''), 4200)
      return null
    }
    return createData.payUrl
  }, [])

  const handleSubscribe = useCallback(
    async (plan: PricingPlan) => {
      if (isPayRedirecting) return
      if (sessionUser?.isMember || isDemoMemberActive(demoMemberExpiresAt)) {
        setToastMessage('你已是会员用户，无需重复订阅')
        window.setTimeout(() => setToastMessage(''), 4200)
        return
      }

      setIsPayRedirecting(true)
      try {
        const payUrl = await fetchAlipayPayUrl(plan)
        if (!payUrl) return
        window.location.assign(payUrl)
      } catch {
        setToastMessage('会员开通失败，请稍后重试')
        window.setTimeout(() => setToastMessage(''), 4200)
      } finally {
        setIsPayRedirecting(false)
      }
    },
    [demoMemberExpiresAt, fetchAlipayPayUrl, isPayRedirecting, sessionUser],
  )

  return (
    <div className="flex min-h-screen flex-col text-warm-ink">
      {/* 顶栏：极简导航 */}
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-cream/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <a href="#" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sage/10">
              <span className="h-4 w-4 rounded-full border-2 border-sage/60" />
            </span>
            <span className="text-sm font-medium tracking-wide text-sage-dark">
              {APP_NAME_EN}
              <span className="ml-2 text-xs font-normal text-stone-500">
                {COMPANY_FULL_NAME}
              </span>
            </span>
          </a>

          <nav
            className="hidden items-center gap-7 text-sm text-stone-600 md:flex"
            aria-label="页面内导航"
          >
            <a href="#banner" className="transition hover:text-sage-dark">
              首页
            </a>
            <a href="#features" className="transition hover:text-sage-dark">
              功能介绍
            </a>
            <a href="#skills" className="transition hover:text-sage-dark">
              技能介绍
            </a>
            <a href="#pricing" className="transition hover:text-sage-dark">
              订阅价格
            </a>
            <a href="#about" className="transition hover:text-sage-dark">
              关于我们
            </a>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {authLoading ? (
              <div
                className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-stone-200/50 md:w-32"
                aria-hidden
              />
            ) : sessionUser ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="账户菜单"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white/90 text-sage-dark shadow-sm transition hover:bg-white md:h-10 md:w-10"
                >
                  <span className="sr-only">已登录，打开账户菜单</span>
                  <IconUserCircle />
                </button>
                {userMenuOpen ? (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 z-[60] mt-2 w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-stone-200/80 bg-white/95 py-2 shadow-lg backdrop-blur-md"
                  >
                    <div className="border-b border-stone-200/70 px-4 pb-3 pt-1">
                      <p className="text-xs font-medium text-stone-500">当前账号</p>
                      <div className="mt-1 flex items-start justify-between gap-2">
                        <p
                          className="break-all text-sm font-medium text-warm-ink"
                          title={accountDisplayLabel(sessionUser)}
                        >
                          {accountDisplayLabel(sessionUser)}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                            sessionUser.isMember || isDemoMemberActive(demoMemberExpiresAt)
                              ? 'bg-sage/15 text-sage-dark'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {sessionUser.isMember || isDemoMemberActive(demoMemberExpiresAt)
                            ? '会员用户'
                            : '普通用户'}
                        </span>
                      </div>
                    </div>
                    <div className="px-2 pt-2">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleLogout()}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <a
              href="/member"
              className="rounded-full border border-stone-200/80 bg-white/70 px-4 py-2 text-sm text-stone-700 shadow-sm transition hover:bg-white"
            >
              会员专栏
            </a>
            <a
              href="#features"
              className="rounded-full border border-stone-200/80 bg-white/70 px-4 py-2 text-sm text-stone-700 shadow-sm transition hover:bg-white"
            >
              浏览内容
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 顶部 Banner */}
        <section
          id="banner"
          className="relative mx-auto max-w-6xl overflow-hidden px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20"
          aria-labelledby="hero-heading"
        >
          {/* 禅意装饰（不影响布局）：圆相 + 轻雾山峦 */}
          <img
            src="/zen-enso.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 -top-28 h-[380px] w-[380px] select-none opacity-70 blur-[0.2px] md:h-[520px] md:w-[520px]"
          />
          <img
            src="/zen-mountain.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 left-1/2 w-[900px] -translate-x-1/2 select-none opacity-55 md:-bottom-28"
          />

          <div className="relative overflow-hidden rounded-[28px] border border-stone-200/70 bg-stone-950/10 px-6 py-10 text-white shadow-lg md:px-10 md:py-14">
            {/* Banner 背景图（你用 Gemini 生成的 banner.png） */}
            <img
              src="/banner.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover grayscale-[35%]"
            />
            {/* 黑色蒙层：调浅以便看清背景图 */}
            <div
              className="pointer-events-none absolute inset-0 bg-stone-950/58"
              aria-hidden="true"
            />
            {/* 轻微渐变，增强文字可读性（仍可看到图） */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-stone-950/35 via-stone-950/10 to-transparent"
              aria-hidden="true"
            />

            <div className="relative">
            <div className="grid items-center gap-10 md:gap-14">
              <div className="max-w-2xl">
                <p className="text-xs font-medium tracking-[0.2em] text-white/70">
                  心情记录 · 情绪疗愈
                </p>
                <h1 id="hero-heading" className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                  {APP_NAME_EN}
                </h1>
                <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
                  {SLOGAN}
                </p>
                <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/55">
                  {PRODUCT_POSITIONING}
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
                  聚焦在线图文资讯、心情调整专栏与职场家庭关系深度研究报告，面向全网用户开放浏览与订阅。
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="#features"
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-stone-900 shadow-sm transition hover:bg-white/90"
                  >
                    查看专栏
                  </a>
                </div>

                <div className="mt-10 flex flex-wrap gap-2 text-xs text-white/60">
                  {['更温柔的记录方式', '更清晰的情绪洞察', '更可靠的合规展示'].map((t) => (
                    <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* 功能介绍 */}
        <section
          id="features"
          className="relative border-t border-stone-200/60 bg-white/40 py-20 md:py-24"
          aria-labelledby="features-heading"
        >
          {/* 禅意装饰：淡莲意纹样（背景） */}
          <img
            src="/zen-lotus.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -left-44 top-10 h-[420px] w-[560px] rotate-6 select-none opacity-40 md:opacity-45"
          />
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <h2
              id="features-heading"
              className="text-2xl font-medium text-warm-ink md:text-3xl"
            >
              功能介绍
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
              聚焦在线图文资讯、心情调整专栏与职场家庭关系深度研究报告。
            </p>

            <ul className="mt-12 grid gap-6 md:grid-cols-2">
                {FEATURES.map(({ title, desc, icon: Icon }) => (
                  <li
                    key={title}
                    className="group rounded-2xl border border-stone-200/80 bg-white/65 p-7 shadow-sm backdrop-blur-sm transition hover:border-sage/35 hover:shadow-md"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sage/10 transition group-hover:bg-sage/15">
                      <Icon />
                    </div>
                    <h3 className="text-lg font-medium text-warm-ink">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-stone-600">
                      {desc}
                    </p>
                    <div className="mt-5 h-px w-10 bg-gradient-to-r from-sage/70 to-transparent opacity-60" />
                    <p className="mt-4 text-xs text-stone-500">
                      适用于日常记录与自我复盘
                    </p>
                  </li>
                ))}
              </ul>
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm leading-relaxed text-amber-900">
              <p className="font-medium">【重要声明】</p>
              <p className="mt-1">
                本站提供在线图文资讯与专题报告阅读服务，内容仅供信息参考与学习交流使用。
              </p>
            </div>
          </div>
        </section>

        {/* 技能介绍 */}
        <section
          id="skills"
          className="relative border-t border-stone-200/60 py-20 md:py-24"
          aria-labelledby="skills-heading"
        >
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2
                  id="skills-heading"
                  className="text-2xl font-medium text-warm-ink md:text-3xl"
                >
                  技能介绍
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
                  围绕「情绪觉察—沟通表达—关系修复」打造的能力组合，用更温和的方式提供建议与训练。
                </p>
              </div>
            </div>

            <ul className="mt-12 grid gap-6 md:grid-cols-2">
              {SKILLS.map(({ title, desc, icon: Icon }) => (
                <li
                  key={title}
                  className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white/65 p-7 shadow-sm backdrop-blur-sm transition hover:border-sage/35 hover:shadow-md"
                >
                  {SKILL_BG_MAP[title] ? (
                    <>
                      <img
                        src={SKILL_BG_MAP[title]}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover grayscale-[35%]"
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-stone-950/58"
                        aria-hidden="true"
                      />
                    </>
                  ) : null}
                  <div className="flex items-start justify-between gap-6">
                    <div className="relative z-10">
                      <h3 className="text-lg font-medium text-white">
                        {title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/85">
                        {desc}
                      </p>
                    </div>
                    <div className="relative z-10 shrink-0 rounded-2xl bg-sage/10 p-3">
                      <Icon />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 订阅价格 */}
        <section
          id="pricing"
          className="relative border-t border-stone-200/60 bg-white/35 py-20 md:py-24"
          aria-labelledby="pricing-heading"
        >
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <h2
              id="pricing-heading"
              className="text-center text-2xl font-medium text-warm-ink md:text-3xl"
            >
              订阅价格
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-stone-500">
              本站所有有偿资讯均针对全网用户开放。收费标准如下，支持支付宝在线支付，付费后即刻解锁在线浏览权限。
            </p>
            <ul className="mt-12 grid gap-6 md:grid-cols-2">
              {/* 收费标准：月/年两档，按开通后会员权益在线浏览 */}
              {PRICING_PLANS.map((plan) => (
                <li
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border bg-white/70 p-8 shadow-sm backdrop-blur-sm ${
                    plan.highlight
                      ? 'border-sage/50 ring-2 ring-sage/20'
                      : 'border-stone-200/80'
                  }`}
                >
                  {plan.highlight ? (
                    <span className="absolute right-4 top-4 rounded-full bg-sage-dark px-2.5 py-0.5 text-[11px] font-medium text-white">
                      最优惠
                    </span>
                  ) : null}
                  <p className="text-sm font-medium text-stone-500">{plan.name}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="flex flex-wrap items-baseline gap-0.5">
                      <span className="text-3xl font-semibold tracking-tight text-warm-ink">
                        {plan.price}
                      </span>
                      <span className="text-base text-stone-500">{plan.period}</span>
                    </p>
                    <button
                      type="button"
                      disabled={isPayRedirecting}
                      onClick={() => void handleSubscribe(plan)}
                      className="shrink-0 rounded-full border border-sage/50 bg-sage-dark px-4 py-2 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-sage disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {isPayRedirecting ? '正在跳转…' : '订阅'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-sage-dark">{plan.tag}</p>
                  <div className="mt-6 border-t border-stone-200/80 pt-6">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      权益清单
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-stone-600">
                      {plan.benefits.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border border-stone-200/80 bg-cream/45 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-warm-ink">会员订阅与服务流程</h3>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {SERVICE_FLOW_STEPS.map((step, idx) => (
                  <div
                    key={step.title}
                    className="relative rounded-xl border border-stone-200/80 bg-white/80 px-4 py-4"
                  >
                    <div className="text-xs font-medium text-sage-dark">第 {idx + 1} 步</div>
                    <div className="mt-1 text-sm font-medium text-warm-ink">{step.title}</div>
                    <p className="mt-2 text-xs leading-relaxed text-stone-600">{step.desc}</p>
                    {idx < SERVICE_FLOW_STEPS.length - 1 ? (
                      <span
                        aria-hidden
                        className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-sage-dark/70"
                      >
                        →
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-stone-500">
                注：本站采用自动化权益发放系统，用户支付成功后，系统将自动解锁对应专栏的在线浏览权限，无需人工干预。
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-stone-200/80 bg-white/75 p-6 shadow-sm backdrop-blur-sm">
              <h3 className="text-lg font-medium text-warm-ink">有偿资讯目录</h3>
              <p className="mt-2 text-sm text-stone-500">
                以下内容面向全网用户展示目录，付费会员可在线浏览全文。
              </p>
              <ul className="mt-5 space-y-3">
                {CONTENT_CATALOG.map((title) => (
                  <li
                    key={title}
                    className="flex flex-col gap-2 rounded-xl border border-stone-200/80 bg-white/80 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <span className="text-sm text-stone-700">{title}</span>
                    <span className="shrink-0 rounded-full bg-sage/10 px-3 py-1 text-xs text-sage-dark">
                      付费会员可在线浏览全文
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 关于我们 */}
        <section
          id="about"
          className="relative py-20 md:py-24"
          aria-labelledby="about-heading"
        >
          {/* 禅意装饰：小圆相点缀（背景） */}
          <img
            src="/zen-enso.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 -top-32 h-[320px] w-[320px] select-none opacity-35 md:opacity-40"
          />
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
              <div className="md:col-span-5">
                <h2
                  id="about-heading"
                  className="text-2xl font-medium text-warm-ink md:text-3xl"
                >
                  关于我们
                </h2>
                <p className="mt-6 text-base leading-loose text-stone-600 md:text-lg">
                  {COMPANY_FULL_NAME} 致力于打造 {PRODUCT_POSITIONING}，帮助用户更好地记录生活、整理信息与回顾成长。我们相信，
                  科技可以成为温柔的陪伴者——帮助更多人养成自我觉察的习惯，在忙碌生活中保留一份对自己的关怀。
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-sm">
                  {['合规展示', '数据最小化', '温和体验'].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-stone-200/80 bg-white/70 px-4 py-2 text-stone-700 shadow-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-7">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200/80 bg-white/65 p-6 shadow-sm backdrop-blur-sm">
                    <div className="text-xs font-medium tracking-wide text-stone-500">
                      我们的理念
                    </div>
                    <div className="mt-3 text-sm leading-relaxed text-stone-700">
                      让记录回到日常，让疗愈更可持续。
                    </div>
                  </div>
                  <div className="rounded-2xl border border-stone-200/80 bg-white/65 p-6 shadow-sm backdrop-blur-sm">
                    <div className="text-xs font-medium tracking-wide text-stone-500">
                      我们的承诺
                    </div>
                    <div className="mt-3 text-sm leading-relaxed text-stone-700">
                      透明、克制、可解释地提供服务。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚：公司信息、备案号、协议链接 */}
      <footer className="border-t border-stone-200/80 bg-stone-100/75 py-12">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-sm font-medium text-warm-ink">
                {COMPANY_FULL_NAME}
              </p>
              {/* 备案号：备案下发后替换常量 ICP_RECORD_NUMBER */}
              <p className="mt-2 text-sm text-stone-500">{ICP_RECORD_NUMBER}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <a
                href={URL_USER_AGREEMENT}
                className="text-sage-dark underline-offset-4 hover:underline"
              >
                《YoHomie 用户服务协议》
              </a>
              <a
                href={URL_PRIVACY_POLICY}
                className="text-sage-dark underline-offset-4 hover:underline"
              >
                《YoHomie 隐私政策》
              </a>
            </div>
          </div>
          <div className="mt-8 h-px w-full bg-stone-200/70" aria-hidden />
          <p className="mt-6 text-center text-xs text-stone-500">
            © 2026 北京有厚米科技有限公司 版权所有
          </p>
          <p className="mt-2 text-center text-xs text-stone-500">
            <a
              href="https://beian.miit.gov.cn"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              {ICP_RECORD_NUMBER}
            </a>
          </p>
        </div>
      </footer>

      {isPayRedirecting ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/35 p-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-cream p-6 text-center shadow-2xl md:p-7">
            <p className="text-sm font-medium text-warm-ink">正在为你跳转支付宝收银台</p>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              如长时间未跳转，请检查网络后重试，或刷新页面再次点击「订阅」。
            </p>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2.5 text-sm text-white shadow-xl">
          {toastMessage}
        </div>
      ) : null}
    </div>
  )
}

export default App
