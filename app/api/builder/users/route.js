import { currentBuilderStatus, addBuilderUser, removeBuilderUser, listBuilderUsers, SUPER_ADMIN_ID } from '@/lib/builderAccess'

export const dynamic = 'force-dynamic'

function validId(id) {
  return typeof id === 'string' && /^\d{5,25}$/.test(id.trim())
}

// POST /api/builder/users  { discordId }  — admin only. Add a user to the allowlist.
export async function POST(req) {
  const status = await currentBuilderStatus()
  if (!status.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })

  const { discordId } = await req.json().catch(() => ({}))
  const id = (discordId || '').trim()
  if (!validId(id)) return Response.json({ error: 'invalid_id' }, { status: 400 })
  if (id === SUPER_ADMIN_ID) return Response.json({ error: 'already_admin' }, { status: 400 })

  await addBuilderUser(id, status.discordId)
  return Response.json({ ok: true, users: await listBuilderUsers() })
}

// DELETE /api/builder/users  { discordId }  — admin only. Remove a user.
export async function DELETE(req) {
  const status = await currentBuilderStatus()
  if (!status.isAdmin) return Response.json({ error: 'forbidden' }, { status: 403 })

  const { discordId } = await req.json().catch(() => ({}))
  const id = (discordId || '').trim()
  if (!id) return Response.json({ error: 'invalid_id' }, { status: 400 })
  if (id === SUPER_ADMIN_ID) return Response.json({ error: 'cannot_remove_admin' }, { status: 400 })

  await removeBuilderUser(id)
  return Response.json({ ok: true, users: await listBuilderUsers() })
}
