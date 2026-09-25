// Writes data/special-meta.json: what the browser may know about special
// topics (title, price, lesson titles and sizes) without their exercises.
// Runs before every build and after add-topic.
import { writeFileSync } from 'fs'
import { join } from 'path'
import { SPECIAL_LEVELS } from '../data/special.js'
import { specialMeta } from '../lib/publishTopic.js'

writeFileSync(join(import.meta.dir, '..', 'data', 'special-meta.json'), JSON.stringify(SPECIAL_LEVELS.map(specialMeta), null, 2) + '\n')
console.log(`Special topics: ${SPECIAL_LEVELS.length}`)
