import getClientPromise from '@/lib/mongodb'
import { deleteFile } from '@/lib/storage'
import { COURSE } from '@/data/course'
import { collectPhrases } from '@/lib/voicePhrases'

// One doc per submission: { key, text, fileId, url, by, byName, status: 'approved' | 'pending', createdAt }.
// At most one approved doc per key; that is the clip the lessons play.

export const COURSE_PHRASES = new Map(collectPhrases(COURSE.levels).map(p => [p.key, p]))

export async function voiceoversCollection() {
  const client = await getClientPromise()
  return client.db('bulgario').collection('voiceovers')
}

async function removeDocs(col, filter) {
  const docs = await col.find(filter, { projection: { fileId: 1 } }).toArray()
  if (!docs.length) return
  await col.deleteMany({ _id: { $in: docs.map(d => d._id) } })
  await Promise.allSettled(docs.map(d => deleteFile(d.fileId)))
}

export async function approveVoiceover(col, doc) {
  await removeDocs(col, { key: doc.key, status: 'approved', _id: { $ne: doc._id } })
  await col.updateOne({ _id: doc._id }, { $set: { status: 'approved', approvedAt: new Date() } })
}

export async function removeVoiceover(col, id) {
  await removeDocs(col, { _id: id })
}

// A new take from the same person replaces their earlier unreviewed one.
export async function dropOwnPending(col, key, by) {
  await removeDocs(col, { key, by, status: 'pending' })
}
