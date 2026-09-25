// Signed "activity started" tokens. The client asks for one when a lesson,
// game or drill begins and returns it with the result; the server checks the
// signature, the activity, the elapsed time and that it was not used before.
// Server only.
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import getClientPromise from '@/lib/mongodb'

const MAX_AGE_MS = 6 * 3600000
const b64 = s => Buffer.from(s).toString('base64url')
const sign = payload => createHmac('sha256', process.env.AUTH_SECRET).update(payload).digest('base64url')

export function issueActivityToken(discordId, kind, ref) {
  const payload = b64(JSON.stringify({ u: discordId, k: kind, r: String(ref), t: Date.now(), n: randomBytes(9).toString('base64url') }))
  return `${payload}.${sign(payload)}`
}

let used = null
function usedTokens() {
  used ??= getClientPromise().then(async client => {
    const c = client.db('bulgario').collection('activity_tokens')
    await Promise.all([
      c.createIndex({ nonce: 1 }, { unique: true }),
      c.createIndex({ createdAt: 1 }, { expireAfterSeconds: MAX_AGE_MS / 1000 }),
    ])
    return c
  })
  return used
}

// Returns null when valid, otherwise the reason
export async function spendActivityToken(token, { discordId, kind, ref, minMs }) {
  const [payload, sig] = String(token || '').split('.')
  if (!payload || !sig) return 'missing_token'
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return 'bad_token'
  let data
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString()) } catch { return 'bad_token' }
  if (data.u !== discordId || data.k !== kind || data.r !== String(ref)) return 'wrong_activity'
  const age = Date.now() - data.t
  if (age < minMs) return 'too_fast'
  if (age > MAX_AGE_MS) return 'expired'
  try {
    await (await usedTokens()).insertOne({ nonce: data.n, createdAt: new Date() })
  } catch (e) {
    if (e.code === 11000) return 'already_used'
    throw e
  }
  return null
}
