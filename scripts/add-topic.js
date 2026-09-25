// Adds a level exported from the builder ("Export JSON") to the main course
// as a topic bubble. Running it again with a newer export updates the topic.
// Special topics go to data/special.js, which never reaches the browser.
//
//   bun run add-topic path/to/level.json
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { topicProblems, topicJson, registerTopic, unregisterTopic, registryFor, otherRegistry } from '../lib/publishTopic.js'

const ROOT = join(import.meta.dir, '..')
const DATA = join(ROOT, 'data')

function fail(message) {
  console.error(message)
  process.exit(1)
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
}

function edit(path, change) {
  const file = join(ROOT, path)
  const before = readFileSync(file, 'utf8')
  const after = change(before)
  if (after !== before) writeFileSync(file, after)
  return after !== before
}

const path = process.argv[2]
if (!path) fail('Usage: bun run add-topic path/to/level.json')
const level = readJson(path)
if (!level) fail(`Could not read ${path}.`)

const otherLevels = readdirSync(DATA)
  .filter(f => f.endsWith('.json') && !f.startsWith('special-meta'))
  .map(f => readJson(join(DATA, f)))
  .filter(l => l?.lessons)
const problems = topicProblems(level, otherLevels)
if (problems.length) fail(['Fix these before publishing:', ...problems].join('\n  '))

writeFileSync(join(DATA, `${level.id}.json`), topicJson(level))
const target = registryFor(level)
const added = edit(target.path, s => registerTopic(s, level.id, target))
const other = otherRegistry(level)
edit(other.path, s => unregisterTopic(s, level.id, other))

const meta = Bun.spawnSync(['bun', join(ROOT, 'scripts', 'special-meta.js')])
if (meta.exitCode !== 0) fail(meta.stderr.toString())

const exercises = level.lessons.reduce((n, l) => n + l.exercises.length, 0)
console.log(`${added ? 'Added' : 'Updated'} ${level.special ? 'special ' : ''}topic "${level.title}": ${level.lessons.length} lessons, ${exercises} exercises.`)
console.log('Commit and push to put it live.')
