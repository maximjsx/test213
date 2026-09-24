import { LEVELS } from './course'

// A special topic can need coins, membership of a Discord server, or both.
// Returns what is still missing, or null when the topic is open.
export function topicLock(level, { unlockedTopics, guildIds }) {
  const special = level.special
  if (!special) return null
  const needsGuild = !!special.guild && !guildIds?.includes(special.guild.id)
  const needsCoins = special.price > 0 && !unlockedTopics?.[level.id]
  return needsGuild || needsCoins ? { needsGuild, needsCoins } : null
}

// Only memberships of servers the course actually uses are stored on a user.
export const COURSE_GUILD_IDS = [...new Set(LEVELS.flatMap(l => (l.special?.guild ? [l.special.guild.id] : [])))]
