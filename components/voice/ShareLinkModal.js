'use client'
import { useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { COURSE } from '../../data/course'
import { copyText } from '../../lib/builderStore'
import { shareLink, sharedPhrases } from '../../lib/voiceShare'
import styles from './Voice.module.css'

const MODES = [
  { id: 'topic', label: 'Topic' },
  { id: 'lesson', label: 'Lesson' },
  { id: 'words', label: 'Pick words' },
]

// Builds a link a native speaker can open to record just these phrases
export default function ShareLinkModal({ phrases, statusOf, initialTopic, onClose }) {
  const [mode, setMode] = useState('topic')
  const [topic, setTopic] = useState(COURSE.levels.some(l => l.id === initialTopic) ? initialTopic : COURSE.levels[0].id)
  const level = COURSE.levels.find(l => l.id === topic)
  const [lesson, setLesson] = useState(level.lessons[0]?.id)
  const [picked, setPicked] = useState(() => new Set())
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)

  function pickTopic(id) {
    setTopic(id)
    setLesson(COURSE.levels.find(l => l.id === id).lessons[0]?.id)
    setPicked(new Set())
  }

  const share = mode === 'topic' ? { topic, words: [] }
    : mode === 'lesson' ? { lesson, words: [] }
    : { topic, words: [...picked] }
  const included = mode === 'words' ? phrases.filter(p => picked.has(p.key)) : sharedPhrases(phrases, share)
  const missing = included.filter(p => statusOf(p.key) !== 'done').length
  const link = shareLink(window.location.origin, share)
  const ready = mode !== 'words' || picked.size > 0

  const q = query.trim().toLowerCase()
  const pickable = useMemo(
    () => sharedPhrases(phrases, { topic, words: [] }).filter(p => !q || p.text.toLowerCase().includes(q)),
    [phrases, topic, q]
  )

  function toggle(key) {
    setPicked(s => {
      const next = new Set(s)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  const pickMissing = () => setPicked(s => new Set([...s, ...pickable.filter(p => statusOf(p.key) !== 'done').map(p => p.key)]))

  function copy() {
    copyText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Modal title="Share a recording link" size="lg" onClose={onClose}>
      <p className={styles.shareIntro}>Anyone with the link signs in with Discord and sees only these phrases. Their takes wait in your review queue.</p>

      <div className={styles.tabs}>
        {MODES.map(m => (
          <button key={m.id} className={`${styles.tab} ${styles.tabGrow} ${mode === m.id ? styles.tabOn : ''}`} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      <div className={styles.shareFields}>
        <label className={styles.shareField}>
          <span className={styles.shareLabel}>Topic</span>
          <select className={styles.search} value={topic} onChange={e => pickTopic(e.target.value)}>
            {COURSE.levels.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </label>
        {mode === 'lesson' && (
          <label className={styles.shareField}>
            <span className={styles.shareLabel}>Lesson</span>
            <select className={styles.search} value={lesson} onChange={e => setLesson(e.target.value)}>
              {level.lessons.map((ls, i) => <option key={ls.id} value={ls.id}>{i + 1}. {ls.title}</option>)}
            </select>
          </label>
        )}
      </div>

      {mode === 'words' && (
        <div className={styles.picker}>
          <div className={styles.pickerBar}>
            <input className={styles.search} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" lang="bg" />
            <button className={styles.smallBtn} onClick={pickMissing}>Add unrecorded</button>
            {picked.size > 0 && <button className={styles.smallBtn} onClick={() => setPicked(new Set())}>Clear</button>}
          </div>
          <div className={styles.pickerList}>
            {pickable.map(p => (
              <label key={p.key} className={`${styles.pickRow} ${picked.has(p.key) ? styles.pickRowOn : ''}`}>
                <input type="checkbox" checked={picked.has(p.key)} onChange={() => toggle(p.key)} />
                <span className={`${styles.dot} ${styles['dot_' + statusOf(p.key)]}`} />
                <span className={styles.itemText} lang="bg">{p.text}</span>
                <span className={styles.itemUses}>{p.kind}</span>
              </label>
            ))}
            {!pickable.length && <p className={styles.pickEmpty}>Nothing matches.</p>}
          </div>
        </div>
      )}

      <div className={styles.shareSummary}>
        <b>{included.length}</b> {included.length === 1 ? 'phrase' : 'phrases'}, <b>{missing}</b> still without a recording
      </div>

      <div className={styles.linkBox}>
        <span className={styles.linkText} lang="bg">{ready ? link : 'Pick at least one word'}</span>
        <Button size="sm" onClick={copy} disabled={!ready}>{copied ? 'Copied' : 'Copy link'}</Button>
      </div>
    </Modal>
  )
}
