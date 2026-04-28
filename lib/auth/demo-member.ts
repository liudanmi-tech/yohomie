import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'

/** 未登录用户通过会员开通流程写入的会员到期时间（HttpOnly Cookie，不落库） */
export const DEMO_MEMBER_COOKIE = 'yh_demo_member'

export async function getDemoMemberExpiresAt(): Promise<Date | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(DEMO_MEMBER_COOKIE)?.value
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime()) || d <= new Date()) return null
  return d
}

export function setDemoMemberCookieOnResponse(res: NextResponse, expiresAt: Date) {
  res.cookies.set(DEMO_MEMBER_COOKIE, expiresAt.toISOString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}
