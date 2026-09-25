import { PUBLIC_LEVELS } from '../lib/course'
import { WIKI_PAGES } from '../lib/wiki'
import { MEDIA } from '../lib/mediaLibrary'
import { SITE_URL } from '../lib/seo'

export default function sitemap() {
  const pages = [
    { path: '/', priority: 1 },
    { path: '/letters', priority: 0.8 },
    { path: '/words', priority: 0.6 },
    { path: '/practice', priority: 0.5 },
    { path: '/practice/typing', priority: 0.6 },
    { path: '/practice/aspect', priority: 0.6 },
    { path: '/wiki', priority: 0.8 },
    { path: '/about-bulgarian', priority: 0.8 },
    { path: '/glossary', priority: 0.7 },
    { path: '/converter', priority: 0.6 },
    { path: '/watch', priority: 0.6 },
    { path: '/leaderboard', priority: 0.4 },
    { path: '/privacy', priority: 0.1 },
    { path: '/terms', priority: 0.1 },
  ]
  for (const level of PUBLIC_LEVELS) {
    pages.push({ path: `/topic/${level.id}`, priority: 0.8 })
    pages.push({ path: `/level/${level.id}`, priority: 0.7 })
  }
  for (const item of MEDIA.filter(m => m.kind === 'video')) {
    pages.push({ path: `/watch/${item.id}`, priority: 0.5 })
  }
  for (const page of WIKI_PAGES.filter(p => !p.warning)) {
    pages.push({ path: `/wiki/${page.slug}`, priority: 0.6 })
  }
  return pages.map(({ path, priority }) => ({ url: SITE_URL + path, changeFrequency: 'weekly', priority }))
}
