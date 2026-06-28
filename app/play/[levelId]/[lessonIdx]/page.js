import { readFileSync } from 'fs'
import { join } from 'path'
import PlayLesson from './PlayLesson'

export default function PlayPage({ params }) {
  const { levelId, lessonIdx } = params
  let level, lesson
  try {
    const raw = readFileSync(join(process.cwd(), 'data', `${levelId}.json`), 'utf-8')
    level = JSON.parse(raw)
    lesson = level.lessons[parseInt(lessonIdx, 10)]
  } catch {}

  if (!level || !lesson) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)', fontFamily: "'Nunito', sans-serif" }}>
        Lesson not found.
      </div>
    )
  }

  return <PlayLesson level={level} lesson={lesson} />
}
