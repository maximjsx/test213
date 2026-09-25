// Everything that decides whether a builder level may become a course topic,
// and how data/course.js registers it. Pure functions over text and data, so
// scripts/add-topic.js (files on disk) and the builder's Publish route
// (files on GitHub) apply exactly the same rules.
import { validateLevel } from './levelSchema.js'

const ID_PATTERN = /^[\w-]+$/

function contentProblems(level) {
  const issues = validateLevel(level)
  if (!issues.count) return []
  const lines = [...issues.level]
  for (const [li, problems] of Object.entries(issues.lessons)) {
    lines.push(...problems.map(p => `Lesson ${Number(li) + 1}: ${p}`))
  }
  for (const lesson of level.lessons) {
    for (const ex of lesson.exercises || []) {
      for (const p of issues.exercises[ex.id] || []) lines.push(`${lesson.title} / ${ex.type} (${ex.id}): ${p}`)
    }
  }
  return lines
}

// Progress is stored per lesson id, so two topics sharing one would complete
// each other. `otherLevels` is every course topic except this one.
function lessonIdProblems(level, otherLevels) {
  const ids = new Set(level.lessons.map(l => l.id))
  if (ids.size !== level.lessons.length) return ['Two lessons in this level share an id.']
  for (const other of otherLevels) {
    const clash = (other.lessons || []).find(l => ids.has(l.id))
    if (clash) return [`Lesson id "${clash.id}" is already used by topic "${other.id}".`]
  }
  return []
}

export function topicProblems(level, otherLevels) {
  if (!level || typeof level !== 'object') return ['That is not a level.']
  if (!level.id || !ID_PATTERN.test(level.id)) return ['The level needs an id made of letters, digits, _ or -.']
  if (!Array.isArray(level.lessons)) return ['The level has no lessons.']
  const missing = level.lessons.find(l => !l.id)
  if (missing) return [`Lesson "${missing.title}" has no id.`]
  return [...contentProblems(level), ...lessonIdProblems(level, otherLevels.filter(l => l.id !== level.id))]
}

// The builder's sync timestamp is draft bookkeeping, not course content
export function topicJson({ updatedAt, ...level }) {
  return JSON.stringify(level, null, 2) + '\n'
}

// Topics are registered by importing their JSON in a registry file and adding
// the import to its list: data/course.js (levels: [...]) for normal topics,
// data/special.js (SPECIAL_LEVELS = [...]) for locked ones, whose exercises
// must stay out of the browser bundle.
export const REGISTRIES = {
  course: { path: 'data/course.js', list: /(levels: \[)([^\]]*)(\])/ },
  special: { path: 'data/special.js', list: /(SPECIAL_LEVELS = \[)([^\]]*)(\])/ },
}

const importName = id => 'topic_' + id.replace(/\W/g, '_')

// Keeps the file's own line endings (Windows checkouts use CRLF)
const eolOf = source => (source.includes('\r\n') ? '\r\n' : '\n')

function findImport(lines, id) {
  return lines.findIndex(l => l.startsWith('import ') && l.trimEnd().endsWith(`'./${id}.json'`))
}

function editList(source, registry, edit) {
  if (!registry.list.test(source)) throw new Error(`Could not find the topic list in ${registry.path}.`)
  return source.replace(registry.list, (_, open, list, close) => {
    const items = list.split(',').map(x => x.trim()).filter(Boolean)
    return `${open}${edit(items).join(', ')}${close}`
  })
}

// Returns the registry text with the topic added, or unchanged if present
export function registerTopic(source, id, registry = REGISTRIES.course) {
  const eol = eolOf(source)
  const lines = source.split(eol)
  if (findImport(lines, id) !== -1) return source
  const name = importName(id)
  const lastImport = lines.findLastIndex(l => l.startsWith('import '))
  // An empty registry has no imports yet: the first goes above the export
  const at = lastImport !== -1 ? lastImport + 1 : lines.findIndex(l => l.startsWith('export '))
  lines.splice(at, 0, `import ${name} from './${id}.json'`, ...(lastImport === -1 ? [''] : []))
  return editList(lines.join(eol), registry, items => [...items, name])
}

// Returns the registry text without the topic (its import and list entry)
export function unregisterTopic(source, id, registry) {
  const eol = eolOf(source)
  const lines = source.split(eol)
  const at = findImport(lines, id)
  if (at === -1) return source
  const name = lines[at].split(' ')[1]
  lines.splice(at, 1)
  if (lines[at] === '' && lines[at - 1] === '') lines.splice(at, 1)
  return editList(lines.join(eol), registry, items => items.filter(x => x !== name))
}

export const registryFor = level => (level.special ? REGISTRIES.special : REGISTRIES.course)
export const otherRegistry = level => (level.special ? REGISTRIES.course : REGISTRIES.special)

// What the browser may know about a special topic: enough to draw its locked
// bubble and lesson list, none of the exercises
export function specialMeta({ updatedAt, notes, lessons, ...level }) {
  return {
    ...level,
    lessons: lessons.map(l => ({ id: l.id, title: l.title, coins: l.coins, exerciseCount: l.exercises?.length || 0 })),
  }
}
