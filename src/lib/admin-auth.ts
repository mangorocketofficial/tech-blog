import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const ADMIN_SESSION_COOKIE = 'admin_session'
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24

interface AdminSessionPayload {
  email: string
  exp: number
  nonce: string
}

function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createAdminSessionToken(email: string): string | null {
  const secret = getSessionSecret()
  if (!secret) return null

  const payload: AdminSessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
    nonce: randomBytes(16).toString('hex'),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${sign(encodedPayload, secret)}`
}

function verifyAdminSessionToken(token: string): boolean {
  const secret = getSessionSecret()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!secret || !adminEmail) return false

  const [encodedPayload, providedSignature, ...extra] = token.split('.')
  if (!encodedPayload || !providedSignature || extra.length > 0) return false

  const expected = Buffer.from(sign(encodedPayload, secret), 'utf8')
  const provided = Buffer.from(providedSignature, 'utf8')
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return false
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as AdminSessionPayload

    return (
      payload.email === adminEmail &&
      Number.isFinite(payload.exp) &&
      payload.exp > Math.floor(Date.now() / 1000)
    )
  } catch {
    return false
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  return token ? verifyAdminSessionToken(token) : false
}
