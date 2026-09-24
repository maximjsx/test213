// The wiki: Markdown pages in data/wiki, listed in data/wiki/index.json as
// { slug, title, parent, warning? }. Read at build time; every page is static.
import { readFileSync } from 'fs'
import { join } from 'path'
import INDEX from '../data/wiki/index.json'

const DIR = join(process.cwd(), 'data', 'wiki')

export const WIKI_PAGES = INDEX.filter(p => p.slug)

export function wikiPage(slug) {
  return INDEX.find(p => p.slug === slug) || null
}

export function wikiBody(slug) {
  return readFileSync(join(DIR, `${slug || 'index'}.md`), 'utf8')
}

export function wikiChildren(slug) {
  return INDEX.filter(p => p.parent === slug && p.slug)
}

// Parents from the top down, excluding the page itself
export function wikiTrail(slug) {
  const trail = []
  let page = wikiPage(slug)
  while (page?.parent) {
    page = wikiPage(page.parent)
    if (page) trail.unshift(page)
  }
  return trail
}

// Titles read "English (Български)"; the English part is enough for headers
export const shortTitle = title => title.replace(/\s*\([^)]*\)\s*$/, '') || title
