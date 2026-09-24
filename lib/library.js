// What the Library home shows: section cards linking into the wiki, the
// glossary and the media pages. Server only (reads the wiki index).
import GLOSSARY from '../data/glossary.json'
import { MEDIA } from './mediaLibrary'
import { wikiChildren, wikiPage } from './wiki'

// glyph: a short Cyrillic word drawn as the card art; color: a theme token
const FEATURED = [
  { slug: 'the-alphabet', title: 'The alphabet', glyph: 'Аа', color: 'var(--teal)', blurb: 'All 30 letters, printed and handwritten, plus the keyboard layout to type them.' },
  { slug: 'vocabulary', title: 'Vocabulary', glyph: 'дума', color: 'var(--blue)', blurb: 'Word lists by theme: nouns, verbs, pronouns, numbers, time, phrases and idioms.' },
  { slug: 'interesting-rules', title: 'Grammar notes', glyph: 'ли?', color: 'var(--orange)', blurb: 'The tricky bits in plain words: articles, double negatives, ли, няма and more.' },
  { href: '/glossary', title: 'Literary words', glyph: 'блян', color: 'var(--yellow)', blurb: `${GLOSSARY.length} rare and bookish words with dictionary definitions and English meanings.` },
  { href: '/watch', title: 'Watch and listen', glyph: 'гледай', color: 'var(--red)', blurb: 'Real videos and songs with Bulgarian and English subtitles side by side.' },
]

const CULTURE = [
  { slug: 'history', title: 'History', blurb: 'Famous Bulgarians from Tsar Simeon to today.' },
  { slug: 'important-bulgarian-holidays', title: 'Holidays', blurb: 'Baba Marta, 3 March and the other days off.' },
  { slug: 'music', title: 'Music', blurb: 'Songs every Bulgarian knows, from pop-folk to classics.' },
  { slug: 'books', title: 'Books', blurb: 'Classics worth reading once you can.' },
  { slug: 'bulgarian-content-creators', title: 'YouTubers', blurb: 'Channels that are easy to follow for learners.' },
  { slug: 'other-online-resources', title: 'More resources', blurb: 'Dictionaries, typing tests, courses and AI practice.' },
  { slug: 'bad-stuff', title: 'Insults and swearing', blurb: 'Recognise them, use them carefully.', warning: true },
]

function withCounts(card) {
  if (!card.slug) return card
  if (!wikiPage(card.slug)) return null
  return { ...card, href: `/wiki/${card.slug}`, pages: wikiChildren(card.slug).length }
}

export const FEATURED_CARDS = FEATURED.map(withCounts).filter(Boolean)
export const CULTURE_CARDS = CULTURE.map(withCounts).filter(Boolean)

// Everything the Library search can find
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
