// Adds a level exported from the builder ("Export JSON") to the main course
// as a topic bubble. Running it again with a newer export updates the topic.
//
//   bun run add-topic path/to/level.json
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { validateLevel } from '../lib/levelSchema.js'

const DATA = join(import.meta.dir, '..', 'data')
const COURSE_FILE = join(DATA, 'course.js')

function fail(message) {
  console.error(message)
  process.exit(1)
}

function readLevel(path) {
  if (!path) fail('Usage: bun run add-topic path/to/level.json')
  let level
  try { level = JSON.parse(readFileSync(path, 'utf8')) } catch (e) { fail(`Could not read ${path}: ${e.message}`) }
  if (!level.id || !/^[\w-]+$/.test(level.id)) fail('The level needs an id made of letters, digits, _ or -.')
  if (!Array.isArray(level.lessons)) fail('The level has no lessons.')
  for (const lesson of level.lessons) {
    if (!lesson.id) fail(`Lesson "${lesson.title}" has no id.`)
  }
  checkContent(level)
  return level
}

// Same checks the builder shows as orange badges
function checkContent(level) {
  const issues = validateLevel(level)
  if (!issues.count) return
  const lines = [...issues.level]
  for (const [li, problems] of Object.entries(issues.lessons)) {
    lines.push(...problems.map(p => `Lesson ${Number(li) + 1}: ${p}`))
  }
  for (const lesson of level.lessons) {
    for (const ex of lesson.exercises || []) {
      for (const p of issues.exercises[ex.id] || []) lines.push(`${lesson.title} / ${ex.type} (${ex.id}): ${p}`)
    }
  }
  fail(['Fix these before publishing:', ...lines].join('\n  '))
}

// Progress is stored per lesson id, so two topics sharing one would complete each other.
function checkLessonIds(level) {
  const ids = new Set(level.lessons.map(l => l.id))
  if (ids.size !== level.lessons.length) fail('Two lessons in this level share an id.')
  for (const file of readdirSync(DATA).filter(f => f.endsWith('.json') && f !== `${level.id}.json`)) {
    let other
    try { other = JSON.parse(readFileSync(join(DATA, file), 'utf8')) } catch { continue }
    const clash = (other.lessons || []).find(l => ids.has(l.id))
    if (clash) fail(`Lesson id "${clash.id}" is already used by ${file}.`)
  }
}

function register(id) {
  const source = readFileSync(COURSE_FILE, 'utf8')
  const importPath = `./${id}.json`
  if (source.includes(`'${importPath}'`)) return false

  const name = 'topic_' + id.replace(/\W/g, '_')
  const lines = source.split('\n')
  const lastImport = lines.findLastIndex(l => l.startsWith('import '))
  lines.splice(lastImport + 1, 0, `import ${name} from '${importPath}'`)
  const next = lines.join('\n').replace(/levels: \[([^\]]*)\]/, (_, list) => `levels: [${list.trim()}, ${name}]`)
  if (!next.includes(`, ${name}]`)) fail('Could not find the levels list in data/course.js.')
  writeFileSync(COURSE_FILE, next)
  return true
}

const level = readLevel(process.argv[2])
checkLessonIds(level)
writeFileSync(join(DATA, `${level.id}.json`), JSON.stringify(level, null, 2) + '\n')
const added = register(level.id)

const exercises = level.lessons.reduce((n, l) => n + l.exercises.length, 0)
console.log(`${added ? 'Added' : 'Updated'} "${level.title}": ${level.lessons.length} lessons, ${exercises} exercises.`)
console.log('Commit and push to put it live.')
