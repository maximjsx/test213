'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { addLevel, decodeLevel, newLevelId, saveTempLevel, countExercises } from '../../../lib/builderStore'
import styles from './page.module.css'

function ImportPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [level, setLevel] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const d = params.get('d')
    if (!d) { setError('No topic data found in this URL.'); return }
    const decoded = decodeLevel(d)
    if (!decoded || !decoded.title) { setError('Could not decode topic data. The link may be corrupted.'); return }
    setLevel(decoded)
  }, [params])

  function addToMyLevels() {
    addLevel({ ...level, id: newLevelId() })
    setDone(true)
  }

  function playNow() {
    const tempId = 'temp_' + Date.now()
    saveTempLevel({ ...level, id: tempId })
    router.push('/builder/play/' + tempId)
  }

  if (done) return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.doneEmoji}>✓</div>
        <h2 className={styles.doneTitle}>Topic added!</h2>
        <p className={styles.doneSub}>"{level.title}" is now in your Topic Builder.</p>
        <div className={styles.doneActions}>
          <Link href="/builder" className={styles.btnPrimary}>Go to Builder</Link>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className={styles.page}>
      <div className={styles.center}>
        <p className={styles.errorText}>{error}</p>
        <Link href="/builder" className={styles.btnSecondary}>Go to Builder</Link>
      </div>
    </div>
  )

  if (!level) return <div className={styles.loading}>Decoding topic…</div>

  const totalExercises = countExercises(level)

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href="/builder" className={styles.backBtn}>
          <img src="/icons/close.svg" alt="Back to builder" width={18} height={18} />
        </Link>
        <span className={styles.topTitle}>Shared Topic</span>
        <div style={{ width: 34 }} />
      </div>

      <div className={styles.content}>
        <div className={styles.preview}>
          <div className={styles.previewTop} style={{ background: level.color }}>
            <span className={styles.previewIcon}>{level.icon}</span>
          </div>
          <div className={styles.previewBody}>
            <div className={styles.previewTitle}>{level.title}</div>
            <div className={styles.previewSub}>{level.subtitle}</div>
            <div className={styles.previewMeta}>
              {level.lessons?.length || 0} lesson{level.lessons?.length !== 1 ? 's' : ''} · {totalExercises} exercises
            </div>

            {level.lessons?.length > 0 && (
              <div className={styles.lessonList}>
                {level.lessons.map((lesson, i) => (
                  <div key={i} className={styles.lessonRow}>
                    <span className={styles.lessonNum} style={{ background: level.color }}>{i + 1}</span>
                    <span className={styles.lessonTitle}>{lesson.title}</span>
                    <span className={styles.lessonCount}>{lesson.exercises?.length || 0} ex</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.btnGroup}>
              {level.lessons?.length > 0 && (
                <button className={styles.playBtn} onClick={playNow}>
                  ▶ Play
                </button>
              )}
              <button className={styles.addBtn} onClick={addToMyLevels}>
                Add to My Topics
              </button>
            </div>
            <Link href="/builder" className={styles.skipLink}>View Builder without adding</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
      <ImportPageInner />
    </Suspense>
  )
}
