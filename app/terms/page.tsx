import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '用户服务协议 - YoHomie',
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[860px] px-5 pb-16 pt-8 text-warm-ink">
      <h1 className="text-[28px] font-semibold leading-tight">YoHomie 用户服务协议</h1>
      <p className="mt-2 text-[13px] text-stone-500">
        运营主体：北京有厚米科技有限公司 | 生效日期：2026年4月1日
      </p>

      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
        <p>
          欢迎使用 YoHomie。您在使用本服务前，应当完整阅读并理解本协议。继续使用即表示您同意本协议约束。
        </p>
      </div>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">一、服务说明</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        YoHomie 为创意记事与多维度信息管理服务，提供心情记录、记录回顾、视觉记录等功能。
      </p>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">二、有偿信息服务内容与收费标准</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-stone-600">
        <li>有偿在线浏览内容：在线图文资讯、心理健康科普专栏、职场与家庭关系深度研究报告。</li>
        <li>收费方式：会员订阅制，按开通周期计费。</li>
        <li>收费标准：月度会员 29 元/月；年度会员 268 元/年。</li>
        <li>未开通会员用户仅可浏览公开介绍信息，无法浏览会员专区完整内容。</li>
      </ul>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">三、账户与使用规范</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-stone-600">
        <li>您应保证注册信息真实、合法、有效。</li>
        <li>不得利用本服务发布违法违规信息或侵害他人合法权益。</li>
        <li>不得恶意攻击、抓取、干扰平台正常运行。</li>
      </ul>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">四、订阅与退款政策</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-stone-600">
        <li>页面展示的订阅方案为服务权益说明，最终以支付页公示信息为准。</li>
        <li>若因平台系统故障造成重复扣费或无法开通，用户可联系官方客服核验并处理退款。</li>
        <li>
          已实际消耗的服务时长或已使用的数字权益，可能不支持无条件退款，具体以适用法律法规与客服核验结果为准。
        </li>
      </ul>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">五、免责与风险提示</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        YoHomie 仅作为个人记录与信息管理辅助工具，不提供医疗诊断或治疗服务。
      </p>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">六、用户注销</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        您有权随时申请注销账号。账号注销后，我们将依据适用法律法规及平台规则处理您的账户信息与相关数据。
        如您需要注销账号，可通过本协议公示的客服渠道联系我们进行处理。
      </p>

      <h2 className="mt-7 text-lg font-semibold text-warm-ink">七、联系我们</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        联系邮箱：1215799313@qq.com
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
