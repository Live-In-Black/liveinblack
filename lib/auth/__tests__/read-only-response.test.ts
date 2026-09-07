import { describe, it, expect } from 'vitest'
import { preserveCsrfCookieOnRead } from '../read-only-response'

describe('cookies de lecture Auth.js', () => {
  it.each(['authjs.csrf-token', '__Host-authjs.csrf-token'])('ne reemet pas %s mais conserve le JWT et son expiration', (name) => {
    const response = new Response(null, { status: 307, headers: { location: '/login' } })
    response.headers.append('set-cookie', `${name}=test; Path=/; HttpOnly`)
    response.headers.append('set-cookie', 'authjs.session-token=; Path=/; Max-Age=0; HttpOnly')
    expect(preserveCsrfCookieOnRead(response)).toBe(response)
    expect(response.headers.getSetCookie()).toEqual(['authjs.session-token=; Path=/; Max-Age=0; HttpOnly'])
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('/login')
  })
})
