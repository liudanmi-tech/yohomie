import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/auth/rate-limit'
import { createSession, setSessionCookie } from '@/lib/auth/session'
import { emailSchema, passwordSchema } from '@/lib/auth/validators'

const bodySchema = z.object({
  email: z.string(),
  password: z.string(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const limit = checkRateLimit(`login-password:${ip}`, 20, 10 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: '请求过于频繁，请稍后再试' }, { status: 429 })
  }

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ ok: false, message: '参数错误' }, { status: 400 })

  const emailCheck = emailSchema.safeParse(parsed.data.email)
  if (!emailCheck.success) return NextResponse.json({ ok: false, message: emailCheck.error.issues[0].message }, { status: 400 })
  const pwdCheck = passwordSchema.safeParse(parsed.data.password)
  if (!pwdCheck.success) return NextResponse.json({ ok: false, message: pwdCheck.error.issues[0].message }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user?.passwordHash) {
    return NextResponse.json({ ok: false, message: '账号或密码错误' }, { status: 400 })
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ ok: false, message: '账号或密码错误' }, { status: 400 })
  }

  const session = await createSession(
    user.id,
    ip,
    req.headers.get('user-agent') ?? undefined,
  )
  await setSessionCookie(session.token, session.expiresAt)

  return NextResponse.json({ ok: true })
}
