// What the wiki home shows: section cards linking into the wiki, the
// glossary and the media pages. Server only (reads the wiki index).
import GLOSSARY from '../data/glossary.json'
import GALLERY from '../data/gallery.json'
import { MEDIA } from './mediaLibrary'
import { wikiChildren, wikiPage } from './wiki'

// glyph: a short Cyrillic word drawn as the card art (at most 4 letters, so
// every tile reads at the same size); color: a theme token
const FEATURED = [
  { slug: 'the-alphabet', title: 'The alphabet', glyph: 'Аа', color: 'var(--teal)', blurb: 'All 30 letters, printed and handwritten, and how to type them.' },
  { slug: 'vocabulary', title: 'Vocabulary', glyph: 'дума', color: 'var(--blue)', blurb: 'Word lists by theme: nouns, verbs, numbers, time and phrases.' },
  { slug: 'interesting-rules', title: 'Grammar notes', glyph: 'ли?', color: 'var(--orange)', blurb: 'The tricky bits in plain words: articles, negatives, ли and няма.' },
  { href: '/glossary', title: 'Literary words', glyph: 'блян', color: 'var(--yellow)', blurb: 'Rare and bookish words with dictionary definitions.', meta: `${GLOSSARY.length} words` },
  { href: '/watch', title: 'Watch and listen', glyph: 'виж', color: 'var(--red)', blurb: 'Real videos and songs with Bulgarian and English subtitles.', meta: MEDIA.length ? `${MEDIA.length} videos` : 'Coming soon' },
  { href: '/about-bulgarian', title: 'About the language', glyph: 'език', color: 'var(--green)', blurb: 'Family tree, history, difficulty and what makes it unusual.', meta: 'Overview' },
]

const CULTURE = [
  { href: '/gallery', title: 'Photo gallery', blurb: 'Places, food and traditions, captioned in Bulgarian.', meta: `${GALLERY.length} photos` },
  { slug: 'history', title: 'History', blurb: 'Famous Bulgarians from Tsar Simeon to today.' },
  { slug: 'important-bulgarian-holidays', title: 'Holidays', blurb: 'Baba Marta, 3 March and the other days off.' },
  { slug: 'music', title: 'Music', blurb: 'Songs every Bulgarian knows, pop-folk to classics.' },
  { slug: 'books', title: 'Books', blurb: 'Classics worth reading once you can.' },
  { slug: 'bulgarian-content-creators', title: 'YouTubers', blurb: 'Channels that are easy to follow for learners.' },
  { slug: 'other-online-resources', title: 'More resources', blurb: 'Dictionaries, typing tests, courses and AI practice.' },
]

const pages = n => `${n} ${n === 1 ? 'page' : 'pages'}`

function withCounts(card) {
  if (!card.slug) return card
  if (!wikiPage(card.slug)) return null
  const count = wikiChildren(card.slug).length
  return { ...card, href: `/wiki/${card.slug}`, meta: card.meta || (count ? pages(count) : 'One page') }
}

export const FEATURED_CARDS = FEATURED.map(withCounts).filter(Boolean)
export const CULTURE_CARDS = CULTURE.map(withCounts).filter(Boolean)
export const WARNING_CARD = withCounts({ slug: 'bad-stuff', title: 'Insults and swearing', blurb: 'Useful to recognise, risky to use. Opens behind a warning.' })

// Everything the wiki search can find
export const SEARCH_INDEX = [
  ...wikiChildren('').flatMap(section => [section, ...wikiChildrenDeep(section.slug)])
    .map(p => ({ label: p.title, href: `/wiki/${p.slug}`, kind: 'Wiki' })),
  ...GLOSSARY.map(g => ({ label: `${g.bg}: ${g.en}`, href: `/glossary#${g.id}`, kind: 'Word' })),
  ...MEDIA.map(m => ({ label: m.title, href: `/watch/${m.id}`, kind: m.kind === 'song' ? 'Song' : 'Video' })),
]

function wikiChildrenDeep(slug) {
  return wikiChildren(slug).flatMap(p => [p, ...wikiChildrenDeep(p.slug)])
}

// A small slice of the glossary for the word of the day, so the page does
// not ship every definition
export const DAILY_WORDS = GLOSSARY.map(g => ({ id: g.id, bg: g.bg, en: g.en, sense: g.senses[0] }))
