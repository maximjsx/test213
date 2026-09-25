import { getSession } from '@/lib/auth'
import { typingLeaderboard } from '@/lib/typingResults'
import { isTypingBoard } from '@/lib/typingBoards'

export const dynamic = 'force-dynamic'

// GET ?board=30-words&period=week|all
export async function GET(req) {
  try {
    const params = new URL(req.url).searchParams
    const board = params.get('board')
    if (!isTypingBoard(board)) return Response.json({ error: 'bad_board' }, { status: 400 })
    const period = params.get('period') === 'week' ? 'week' : 'all'
    const session = getSession()
    const data = await typingLeaderboard(board, period, session?.discordId)
    return Response.json({ ...data, signedIn: Boolean(session) })
  } catch (e) {
    console.error('typing leaderboard error:', e)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
