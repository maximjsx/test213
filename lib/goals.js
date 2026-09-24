export const DAILY_GOALS = [
  { coins: 10, label: 'Casual' },
  { coins: 20, label: 'Regular' },
  { coins: 30, label: 'Serious' },
  { coins: 50, label: 'Intense' },
]
export const DEFAULT_DAILY_GOAL = 20

export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 200, 365, 500, 1000]

// Celebrate only on the day the milestone is reached, and only once
export function pendingMilestone(state) {
  if (!STREAK_MILESTONES.includes(state.streak)) return null
  if (state.lastActiveDay !== new Date().toDateString()) return null
  if (state.streakMilestone === state.streak) return null
  return state.streak
}

export const FRIEND_QUEST_GOAL = 300
export const FRIEND_QUEST_REWARD = 30
