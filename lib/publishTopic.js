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

// Returns course.js with the topic imported and appended to `levels`, or the
// same text when it is already registered.
export function registerTopic(courseSource, id) {
  const importPath = `./${id}.json`
  if (courseSource.includes(`'${importPath}'`)) return courseSource

  const name = 'topic_' + id.replace(/\W/g, '_')
  const lines = courseSource.split('\n')
  const lastImport = lines.findLastIndex(l => l.startsWith('import '))
  lines.splice(lastImport + 1, 0, `import ${name} from '${importPath}'`)
  const next = lines.join('\n').replace(/levels: \[([^\]]*)\]/, (_, list) => `levels: [${list.trim()}, ${name}]`)
  if (!next.includes(`, ${name}]`)) throw new Error('Could not find the levels list in data/course.js.')
  return next
}
