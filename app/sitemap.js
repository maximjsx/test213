import { LEVELS } from '../lib/course'
import { SITE_URL } from '../lib/seo'

export default function sitemap() {
  const pages = [
    { path: '/', priority: 1 },
    { path: '/letters', priority: 0.8 },
    { path: '/words', priority: 0.6 },
    { path: '/leaderboard', priority: 0.4 },
    { path: '/privacy', priority: 0.1 },
    { path: '/terms', priority: 0.1 },
  ]
  for (const level of LEVELS) {
    pages.push({ path: `/topic/${level.id}`, priority: 0.8 })
    pages.push({ path: `/level/${level.id}`, priority: 0.7 })
  }
  return pages.map(({ path, priority }) => ({ url: SITE_URL + path, changeFrequency: 'weekly', priority }))
}
