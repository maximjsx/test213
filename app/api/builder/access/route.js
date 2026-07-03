import { currentBuilderStatus, listBuilderUsers, SUPER_ADMIN_ID } from '@/lib/builderAccess'

export const dynamic = 'force-dynamic'

// GET /api/builder/access
// Returns the caller's builder status. Admins also get the managed user list.
export async function GET() {
  try {
    const status = await currentBuilderStatus()
    const body = {
      loggedIn: status.loggedIn,
      allowed: status.allowed,
      isAdmin: status.isAdmin,
      myId: status.discordId,
      superAdminId: SUPER_ADMIN_ID,
    }
    if (status.isAdmin) body.users = await listBuilderUsers()
    return Response.json(body)
  } catch (e) {
    console.error('builder access error:', e)
    return Response.json({ loggedIn: false, allowed: false, isAdmin: false }, { status: 500 })
  }
}
