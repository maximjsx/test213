import Link from 'next/link'
import TopicArt from '../TopicArt'
import Button from '../ui/Button'
import styles from './Home.module.css'

// The one obvious next step, so starting a lesson is a single tap from home
export default function ResumeCard({ resume, isNew, streak, streakAtRisk, mistakeCount, onStart }) {
  const { lesson, level } = resume
  const idx = level.lessons.indexOf(lesson)
  const heading = streakAtRisk ? `Do one lesson to keep your ${streak}-day streak`
    : isNew ? 'Start here'
    : 'Up next'
  return (
    <section className={`${styles.resume} ${streakAtRisk ? styles.resumeAtRisk : ''}`}>
      <div className={styles.resumeMain}>
        <span className={styles.resumeDisc} style={{ background: level.color }}>
          <TopicArt level={level} size={40} />
        </span>
        <div className={styles.resumeText}>
          <div className={styles.resumeHeading}>{heading}</div>
          <div className={styles.resumeTitle}>{level.title}: {lesson.title}</div>
          <div className={styles.resumeSub}>Lesson {idx + 1} of {level.lessons.length}</div>
        </div>
      </div>
      <Button size="lg" block color={level.color} onClick={onStart}>Start +{lesson.xp} XP</Button>
      <PracticeMistakesLink count={mistakeCount} />
    </section>
  )
}

export function PracticeMistakesLink({ count }) {
  if (!count) return null
  return (
    <Link href="/practice" className={styles.resumePractice}>
      <img src="/icons/broken_heart.png" alt="" width={18} height={18} />
      Practice {count} {count === 1 ? 'mistake' : 'mistakes'}
    </Link>
  )
}
