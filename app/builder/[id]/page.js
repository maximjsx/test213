'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getTTSMuted, setTTSMuted } from '../../../lib/audio'
import { loadLevels, saveLevel, deleteLevel, shareUrl, copyText, downloadJson } from '../../../lib/builderStore'
import { validateLevel } from '../../../lib/levelSchema'
import { EXERCISE_TYPES, defaultExercise, defaultLesson, exerciseSummary } from '../../../components/builder/exerciseTypes'
import ExerciseEditor, { FieldRow } from '../../../components/builder/ExerciseEditor'
import { ImageField } from '../../../components/builder/MediaControls'
import BuilderGate from '../../../components/builder/BuilderGate'
import PublishButton from '../../../components/builder/PublishButton'
import SyncStatus from '../../../components/builder/SyncStatus'
import TopicArt from '../../../components/TopicArt'
import Markdown from '../../../components/ui/Markdown'
import Modal, { ModalText, ModalActions } from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { clickable } from '../../../lib/a11y'
import SpecialTopicFields from '../../../components/builder/SpecialTopicFields'
import styles from '../../../components/builder/LevelEditor.module.css'

function ExpandIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1h4v4" /><path d="M1 8v4h4" />
      <line x1="12" y1="1" x2="7" y2="6" /><line x1="1" y1="12" x2="6" y2="7" />
    </svg>
  )
}
function CollapseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5H8V1" /><path d="M1 8h4v4" />
      <line x1="8" y1="5" x2="13" y2="0" /><line x1="0" y1="13" x2="5" y2="8" />
    </svg>
  )
}

function countLessonIssues(issues, lesson, li) {
  const own = issues.lessons[li]?.length || 0
  return (lesson.exercises || []).reduce((n, ex) => n + (issues.exercises[ex.id]?.length || 0), own)
}

// Tells the author whether this level is ready for `bun run add-topic`
function IssuesBar({ count, levelProblems }) {
  if (!count) return <div className={`${styles.issuesBar} ${styles.issuesBarOk}`}>Ready to publish. Export the JSON and run <code>bun run add-topic</code>.</div>
  return (
    <div className={styles.issuesBar}>
      {count} {count === 1 ? 'thing' : 'things'} to fix before publishing. Look for the orange badges.
      {levelProblems.length > 0 && <span> {levelProblems.join(' ')}</span>}
    </div>
  )
}

function IssueList({ problems }) {
  if (!problems?.length) return null
  return (
    <ul className={styles.issueList}>
      {problems.map(p => <li key={p}>{p}</li>)}
    </ul>
  )
}

export default function LevelEditor() {
  const { id } = useParams()
  const router = useRouter()
  const [level, setLevel] = useState(null)
  const [ready, setReady] = useState(false)
  const [expandedLessons, setExpandedLessons] = useState(new Set())
  const [expandedEx, setExpandedEx] = useState({}) // { [lessonIdx]: Set<exIdx> }
  const [addExLesson, setAddExLesson] = useState(null)
  const [showLessons, setShowLessons] = useState(true)
  const [notesTab, setNotesTab] = useState('edit') // 'edit' | 'preview'
  const [confirmDelete, setConfirmDelete] = useState(null) // { type: 'lesson'|'level', li?, label }
  const [showSettings, setShowSettings] = useState(true)
  const [maximized, setMaximized] = useState(null) // null | 'settings' | 'lessons'
  const [exportFlash, setExportFlash] = useState(false)
  const [shareFlash, setShareFlash] = useState(false)
  const [ttsMuted, setTtsMuted] = useState(() => getTTSMuted())

  useEffect(() => {
    if (!maximized) { document.body.style.overflow = ''; return }
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') setMaximized(null) }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [maximized])

  useEffect(() => {
    const found = loadLevels().find(l => l.id === id)
    if (found) {
      setLevel(found)
      if (found.lessons.length > 0) setExpandedLessons(new Set([0]))
    }
    setReady(true)
  }, [id])

  const updateLevel = useCallback((updater) => {
    setLevel(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      saveLevel(next)
      return next
    })
  }, [])

  const issues = useMemo(() => (level ? validateLevel(level) : null), [level])

  // ── lesson helpers ──
  function addLesson() {
    const lesson = defaultLesson(id)
    updateLevel(prev => {
      const lessons = [...prev.lessons, lesson]
      setTimeout(() => setExpandedLessons(prev => { const next = new Set(prev); next.add(lessons.length - 1); return next }), 0)
      return { ...prev, lessons }
    })
  }
  function deleteLesson(li) {
    updateLevel(prev => {
      const lessons = prev.lessons.filter((_, i) => i !== li)
      setExpandedLessons(prev => {
        const next = new Set()
        for (const idx of prev) {
          if (idx < li) next.add(idx)
          else if (idx > li) next.add(idx - 1)
        }
        return next
      })
      return { ...prev, lessons }
    })
    setConfirmDelete(null)
  }
  function deleteLevelAndExit() {
    deleteLevel(id)
    router.push('/builder')
  }
  function moveLesson(li, dir) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      const j = li + dir
      if (j < 0 || j >= lessons.length) return prev;
      [lessons[li], lessons[j]] = [lessons[j], lessons[li]]
      setExpandedLessons(prev => {
        const next = new Set(prev)
        const hadLi = next.has(li), hadJ = next.has(j)
        if (hadLi) { next.delete(li); next.add(j) }
        if (hadJ) { next.delete(j); next.add(li) }
        return next
      })
      return { ...prev, lessons }
    })
  }
  function setLessonField(li, field, val) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      lessons[li] = { ...lessons[li], [field]: val }
      return { ...prev, lessons }
    })
  }

  // ── exercise helpers ──
  function addExercise(li, type) {
    const ex = defaultExercise(type)
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      const exercises = [...(lessons[li].exercises || []), ex]
      lessons[li] = { ...lessons[li], exercises }
      setExpandedEx(prev => {
        const set = new Set(prev[li] || [])
        set.add(exercises.length - 1)
        return { ...prev, [li]: set }
      })
      return { ...prev, lessons }
    })
    setAddExLesson(null)
  }
  function deleteExercise(li, ei) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      lessons[li] = { ...lessons[li], exercises: lessons[li].exercises.filter((_, i) => i !== ei) }
      return { ...prev, lessons }
    })
  }
  function moveExercise(li, ei, dir) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      const exercises = [...lessons[li].exercises]
      const j = ei + dir
      if (j < 0 || j >= exercises.length) return prev;
      [exercises[ei], exercises[j]] = [exercises[j], exercises[ei]]
      lessons[li] = { ...lessons[li], exercises }
      return { ...prev, lessons }
    })
  }
  function updateExercise(li, ei, ex) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      const exercises = [...lessons[li].exercises]
      exercises[ei] = ex
      lessons[li] = { ...lessons[li], exercises }
      return { ...prev, lessons }
    })
  }
  function toggleEx(li, ei) {
    setExpandedEx(prev => {
      const set = new Set(prev[li] || [])
      if (set.has(ei)) set.delete(ei); else set.add(ei)
      return { ...prev, [li]: set }
    })
  }

  function shareLevel() {
    const url = shareUrl(level)
    if (!url) return
    const flash = () => {
      setShareFlash(true)
      setTimeout(() => setShareFlash(false), 2500)
    }
    copyText(url).then(flash, flash)
  }

  function exportJSON() {
    downloadJson(level)
    setExportFlash(true)
    setTimeout(() => setExportFlash(false), 2000)
  }

  if (!ready) return <div className={styles.loading}>Loading…</div>
  if (!level) return (
    <div className={styles.notFound}>
      Topic not found.{' '}
      <Link href="/builder" className={styles.link}>Back to Builder</Link>
    </div>
  )

  return (
    <BuilderGate>
    <div className={styles.page}>

      {confirmDelete && (
        <Modal
          role="alertdialog"
          size="sm"
          title={confirmDelete.type === 'level' ? 'Delete topic?' : 'Delete lesson?'}
          onClose={() => setConfirmDelete(null)}
        >
          <ModalText>
            "{confirmDelete.label}" and all its {confirmDelete.type === 'level' ? 'lessons' : 'exercises'} will be permanently removed.
          </ModalText>
          <ModalActions>
            <Button variant="danger" block onClick={() => confirmDelete.type === 'level' ? deleteLevelAndExit() : deleteLesson(confirmDelete.li)}>Delete</Button>
            <Button variant="secondary" block onClick={() => setConfirmDelete(null)} data-autofocus>Cancel</Button>
          </ModalActions>
        </Modal>
      )}

      <div className={styles.topBar}>
        <Link href="/builder" className={styles.backBtn} title="Back to Builder">
          <img src="/icons/close.svg" alt="Back to builder" width={18} height={18} />
        </Link>
        <div className={styles.topCenter}>
          <span className={styles.topLevel} style={{ color: level.color }}>{level.icon}</span>
          <span className={styles.topTitle}>{level.title}</span>
          <SyncStatus />
        </div>
        <div className={styles.topActions}>
          {level.lessons.length > 0 && (
            <Link href={'/builder/play/' + level.id} className={styles.playBtn} style={{ background: level.color }}>
              ▶ Play
            </Link>
          )}
          <button
            className={`${styles.muteBtn} ${ttsMuted ? styles.muteBtnOff : ''}`}
            onClick={() => { setTTSMuted(!ttsMuted); setTtsMuted(!ttsMuted) }}
            title={ttsMuted ? 'Unmute TTS' : 'Mute TTS'}
          >{ttsMuted ? '🔇' : '🔊'}</button>
          <button className={`${styles.shareBtn} ${shareFlash ? styles.shareBtnFlash : ''}`} onClick={shareLevel}>
            {shareFlash ? 'Link copied!' : 'Share'}
          </button>
          <button className={`${styles.exportBtn} ${exportFlash ? styles.exportFlash : ''}`} onClick={exportJSON}>
            {exportFlash ? 'Exported!' : 'Export JSON'}
          </button>
          <PublishButton level={level} className={styles.exportBtn} />
          <button className={styles.deleteTopBtn} onClick={() => setConfirmDelete({ type: 'level', label: level.title })} title="Delete topic">
            🗑️
          </button>
        </div>
      </div>

      <IssuesBar count={issues.count} levelProblems={issues.level} />

      <div className={styles.editor}>

        {/* Level settings */}
        {maximized === 'settings' && <div className={styles.backdrop} onClick={() => setMaximized(null)} />}
        <div className={maximized === 'settings' ? styles.sectionFull : styles.section}>
          <div className={`${styles.sectionToggleRow} ${maximized === 'settings' ? styles.sectionFullHeader : ''}`}>
            <button className={styles.sectionToggle} onClick={() => maximized !== 'settings' && setShowSettings(v => !v)}>
              <span className={styles.sectionToggleLabel}>Topic Settings</span>
              <span className={`${styles.chevron} ${(showSettings || maximized === 'settings') ? styles.chevronUp : ''}`} />
            </button>
            <button className={styles.maximizeBtn} onClick={() => setMaximized(v => v === 'settings' ? null : 'settings')} title={maximized === 'settings' ? 'Minimize' : 'Expand'}>
              {maximized === 'settings' ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </div>

          {(showSettings || maximized === 'settings') && (
            <div className={maximized === 'settings' ? styles.sectionFullBody : styles.sectionBody}>
              <div className={styles.settingsGrid}>
                <FieldRow label="Title">
                  <input className={styles.input} value={level.title} placeholder="Topic title" onChange={e => updateLevel({ title: e.target.value })} />
                </FieldRow>
                <FieldRow label="Subtitle">
                  <input className={styles.input} value={level.subtitle} placeholder="Short description" onChange={e => updateLevel({ subtitle: e.target.value })} />
                </FieldRow>
                <FieldRow label="Color">
                  <div className={styles.colorRow}>
                    <input type="color" className={styles.colorPicker} value={level.color} onChange={e => updateLevel({ color: e.target.value })} />
                    <input className={styles.input} value={level.color} style={{ width: 100, fontFamily: 'monospace' }} onChange={e => updateLevel({ color: e.target.value })} />
                  </div>
                </FieldRow>
                <FieldRow label="Icon / Short label" hint="2-4 chars shown in the topic bubble when there is no picture">
                  <input className={styles.input} style={{ width: 90 }} value={level.icon} placeholder="★" maxLength={6} onChange={e => updateLevel({ icon: e.target.value })} />
                </FieldRow>
                <FieldRow label="Topic picture" hint="Shown inside the round topic bubble on the home page. A square PNG with a transparent background looks best.">
                  <div className={styles.bubbleRow}>
                    <span className={styles.bubblePreview} style={{ background: level.color }}>
                      <TopicArt level={level} size={50} />
                    </span>
                    <ImageField image={level.image || null} onChange={img => updateLevel({ image: img })} courseId={id} label="Topic picture" />
                  </div>
                </FieldRow>
                <FieldRow label="Access" hint="Special topics show locked on the home path. Server ids: Discord settings, Advanced, Developer Mode, then right-click the server.">
                  <SpecialTopicFields special={level.special} onChange={special => updateLevel({ special })} />
                </FieldRow>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.notesTabRow}>
                  <label className={styles.fieldLabel}>Notes (Markdown)</label>
                  <div className={styles.tabToggle}>
                    <button className={`${styles.tabBtn} ${notesTab === 'edit' ? styles.tabBtnActive : ''}`} onClick={() => setNotesTab('edit')}>Edit</button>
                    <button className={`${styles.tabBtn} ${notesTab === 'preview' ? styles.tabBtnActive : ''}`} onClick={() => setNotesTab('preview')}>Preview</button>
                  </div>
                </div>
                {notesTab === 'edit' ? (
                  <textarea
                    className={styles.textarea}
                    value={level.notes}
                    rows={10}
                    placeholder={'## Vocabulary\n\n| Bulgarian | English |\n|-----------|--------|\n| Здравей | Hello |\n\n- **Здравей** - informal greeting'}
                    onChange={e => updateLevel({ notes: e.target.value })}
                  />
                ) : (
                  <div className={styles.notesPreview}>
                    {level.notes?.trim() ? <Markdown text={level.notes} /> : <p className={styles.notesEmpty}>Nothing to preview yet.</p>}
                  </div>
                )}
                <div className={styles.fieldHint}>Shown on the topic's Notes page. {'Supports ## headings, | tables |, - and 1. lists, > tips, **bold**, *italic*, `code`'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Lessons */}
        {maximized === 'lessons' && <div className={styles.backdrop} onClick={() => setMaximized(null)} />}
        <div className={maximized === 'lessons' ? styles.sectionFull : styles.section}>
          <div className={`${styles.sectionToggleRow} ${maximized === 'lessons' ? styles.sectionFullHeader : ''}`}>
            <button className={styles.sectionToggle} onClick={() => maximized !== 'lessons' && setShowLessons(v => !v)}>
              <span className={styles.sectionToggleLabel}>Lessons <span className={styles.sectionCount}>({level.lessons.length})</span></span>
              <span className={`${styles.chevron} ${(showLessons || maximized === 'lessons') ? styles.chevronUp : ''}`} />
            </button>
            <button className={`${styles.addBtn} ${styles.addBtnInline}`} onClick={addLesson}>+ Add Lesson</button>
            <button className={styles.maximizeBtn} onClick={() => setMaximized(v => v === 'lessons' ? null : 'lessons')} title={maximized === 'lessons' ? 'Minimize' : 'Expand'}>
              {maximized === 'lessons' ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </div>

          {(showLessons || maximized === 'lessons') && (
          <div className={maximized === 'lessons' ? styles.sectionFullBody : styles.noWrap}>
          {level.lessons.length === 0 && (
            <div className={styles.emptyHint}>No lessons yet. Add one to get started.</div>
          )}

          {level.lessons.map((lesson, li) => {
            const isOpen = expandedLessons.has(li)
            const exSet = expandedEx[li] || new Set()
            const lessonIssues = countLessonIssues(issues, lesson, li)
            return (
              <div key={lesson.id} className={`${styles.lessonCard} ${isOpen ? styles.lessonCardOpen : ''}`}>
                {/* lesson header */}
                <div className={styles.lessonHeader} aria-expanded={isOpen} {...clickable(() => setExpandedLessons(prev => { const next = new Set(prev); if (next.has(li)) next.delete(li); else next.add(li); return next }))}>
                  <div className={styles.lessonHeaderLeft}>
                    <span className={styles.lessonNumBadge}>{li + 1}</span>
                    <span className={styles.lessonTitle}>{lesson.title}</span>
                    <span className={styles.lessonMeta}>{lesson.exercises?.length || 0} ex · {lesson.coins} coins</span>
                    {lessonIssues > 0 && <span className={styles.issueBadge} title="Things to fix">{lessonIssues}</span>}
                  </div>
                  <div className={styles.lessonHeaderRight} onClick={e => e.stopPropagation()}>
                    {lesson.exercises?.length > 0 && (
                      <Link href={`/builder/lesson/${level.id}/${li}`} className={styles.testBtn} title="Play just this lesson">Test</Link>
                    )}
                    <button className={styles.iconBtn} onClick={() => moveLesson(li, -1)} disabled={li === 0} title="Move up">↑</button>
                    <button className={styles.iconBtn} onClick={() => moveLesson(li, 1)} disabled={li === level.lessons.length - 1} title="Move down">↓</button>
                    <button className={styles.iconBtnDanger} onClick={() => setConfirmDelete({ li, label: lesson.title })} title="Delete lesson">✕</button>
                    <span className={`${styles.chevron} ${isOpen ? styles.chevronUp : ''}`} />
                  </div>
                </div>

                {/* lesson body */}
                {isOpen && (
                  <div className={styles.lessonBody}>
                    <IssueList problems={issues.lessons[li]} />
                    <div className={styles.lessonFieldsRow}>
                      <FieldRow label="Lesson title">
                        <input className={styles.input} value={lesson.title} onChange={e => setLessonField(li, 'title', e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Coin reward">
                        <input className={styles.input} type="number" min={1} max={999} value={lesson.coins} style={{ width: 80 }} onChange={e => setLessonField(li, 'coins', parseInt(e.target.value) || 10)} />
                      </FieldRow>
                    </div>

                    <div className={styles.exercisesHeader}>
                      <span className={styles.exercisesLabel}>Exercises ({lesson.exercises?.length || 0})</span>
                    </div>

                    {(lesson.exercises || []).map((ex, ei) => {
                      const typeInfo = EXERCISE_TYPES.find(t => t.type === ex.type)
                      const isExOpen = exSet.has(ei)
                      const exProblems = issues.exercises[ex.id]
                      return (
                        <div key={ex.id || ei} className={`${styles.exCard} ${isExOpen ? styles.exCardOpen : ''}`}>
                          <div className={styles.exHeader} aria-expanded={isExOpen} {...clickable(() => toggleEx(li, ei))}>
                            <div className={styles.exHeaderLeft}>
                              <span className={styles.exTypeBadge}>
                                {typeInfo?.icon} {typeInfo?.label || ex.type}
                              </span>
                              {exProblems && <span className={styles.issueBadge} title={exProblems.join(' ')}>{exProblems.length}</span>}
                              {!isExOpen && (
                                <span className={styles.exSummary}>{exerciseSummary(ex)}</span>
                              )}
                            </div>
                            <div className={styles.exHeaderRight} onClick={e => e.stopPropagation()}>
                              <button className={styles.iconBtnSm} onClick={() => moveExercise(li, ei, -1)} disabled={ei === 0} title="Move up">↑</button>
                              <button className={styles.iconBtnSm} onClick={() => moveExercise(li, ei, 1)} disabled={ei === (lesson.exercises?.length || 0) - 1} title="Move down">↓</button>
                              <button className={styles.iconBtnSmDanger} onClick={() => deleteExercise(li, ei)} title="Delete">✕</button>
                              <span className={`${styles.chevronSm} ${isExOpen ? styles.chevronUp : ''}`} />
                            </div>
                          </div>

                          {isExOpen && (
                            <div className={styles.exBody}>
                              <IssueList problems={exProblems} />
                              <ExerciseEditor ex={ex} onChange={updated => updateExercise(li, ei, updated)} courseId={id} />
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* add exercise panel */}
                    {addExLesson === li ? (
                      <div className={styles.addExPanel}>
                        <div className={styles.addExPanelTitle}>Choose exercise type:</div>
                        <div className={styles.addExGrid}>
                          {EXERCISE_TYPES.map(t => (
                            <button key={t.type} className={styles.addExCard} onClick={() => addExercise(li, t.type)}>
                              <span className={styles.addExIcon}>{t.icon}</span>
                              <span className={styles.addExLabel}>{t.label}</span>
                              <span className={styles.addExDesc}>{t.desc}</span>
                            </button>
                          ))}
                        </div>
                        <button className={styles.cancelBtn} onClick={() => setAddExLesson(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className={styles.addExBtn} onClick={() => setAddExLesson(li)}>
                        + Add Exercise
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {level.lessons.length > 0 && (
            <button className={styles.addBtnDashed} onClick={addLesson}>+ Add Another Lesson</button>
          )}
          </div>
          )}
        </div>
      </div>
    </div>
    </BuilderGate>
  )
}
