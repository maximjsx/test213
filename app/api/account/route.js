import getClientPromise from '@/lib/mongodb'
import { getSession, SESSION_COOKIE } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function DELETE() {
  try {
    const session = getSession()
    if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

    const client = await getClientPromise()
    const db = client.db('bulgario')
    await Promise.all([
      db.collection('users').deleteOne({ discordId: session.discordId }),
      db.collection('friends').deleteMany({ $or: [{ from: session.discordId }, { to: session.discordId }] }),
    ])

    cookies().delete(SESSION_COOKIE)
    return Response.json({ ok: true })
  } catch (e) {
    console.error('account DELETE error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
