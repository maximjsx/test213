import { cookies } from 'next/headers'
import getClientPromise from '@/lib/mongodb'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE, baseUrl } from '@/lib/auth'

function sanitizeUsername(raw) {
  const cleaned = (raw || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
  return cleaned.length >= 3 ? cleaned : `learner${Math.floor(1000 + Math.random() * 9000)}`
}

export async function GET(req) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = cookies().get('oauth_state')?.value
  const home = baseUrl(req)

  if (!code || !state || state !== cookieState) {
    return Response.redirect(`${home}/profile?error=oauth_state`, 302)
  }
  cookies().delete('oauth_state')

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${home}/api/auth/callback`,
      }),
    })
    const token = await tokenRes.json()
    if (!token.access_token) {
      console.error('Discord token exchange failed:', token)
      return Response.redirect(`${home}/profile?error=token_exchange`, 302)
    }

    const meRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    })
    const me = await meRes.json()
    if (!me.id) return Response.redirect(`${home}/profile?error=discord_me`, 302)

    const client = await getClientPromise()
    const users = client.db('bulgario').collection('users')

    const existing = await users.findOne({ discordId: me.id })
    if (existing) {
      await users.updateOne(
        { discordId: me.id },
        { $set: { discordName: me.global_name || me.username, avatar: me.avatar, lastLoginAt: new Date() } }
      )
    } else {
      // First login: pick a free username derived from the Discord handle
      let username = sanitizeUsername(me.global_name || me.username)
      while (await users.findOne({ usernameLower: username.toLowerCase() })) {
        username = `${username.slice(0, 15)}${Math.floor(100 + Math.random() * 900)}`
      }
      await users.insertOne({
        discordId: me.id,
        discordName: me.global_name || me.username,
        avatar: me.avatar,
        username,
        usernameLower: username.toLowerCase(),
        createdAt: new Date(),
        lastLoginAt: new Date(),
        xp: 0,
        streak: 0,
        lessonsCount: 0,
        progress: null,
      })
    }

    cookies().set(SESSION_COOKIE, createSessionToken(me.id), sessionCookieOptions())
    return Response.redirect(`${home}/profile?login=1`, 302)
  } catch (e) {
    console.error('OAuth callback error:', e)
    return Response.redirect(`${home}/profile?error=internal`, 302)
  }
}
