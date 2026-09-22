const API = 'https://discord.com/api'
const TIMEOUT_MS = 4000
const SYNC_INTERVAL_MS = 6 * 3600000

function tokenRequest(params) {
  return fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      ...params,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).then(r => r.json())
}

export function exchangeCode(code, redirectUri) {
  return tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri })
}

export function fetchDiscordUser(accessToken) {
  return fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).then(r => r.json())
}

export function tokenFields(token) {
  return {
    discordAccessToken: token.access_token,
    discordRefreshToken: token.refresh_token,
    discordTokenExpiresAt: new Date(Date.now() + (token.expires_in || 0) * 1000),
    discordSyncedAt: new Date(),
  }
}

async function freshAccessToken(user) {
  if (user.discordAccessToken && user.discordTokenExpiresAt > new Date(Date.now() + 60000)) {
    return { accessToken: user.discordAccessToken, fields: {} }
  }
  const token = await tokenRequest({ grant_type: 'refresh_token', refresh_token: user.discordRefreshToken })
  if (!token.access_token) return null
  return { accessToken: token.access_token, fields: tokenFields(token) }
}

// Avatar hashes change whenever the user changes their Discord avatar, and the
// old CDN URL then 404s. Re-read the profile every few hours so it stays live.
// Returns the updated avatar/name, or null when nothing was refreshed.
export async function syncDiscordProfile(users, discordId) {
  const staleBefore = new Date(Date.now() - SYNC_INTERVAL_MS)
  // Claim the sync atomically: Discord rotates refresh tokens, so two parallel
  // requests refreshing with the same token would invalidate it.
  const user = await users.findOneAndUpdate(
    {
      discordId,
      discordRefreshToken: { $exists: true },
      $or: [{ discordSyncedAt: { $lt: staleBefore } }, { discordSyncedAt: { $exists: false } }],
    },
    { $set: { discordSyncedAt: new Date() } },
  )
  if (!user) return null

  try {
    const auth = await freshAccessToken(user)
    if (!auth) {
      await users.updateOne({ discordId }, { $unset: { discordAccessToken: '', discordRefreshToken: '', discordTokenExpiresAt: '' } })
      return null
    }
    const me = await fetchDiscordUser(auth.accessToken)
    if (!me.id) return null
    const profile = { discordName: me.global_name || me.username, avatar: me.avatar }
    await users.updateOne({ discordId }, { $set: { ...auth.fields, ...profile } })
    return profile
  } catch (e) {
    console.error('Discord profile sync failed:', e)
    return null
  }
}
