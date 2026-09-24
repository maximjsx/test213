import Link from 'next/link'
import TopicArt from '../TopicArt'
import Button from '../ui/Button'
import styles from './Home.module.css'

// The one obvious next step, so starting a lesson is a single tap from home
export default function ResumeCard({ resume, isNew, streak, streakAtRisk, onStart, className = '' }) {
  const { lesson, level } = resume
  const idx = level.lessons.indexOf(lesson)
  const heading = streakAtRisk ? `Do one lesson to keep your ${streak}-day streak`
    : isNew ? 'Start here'
    : 'Up next'
  return (
    <section className={`${styles.card} ${styles.resume} ${streakAtRisk ? styles.resumeAtRisk : ''} ${className}`}>
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
      <Button size="lg" block color={level.color} onClick={onStart}>Start +{lesson.coins} coins</Button>
    </section>
  )
}

export function ArrowRight({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function PracticeMistakesLink({ count, className = '' }) {
  if (!count) return null
  return (
    <Link href="/practice/mistakes" className={`${styles.cta} ${count <= 3 ? styles.ctaFew : ''} ${className}`}>
      <img src="/icons/broken_heart.png" alt="" width={32} height={32} />
      <span className={styles.ctaText}>
        <span className={styles.ctaTitle}>Practice {count} {count === 1 ? 'mistake' : 'mistakes'}</span>
        <span className={styles.ctaSub}>Fix them while they are fresh</span>
      </span>
      <span className={styles.ctaArrow}><ArrowRight /></span>
    </Link>
  )
}
