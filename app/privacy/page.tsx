import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '隐私政策 - YoHomie',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[860px] px-5 pb-16 pt-8 text-warm-ink">
      <h1 className="text-[28px] font-semibold leading-tight">YoHomie 隐私政策</h1>
      <p className="mt-2 text-[13px] text-stone-500">
        个人信息处理者：北京有厚米科技有限公司 | 生效日期：2026年4月1日
      </p>

      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
        <p>我们重视您的个人信息与隐私安全。本政策说明我们如何收集、使用、存储和保护您的个人信息。</p>
      </div>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">一、我们收集的信息</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-stone-600">
        <li>您主动提交的记录内容与基础账户信息。</li>
        <li>收集电子邮箱信息，用于登录验证码发送与登录身份验证。</li>
        <li>收集支付交易信息（如订单号、交易状态、支付时间、支付金额），用于订阅会员服务开通与售后核验。</li>
        <li>设备与日志信息（如设备型号、操作系统、访问时间）用于安全保障与故障排查。</li>
      </ul>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">二、我们如何使用信息</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        用于提供服务、改进体验、保障账户与系统安全，并在法律法规允许范围内处理。
      </p>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">三、数据安全保护条款</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-stone-600">
        <li>采用访问控制、传输加密、日志审计等措施保护信息安全。</li>
        <li>仅授权必要人员在必要范围内访问数据。</li>
        <li>如发生安全事件，我们将依法及时告知并采取补救措施。</li>
      </ul>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">四、用户权利</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        您可依法申请查阅、更正、删除个人信息，或撤回同意。可通过下方联系方式提交请求。
      </p>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">五、订阅与退款说明（隐私相关）</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        退款处理过程中仅收集核验所需最小信息，且仅用于订单核验与售后处理。
      </p>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">六、联系我们</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        隐私邮箱：1215799313@qq.com
        <br />
        客服电话：15010479668
        <br />
        联系地址：北京市通州区潞城镇武兴路78号甲601室
      </p>

      <p className="mt-6 text-[13px] text-stone-500">备案号：京ICP备2026017788号</p>
      <p className="mt-4">
        <Link href="/" className="text-sage-dark underline-offset-2 hover:underline">
          返回首页
        </Link>
      </p>
    </main>
  )
}
