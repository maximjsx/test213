'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

function loadLevels() {
  try { return JSON.parse(localStorage.getItem('builder_levels') || '[]') } catch { return [] }
}
function saveLevels(levels) {
  try { localStorage.setItem('builder_levels', JSON.stringify(levels)) } catch {}
}

function decodeLevel(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((str.length % 4) || 4)
    return JSON.parse(decodeURIComponent(
      Array.from(atob(b64)).map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ))
  } catch { return null }
}

function ImportPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [level, setLevel] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const d = params.get('d')
    if (!d) { setError('No level data found in this URL.'); return }
    const decoded = decodeLevel(d)
    if (!decoded || !decoded.title) { setError('Could not decode level data. The link may be corrupted.'); return }
    setLevel(decoded)
  }, [params])

  function saveImported() {
    const imported = { ...level, id: 'custom_' + Date.now() }
    saveLevels([...loadLevels(), imported])
    return imported.id
  }

  function addToMyLevels() {
    saveImported()
    setDone(true)
  }

  function playNow() {
    const tempId = 'temp_' + Date.now()
    try { localStorage.setItem('builder_temp_level', JSON.stringify({ ...level, id: tempId })) } catch {}
    router.push('/builder/play/' + tempId)
  }

  if (done) return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.doneEmoji}>✓</div>
        <h2 className={styles.doneTitle}>Level added!</h2>
        <p className={styles.doneSub}>"{level.title}" is now in your Level Builder.</p>
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

  if (!level) return <div className={styles.loading}>Decoding level…</div>

  const totalExercises = level.lessons?.reduce((n, l) => n + (l.exercises?.length || 0), 0) || 0

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href="/builder" className={styles.backBtn}>
          <img src="/icons/gray_x.png" alt="✕" width={18} height={18} />
        </Link>
        <span className={styles.topTitle}>Shared Level</span>
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
                Add to My Levels
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
