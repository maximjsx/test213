import getClientPromise from '@/lib/mongodb'

// Server-side backup of builder drafts, one document per level per builder:
//   { discordId, id, level, updatedAt: ms, deleted?: true }
// A backup only: published topics live in data/ in the repo. Deletions are
// kept as tombstones so another device drops the level too instead of
// uploading it again.

const MAX_BYTES = 1_500_000

let ready = null

function col() {
  ready ??= getClientPromise().then(async client => {
    const c = client.db('bulgario').collection('builder_levels')
    await c.createIndex({ discordId: 1, id: 1 }, { unique: true })
    return c
  })
  return ready
}

export async function listDrafts(discordId) {
  const c = await col()
  return c.find({ discordId }, { projection: { _id: 0, id: 1, level: 1, updatedAt: 1, deleted: 1 } }).toArray()
}

// Older writes never overwrite newer ones, whichever device sends them last.
export async function saveDraft(discordId, level, updatedAt) {
  if (JSON.stringify(level).length > MAX_BYTES) return { error: 'too_large' }
  const c = await col()
  await c.updateOne(
    { discordId, id: level.id, $or: [{ updatedAt: { $lt: updatedAt } }, { updatedAt: { $exists: false } }] },
    { $set: { level, updatedAt }, $unset: { deleted: '' } },
    { upsert: true }
  ).catch(e => {
    // The filter misses when the stored copy is newer, so the upsert tries to
    // insert a duplicate. That is the "newer wins" case, not a failure.
    if (e.code !== 11000) throw e
  })
  return { ok: true }
}

export async function deleteDraft(discordId, id, updatedAt) {
  const c = await col()
  await c.updateOne(
    { discordId, id },
    { $set: { deleted: true, updatedAt }, $unset: { level: '' } },
    { upsert: true }
  )
}
