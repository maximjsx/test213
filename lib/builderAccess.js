import getClientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

// The one hardcoded super-admin. Only this Discord id can add/remove builder users.
export const SUPER_ADMIN_ID = '759334613335670805'

export function isSuperAdmin(discordId) {
  return discordId === SUPER_ADMIN_ID
}

async function col() {
  const client = await getClientPromise()
  return client.db('bulgario').collection('builder_users')
}

// Is this Discord id allowed to use the level builder?
export async function isBuilderAllowed(discordId) {
  if (!discordId) return false
  if (isSuperAdmin(discordId)) return true
  const doc = await (await col()).findOne({ discordId })
  return !!doc
}

// Allowlisted users (super-admin excluded — it's implicit), enriched with Discord names.
export async function listBuilderUsers() {
  const c = await col()
  const rows = await c.find({}, { projection: { _id: 0, discordId: 1, addedAt: 1 } }).sort({ addedAt: 1 }).toArray()
  const client = await getClientPromise()
  const users = client.db('bulgario').collection('users')
  const out = []
  for (const r of rows) {
    const u = await users.findOne({ discordId: r.discordId }, { projection: { _id: 0, discordName: 1, username: 1 } })
    out.push({ discordId: r.discordId, addedAt: r.addedAt, discordName: u?.discordName || null, username: u?.username || null })
  }
  return out
}

export async function addBuilderUser(discordId, addedBy) {
  const c = await col()
  await c.updateOne(
    { discordId },
    { $setOnInsert: { discordId, addedAt: new Date(), addedBy } },
    { upsert: true }
  )
}

export async function removeBuilderUser(discordId) {
  const c = await col()
  await c.deleteOne({ discordId })
}

// Convenience: resolve the current session's builder status for a route.
export async function currentBuilderStatus() {
  const session = getSession()
  const discordId = session?.discordId || null
  const allowed = await isBuilderAllowed(discordId)
  return { discordId, loggedIn: !!discordId, allowed, isAdmin: isSuperAdmin(discordId) }
}
