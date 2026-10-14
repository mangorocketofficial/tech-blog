import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
} from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not configured' },
        { status: 500 }
      )
    }

    if (email === adminEmail && password === adminPassword) {
      const sessionToken = createAdminSessionToken(email)
      if (!sessionToken) {
        return NextResponse.json(
          { error: 'Admin session secret is not configured' },
          { status: 500 }
        )
      }

      const cookieStore = await cookies()
      cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ADMIN_SESSION_MAX_AGE,
        path: '/',
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
