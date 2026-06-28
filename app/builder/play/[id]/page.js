'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

function loadLevel(id) {
  try {
    const levels = JSON.parse(localStorage.getItem('builder_levels') || '[]')
    return levels.find(l => l.id === id) || null
  } catch { return null }
}

export default function BuilderPlayPage() {
  const { id } = useParams()
  const router = useRouter()
  const [level, setLevel] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLevel(loadLevel(id))
    setReady(true)
  }, [id])

  if (!ready) return <div className={styles.loading}>Loading…</div>
  if (!level) return (
    <div className={styles.loading}>
      Level not found. <Link href="/builder" className={styles.link}>← Builder</Link>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.topBar} style={{ borderBottom: `3px solid ${level.color}` }}>
        <div className={styles.topBarInner}>
          <button className={styles.backBtn} onClick={() => router.push('/builder')}>
            <img src="/icons/gray_x.png" alt="✕" width={18} height={18} />
          </button>
          <span className={styles.topTitle}>Play Preview</span>
          <Link href={'/builder/' + id} className={styles.editLink}>Edit</Link>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.levelChip} style={{ background: level.color + '30', color: level.color }}>
          {level.icon} {level.title}
        </div>
        <h1 className={styles.title}>{level.subtitle}</h1>

        {level.lessons.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No lessons yet.</p>
            <Link href={'/builder/' + id} className={styles.emptyBtn}>Add lessons in editor</Link>
          </div>
        ) : (
          <div className={styles.lessonList}>
            {level.lessons.map((lesson, idx) => (
              <Link
                key={lesson.id}
                href={`/builder/lesson/${id}/${idx}`}
                className={styles.lessonCard}
                style={{ '--lc': level.color }}
              >
                <div className={styles.lessonNum} style={{ background: level.color }}>{idx + 1}</div>
                <div className={styles.lessonInfo}>
                  <div className={styles.lessonTitle}>{lesson.title}</div>
                  <div className={styles.lessonMeta}>
                    {lesson.exercises?.length || 0} exercise{lesson.exercises?.length !== 1 ? 's' : ''} · {lesson.xp} XP
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
