import { NextRequest, NextResponse } from 'next/server'
import { VerifyChannel, VerifyPurpose } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { randomNumericCode, sha256 } from '@/lib/auth/crypto'
import { checkRateLimit } from '@/lib/auth/rate-limit'
import { emailSchema, phoneSchema } from '@/lib/auth/validators'
import { sendEmailCode, sendSmsCode } from '@/lib/services/aliyun'

const bodySchema = z.object({
  channel: z.enum(['phone', 'email']),
  purpose: z.enum(['login', 'register']),
  target: z.string(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const limit = checkRateLimit(`send-code:${ip}`, 15, 10 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: '请求过于频繁，请稍后再试' }, { status: 429 })
  }

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: '参数错误' }, { status: 400 })
  }

  const { channel, purpose, target } = parsed.data

  if (channel === 'phone') {
    const p = phoneSchema.safeParse(target)
    if (!p.success) return NextResponse.json({ ok: false, message: p.error.issues[0].message }, { status: 400 })
  } else {
    const e = emailSchema.safeParse(target)
    if (!e.success) return NextResponse.json({ ok: false, message: e.error.issues[0].message }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: channel === 'phone' ? { phone: target } : { email: target },
  })

  if (purpose === 'login' && !user) {
    return NextResponse.json({ ok: false, message: '账号不存在，请先注册' }, { status: 400 })
  }
  if (purpose === 'register' && user) {
    return NextResponse.json({ ok: false, message: '账号已注册，请直接登录' }, { status: 400 })
  }

  const code = randomNumericCode(6)
  const codeHash = sha256(`${target}:${code}`)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  await prisma.verificationCode.create({
    data: {
      target,
      channel: channel as VerifyChannel,
      purpose: purpose as VerifyPurpose,
      codeHash,
      expiresAt,
      requestedIp: ip,
    },
  })

  if (channel === 'phone') {
    await sendSmsCode({ target, code })
  } else {
    await sendEmailCode({ target, code })
  }

  return NextResponse.json({ ok: true, message: '验证码已发送' })
}
