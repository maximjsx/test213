'use client'
import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { LEVELS, findLevelIndex, lessonHref } from '../../../lib/course'
import { useProgress } from '../../../hooks/useProgress'
import { onSplashFinished } from '../../../lib/splash'
import { unlockAudio } from '../../../lib/audio'
import LessonPath from '../../../components/LessonPath'
import TopicArt from '../../../components/TopicArt'
import Chevron from '../../../components/Chevron'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { TopicSkeleton } from '../../../components/PageSkeletons'
import styles from './page.module.css'

// The lesson finished in the last few seconds, so its node pops and its
// connector draws in once when the learner lands back here.
function recentlyCompleted(lessons) {
  let best = null, bestAt = 0
  for (const [id, v] of Object.entries(lessons || {})) {
    if (v?.completedAt > bestAt) { bestAt = v.completedAt; best = id }
  }
  return best && Date.now() - bestAt < 8000 ? best : null
}

export default function TopicPage() {
  const { id } = useParams()
  const { state, hydrated, isLessonComplete, isLessonUnlocked, levelProgress } = useProgress()
  const levelIndex = findLevelIndex(id)
  const level = LEVELS[levelIndex]
  const router = useRouter()
  const currentRef = useRef(null)
  const justCompletedId = useMemo(() => recentlyCompleted(state.lessons), [state.lessons])

  useEffect(() => {
    if (!hydrated) return
    return onSplashFinished(() => {
      const el = currentRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: Math.max(0, top - window.innerHeight / 2 + 60), behavior: 'smooth' })
    })
  }, [hydrated])

  if (!level) {
    return (
      <div className={styles.notFound}>
        <p>Topic not found.</p>
        <Button variant="secondary" href="/"><Chevron /> All topics</Button>
      </div>
    )
  }
  if (!hydrated) return <TopicSkeleton />

  const { done, total } = levelProgress(level.lessons)
  const nextIdx = level.lessons.findIndex((l, idx) => isLessonUnlocked(level.lessons, idx) && !isLessonComplete(l.id))
  const nextLesson = level.lessons[nextIdx]
  const nextTopic = LEVELS[levelIndex + 1]

  return (
    <div className={styles.page} style={{ '--lvl': level.color }}>
      <PageHeader backLabel="Topics">
        <Link href={`/level/${level.id}`} className={styles.notesBtn}>
          <img src="/icons/open_book.png" alt="" width={20} height={20} /> NOTES
        </Link>
      </PageHeader>

      <section className={styles.hero}>
        <span className={styles.heroDisc} style={{ background: level.color }}>
          <TopicArt level={level} size={54} />
        </span>
        <div className={styles.heroText}>
          <h1 className={styles.title}>{level.title}</h1>
          <p className={styles.subtitle}>{level.subtitle}</p>
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </div>
            <span className={styles.progressText}>{done} of {total}</span>
          </div>
        </div>
        {nextLesson && (
          <Button
            size="lg"
            color={level.color}
            className={styles.startBtn}
            onClick={() => {
              unlockAudio()
              router.push(lessonHref(nextLesson, level))
            }}
          >
            {done ? `Continue: lesson ${nextIdx + 1}` : 'Start lesson 1'}
          </Button>
        )}
      </section>

      <main className={styles.main}>
        <LessonPath
          level={level}
          levelIndex={levelIndex}
          isLessonComplete={isLessonComplete}
          isLessonUnlocked={isLessonUnlocked}
          justCompletedId={justCompletedId}
          currentRef={currentRef}
        />
        {!nextLesson && nextTopic && (
          <Link href={`/topic/${nextTopic.id}`} className={styles.nextTopic} style={{ '--next': nextTopic.color }}>
            <span className={styles.nextTopicLabel}>Topic complete. Next up</span>
            <span className={styles.nextTopicTitle}>{nextTopic.title} <Chevron dir="right" /></span>
          </Link>
        )}
      </main>
    </div>
  )
}
