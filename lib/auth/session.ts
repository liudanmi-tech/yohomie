import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { randomToken, sha256 } from '@/lib/auth/crypto'

export const SESSION_COOKIE = 'yh_session'

function getSessionDays() {
  const raw = Number(process.env.SESSION_DAYS ?? 15)
  return Number.isFinite(raw) && raw > 0 ? raw : 15
}

export async function createSession(userId: string, ip?: string, userAgent?: string) {
  const token = randomToken(32)
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + getSessionDays() * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt, createdIp: ip, userAgent },
  })

  return { token, expiresAt }
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getAuthedUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const tokenHash = sha256(token)
  const now = new Date()
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!session || session.expiresAt <= now) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    }
    return null
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: now },
  })

  return session.user
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return
  const tokenHash = sha256(token)
  await prisma.session.deleteMany({ where: { tokenHash } })
}
