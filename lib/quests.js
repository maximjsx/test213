// Daily quests: 3 per day, picked deterministically from the pool so
// every device shows the same quests for the same date.

const QUEST_POOL = [
  { id: 'earn_xp_40',   icon: '/icons/lightning.png', title: 'Earn 40 XP',                      goal: 40, reward: { type: 'xp', amount: 15 } },
  { id: 'earn_xp_60',   icon: '/icons/lightning.png', title: 'Earn 60 XP',                      goal: 60, reward: { type: 'xp', amount: 25 } },
  { id: 'lessons_2',    icon: '/icons/green_checkmark.png', title: 'Finish 2 lessons',          goal: 2,  reward: { type: 'xp', amount: 15 } },
  { id: 'lessons_3',    icon: '/icons/green_checkmark.png', title: 'Finish 3 lessons',          goal: 3,  reward: { type: 'xp', amount: 20 } },
  { id: 'combo_5',      icon: '/icons/fire.png',      title: 'Get 5 in a row in one lesson',    goal: 1,  reward: { type: 'xp', amount: 15 } },
  { id: 'combo_8',      icon: '/icons/fire.png',      title: 'Get 8 in a row in one lesson',    goal: 1,  reward: { type: 'xp', amount: 20 } },
  { id: 'accuracy_90',  icon: '/icons/star.png',      title: 'Score 90%+ in a lesson',          goal: 1,  reward: { type: 'xp', amount: 15 } },
  { id: 'perfect_1',    icon: '/icons/trophy.png',    title: 'Get a perfect lesson',            goal: 1,  reward: { type: 'freeze', amount: 1 } },
]

// Small deterministic hash so quest selection is stable per day
function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function generateDailyQuests(dayString) {
  const seed = hashStr(dayString)
  const pool = [...QUEST_POOL]
  const picked = []
  const usedKinds = new Set()
  let n = seed
  while (picked.length < 3 && pool.length > 0) {
    n = (Math.imul(n, 1103515245) + 12345) >>> 0
    const idx = n % pool.length
    const q = pool.splice(idx, 1)[0]
    const kind = q.id.split('_')[0]
    if (usedKinds.has(kind)) continue
    usedKinds.add(kind)
    picked.push({ ...q, progress: 0, claimed: false })
  }
  return { day: dayString, items: picked }
}

export function ensureQuests(state) {
  const today = new Date().toDateString()
  if (state.quests?.day === today) return state
  return { ...state, quests: generateDailyQuests(today) }
}

// Called after every finished session (lesson or mistake practice)
export function applySessionToQuests(quests, { xpEarned = 0, accuracyPct = 0, maxCombo = 0, perfect = false, isLesson = true }) {
  if (!quests?.items) return quests
  const items = quests.items.map(q => {
    if (q.claimed) return q
    let inc = 0
    if (q.id.startsWith('earn_xp')) inc = xpEarned
    else if (q.id.startsWith('lessons') && isLesson) inc = 1
    else if (q.id === 'combo_5' && maxCombo >= 5) inc = 1
    else if (q.id === 'combo_8' && maxCombo >= 8) inc = 1
    else if (q.id === 'accuracy_90' && accuracyPct >= 90) inc = 1
    else if (q.id === 'perfect_1' && perfect) inc = 1
    if (!inc) return q
    return { ...q, progress: Math.min(q.goal, q.progress + inc) }
  })
  return { ...quests, items }
}

export function claimableQuestCount(quests) {
  if (!quests?.items) return 0
  return quests.items.filter(q => !q.claimed && q.progress >= q.goal).length
}
