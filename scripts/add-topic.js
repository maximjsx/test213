// Adds a level exported from the builder ("Export JSON") to the main course
// as a topic bubble. Running it again with a newer export updates the topic.
//
//   bun run add-topic path/to/level.json
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { topicProblems, topicJson, registerTopic } from '../lib/publishTopic.js'

const DATA = join(import.meta.dir, '..', 'data')
const COURSE_FILE = join(DATA, 'course.js')

function fail(message) {
  console.error(message)
  process.exit(1)
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
}

const path = process.argv[2]
if (!path) fail('Usage: bun run add-topic path/to/level.json')
const level = readJson(path)
if (!level) fail(`Could not read ${path}.`)

const otherLevels = readdirSync(DATA)
  .filter(f => f.endsWith('.json'))
  .map(f => readJson(join(DATA, f)))
  .filter(Boolean)
const problems = topicProblems(level, otherLevels)
if (problems.length) fail(['Fix these before publishing:', ...problems].join('\n  '))

writeFileSync(join(DATA, `${level.id}.json`), topicJson(level))
const course = readFileSync(COURSE_FILE, 'utf8')
const registered = registerTopic(course, level.id)
if (registered !== course) writeFileSync(COURSE_FILE, registered)

const exercises = level.lessons.reduce((n, l) => n + l.exercises.length, 0)
console.log(`${registered !== course ? 'Added' : 'Updated'} "${level.title}": ${level.lessons.length} lessons, ${exercises} exercises.`)
console.log('Commit and push to put it live.')
