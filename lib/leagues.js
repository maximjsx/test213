// Simplified leagues: no weekly promotion job. Your league this week comes
// from the coins you earned last week, so promotion and demotion happen on
// their own when the week rolls over.
export const LEAGUES = [
  { id: 'bronze',   name: 'Bronze',   minCoins: 0,    color: '#cd7f32' },
  { id: 'silver',   name: 'Silver',   minCoins: 50,   color: '#b8c4d6' },
  { id: 'gold',     name: 'Gold',     minCoins: 150,  color: '#ffc800' },
  { id: 'sapphire', name: 'Sapphire', minCoins: 300,  color: '#1cb0f6' },
  { id: 'ruby',     name: 'Ruby',     minCoins: 600,  color: '#ff4b6e' },
  { id: 'diamond',  name: 'Diamond',  minCoins: 1000, color: '#7ee8fa' },
]

export function leagueIndexFor(lastWeekCoins) {
  let idx = 0
  LEAGUES.forEach((l, i) => { if (lastWeekCoins >= l.minCoins) idx = i })
  return idx
}
