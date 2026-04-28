import { NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/auth/session'
import { getDemoMemberExpiresAt } from '@/lib/auth/demo-member'

export async function GET() {
  const user = await getAuthedUser()
  const demoExpires = await getDemoMemberExpiresAt()
  const demoMemberExpiresAt = demoExpires ? demoExpires.toISOString() : null

  if (!user) {
    return NextResponse.json({
      ok: true,
      user: null,
      demoMemberExpiresAt,
    })
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      memberExpiresAt: user.memberExpiresAt,
      isMember: !!user.memberExpiresAt && user.memberExpiresAt > new Date(),
    },
    demoMemberExpiresAt: null,
  })
}
