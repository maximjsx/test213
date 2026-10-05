import crypto from 'crypto'
import { cookies } from 'next/headers'
import { baseUrl } from '@/lib/auth'

// Only same-site paths, so the link can't bounce people to another domain
const safeNext = next => (/^\/(?![/\\])/.test(next || '') ? next : null)

export async function GET(req) {
  const clientId = process.env.DISCORD_CLIENT_ID
  if (!clientId) return Response.json({ error: 'DISCORD_CLIENT_ID not configured' }, { status: 500 })

  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600 }
  const state = crypto.randomBytes(16).toString('hex')
  cookies().set('oauth_state', state, cookieOptions)
  const next = safeNext(new URL(req.url).searchParams.get('next'))
  if (next) cookies().set('oauth_next', next, cookieOptions)
  else cookies().delete('oauth_next')

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: `${baseUrl(req)}/api/auth/callback`,
    scope: 'identify guilds',
    state,
    prompt: 'none',
  })
  return Response.redirect(`https://discord.com/oauth2/authorize?${params}`, 302)
}
