'use client'

const TOKEN_KEY = 'mangorocket_admin_session'

function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_ADMIN_API_URL
  if (configured) return configured.replace(/\/$/, '')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error('관리 API 주소가 설정되지 않았습니다.')
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/admin-api`
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string): void {
  window.sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  window.sessionStorage.removeItem(TOKEN_KEY)
}

export async function adminApiFetch(
  endpoint: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getAdminToken()

  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...init,
    headers,
  })

  if (response.status === 401 && authenticated) clearAdminToken()
  return response
}
