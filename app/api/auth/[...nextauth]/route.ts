import { handlers } from '@/auth'
import type { NextRequest } from 'next/server'
import { preserveCsrfCookieOnRead } from '@/lib/auth/read-only-response'

export const { POST } = handlers

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request)
  const action = new URL(request.url).pathname.split('/').pop()
  return action === 'session' || action === 'providers' ? preserveCsrfCookieOnRead(response) : response
}
