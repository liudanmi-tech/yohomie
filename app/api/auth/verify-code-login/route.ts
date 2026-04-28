import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sha256 } from '@/lib/auth/crypto'
import { checkRateLimit } from '@/lib/auth/rate-limit'
import { createSession, setSessionCookie } from '@/lib/auth/session'

const bodySchema = z.object({
  channel: z.enum(['phone', 'email']),
  target: z.string(),
  code: z.string().regex(/^\d{6}$/),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const limit = checkRateLimit(`verify-code:${ip}`, 30, 10 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: '验证过于频繁，请稍后再试' }, { status: 429 })
  }

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: '参数错误' }, { status: 400 })
  }

  const { channel, target, code } = parsed.data
  const now = new Date()

  const record = await prisma.verificationCode.findFirst({
    where: {
      target,
      channel,
      purpose: 'login',
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) {
    return NextResponse.json({ ok: false, message: '验证码无效或已过期' }, { status: 400 })
  }

  const expected = sha256(`${target}:${code}`)
  if (record.codeHash !== expected) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    })
    return NextResponse.json({ ok: false, message: '验证码错误' }, { status: 400 })
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { usedAt: now },
  })

  const user = await prisma.user.findFirst({
    where: channel === 'phone' ? { phone: target } : { email: target },
  })

  if (!user) {
    return NextResponse.json({ ok: false, message: '账号不存在' }, { status: 400 })
  }

  const session = await createSession(
    user.id,
    ip,
    req.headers.get('user-agent') ?? undefined,
  )
  await setSessionCookie(session.token, session.expiresAt)

  return NextResponse.json({ ok: true })
}
