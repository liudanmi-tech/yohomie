import Link from 'next/link'
import { getAuthedUser } from '@/lib/auth/session'
import { getDemoMemberExpiresAt } from '@/lib/auth/demo-member'

const CATALOG_ITEMS = [
  {
    title: '《2026职场沟通与边界感实操指南》',
    preview:
      '围绕高频职场场景，拆解表达边界、任务协作与反馈沟通的实用步骤。',
    fullText:
      '本专题通过典型职场沟通案例，按“场景识别-表达结构-边界确认-复盘优化”四步展开，帮助用户在会议沟通、跨部门协作与向上汇报中建立稳定的沟通框架。',
  },
  {
    title: '《家庭关系中的非暴力沟通深度专栏》',
    preview:
      '以家庭常见矛盾为切口，讲解如何进行低冲突、高理解的表达。',
    fullText:
      '本专栏聚焦家庭关系中的情绪表达与冲突缓和，结合真实互动场景，提供“观察-感受-需求-请求”的分步表达模板，帮助建立更稳定的沟通习惯。',
  },
  {
    title: '《情绪觉察与压力排解图文百科》',
    preview:
      '整理常见压力来源与调节方式，便于在线查阅与日常实践。',
    fullText:
      '该图文百科将压力来源按工作、家庭、社交三类归纳，配套可执行的自我调节方法与使用时机建议，便于用户快速定位并应用到日常生活。',
  },
  {
    title: '《高压工作节奏下的情绪恢复专栏》',
    preview:
      '围绕“高压-恢复-复盘”节奏，提供可直接参考的在线图文内容。',
    fullText:
      '本专栏通过常见工作周期示例，说明如何在高压阶段保持信息处理效率，并在恢复阶段完成情绪回稳与行动复盘，形成稳定的个人节奏。',
  },
  {
    title: '《亲密关系中的沟通误区与修复路径》',
    preview:
      '总结关系沟通中的高频误区，给出可执行的修复思路与表达模板。',
    fullText:
      '该专题聚焦亲密关系中的沟通误区识别，提供“问题定位-表达优化-反馈确认”的图文路径，帮助用户在冲突场景中更快完成关系修复。',
  },
] as const

export default async function MemberPage() {
  const user = await getAuthedUser()
  const demoExpires = await getDemoMemberExpiresAt()
  const userMember = !!user?.memberExpiresAt && user.memberExpiresAt > new Date()
  const demoMember = !!demoExpires && demoExpires > new Date()
  const isMember = userMember || demoMember

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10 md:px-8">
      <h1 className="text-3xl font-semibold text-warm-ink">会员专栏</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        本页面面向所有上网用户展示有偿资讯目录。开通会员后可在线浏览全文内容。
      </p>

      {!user && !isMember ? (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-700 shadow-sm">
          当前未登录，可先浏览目录。登录并完成会员订阅后可解锁全文在线阅读权限。
        </div>
      ) : !user && isMember ? (
        <div className="mt-6 rounded-2xl border border-sage/30 bg-sage/5 p-4 text-sm text-stone-700 shadow-sm">
          您已完成会员支付确认，当前可浏览全文。登录账号后，会员权益可与账号绑定并长期保留。
        </div>
      ) : user && !isMember ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm">
          <p className="text-sm text-amber-900">
            当前账号尚未开通会员，需完成订阅后方可浏览本专区完整内容。
          </p>
          <Link
            href="/#pricing"
            className="mt-4 inline-flex rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white"
          >
            查看收费标准并开通
          </Link>
        </div>
      ) : null}

      <section className="mt-8 grid gap-4">
        {CATALOG_ITEMS.map((item) => (
          <article key={item.title} className="rounded-2xl border border-stone-200 bg-white/80 p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-warm-ink">{item.title}</h2>
              <span className="w-fit rounded-full bg-sage/10 px-3 py-1 text-xs text-sage-dark">
                付费会员可在线浏览全文
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.preview}</p>
            {isMember ? (
              <p className="mt-4 rounded-xl border border-stone-200/80 bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-700">
                {item.fullText}
              </p>
            ) : (
              <div className="mt-4 rounded-xl border border-stone-200/80 bg-stone-50 px-4 py-3">
                <p className="select-none blur-[2px] text-sm leading-relaxed text-stone-500">
                  {item.fullText}
                </p>
              </div>
            )}

            {isMember ? (
              <span className="mt-4 inline-flex rounded-full border border-sage/50 bg-sage/10 px-3 py-1 text-xs text-sage-dark">
                已解锁全文在线阅读
              </span>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  )
}
