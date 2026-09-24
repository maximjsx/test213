// Simplified leagues: no weekly promotion job. Your league this week comes
// from the XP you earned last week, so promotion and demotion happen on
// their own when the week rolls over.
export const LEAGUES = [
  { id: 'bronze',   name: 'Bronze',   minXp: 0,    color: '#cd7f32' },
  { id: 'silver',   name: 'Silver',   minXp: 50,   color: '#b8c4d6' },
  { id: 'gold',     name: 'Gold',     minXp: 150,  color: '#ffc800' },
  { id: 'sapphire', name: 'Sapphire', minXp: 300,  color: '#1cb0f6' },
  { id: 'ruby',     name: 'Ruby',     minXp: 600,  color: '#ff4b6e' },
  { id: 'diamond',  name: 'Diamond',  minXp: 1000, color: '#7ee8fa' },
]

export function leagueIndexFor(lastWeekXp) {
  let idx = 0
  LEAGUES.forEach((l, i) => { if (lastWeekXp >= l.minXp) idx = i })
  return idx
}
