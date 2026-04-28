import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sha256 } from '@/lib/auth/crypto'
import { createSession, setSessionCookie } from '@/lib/auth/session'
import { emailSchema, passwordSchema, phoneSchema } from '@/lib/auth/validators'

const bodySchema = z.object({
  channel: z.enum(['phone', 'email']),
  target: z.string(),
  code: z.string().regex(/^\d{6}$/),
  password: z.string(),
})

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: '参数错误' }, { status: 400 })
  }

  const { channel, target, code, password } = parsed.data

  if (channel === 'phone') {
    const p = phoneSchema.safeParse(target)
    if (!p.success) return NextResponse.json({ ok: false, message: p.error.issues[0].message }, { status: 400 })
  } else {
    const e = emailSchema.safeParse(target)
    if (!e.success) return NextResponse.json({ ok: false, message: e.error.issues[0].message }, { status: 400 })
  }

  const pwd = passwordSchema.safeParse(password)
  if (!pwd.success) {
    return NextResponse.json({ ok: false, message: pwd.error.issues[0].message }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({
    where: channel === 'phone' ? { phone: target } : { email: target },
  })
  if (existing) {
    return NextResponse.json({ ok: false, message: '账号已注册，请直接登录' }, { status: 400 })
  }

  const now = new Date()
  const record = await prisma.verificationCode.findFirst({
    where: {
      target,
      channel,
      purpose: 'register',
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record || record.codeHash !== sha256(`${target}:${code}`)) {
    return NextResponse.json({ ok: false, message: '验证码无效或已过期' }, { status: 400 })
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { usedAt: now },
  })

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data:
      channel === 'phone'
        ? { phone: target, passwordHash }
        : { email: target, passwordHash },
  })

  const session = await createSession(
    user.id,
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown',
    req.headers.get('user-agent') ?? undefined,
  )
  await setSessionCookie(session.token, session.expiresAt)

  return NextResponse.json({ ok: true })
}
