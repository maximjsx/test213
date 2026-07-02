import crypto from 'crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'bulgario_session'
const SESSION_DAYS = 180

function secret() {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET is not defined')
  return s
}

function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

function hmac(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url')
}

export function createSessionToken(discordId) {
  const payload = b64url(JSON.stringify({ id: discordId, exp: Date.now() + SESSION_DAYS * 86400000 }))
  return `${payload}.${hmac(payload)}`
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = hmac(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.id || data.exp < Date.now()) return null
    return { discordId: data.id }
  } catch {
    return null
  }
}

// Session from the request cookies, or null
export function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value
  return verifySessionToken(token)
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  }
}

export function baseUrl(req) {
  return process.env.BASE_URL || new URL(req.url).origin
}
