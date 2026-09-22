'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { COURSE } from '../../data/course'
import { collectPhrases } from '../../lib/voicePhrases'
import { fetchStudio, uploadVoice, reviewVoice, mergeVoiceover } from '../../lib/voiceStudio'
import RecordCard from '../../components/voice/RecordCard'
import ReviewQueue from '../../components/voice/ReviewQueue'
import Chevron from '../../components/Chevron'
import styles from '../../components/voice/Voice.module.css'

const FILTERS = [
  { id: 'missing', label: 'To record' },
  { id: 'pending', label: 'In review' },
  { id: 'done', label: 'Recorded' },
  { id: 'all', label: 'All' },
]
const KINDS = [
  { id: 'all', label: 'Everything' },
  { id: 'letter', label: 'Letters' },
  { id: 'word', label: 'Words' },
  { id: 'sentence', label: 'Sentences' },
]

function indexVoiceovers(voiceovers, myId) {
  const approved = {}, mine = {}, pendingByKey = {}
  const pending = []
  for (const v of voiceovers) {
    if (v.status === 'approved') approved[v.key] = v
    else if (v.by === myId) mine[v.key] = v
    else { pending.push(v); pendingByKey[v.key] = v }
  }
  return { approved, mine, pending, pendingByKey }
}

function SignIn() {
  return (
    <div className={styles.signIn}>
      <img src="/icons/microphone.png" alt="" width={56} height={56} />
      <h1 className={styles.signInTitle}>Help voice the course</h1>
      <p className={styles.signInText}>
        Record words and sentences in your own voice. Every recording plays in all the lessons that use it.
        Sign in with Discord to start.
      </p>
      <a className={styles.discordBtn} href="/api/auth/login">Log in with Discord</a>
    </div>
  )
}

export default function VoiceStudio() {
  const phrases = useMemo(() => collectPhrases(COURSE.levels), [])
  const [studio, setStudio] = useState(null)
  const [voiceovers, setVoiceovers] = useState([])
  const [saving, setSaving] = useState({})
  const [tab, setTab] = useState('record')
  const [filter, setFilter] = useState('missing')
  const [kind, setKind] = useState('all')
  const [query, setQuery] = useState('')
  const [currentKey, setCurrentKey] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const listRefs = useRef({})

  function load() {
    fetchStudio()
      .then(d => { setStudio(d); setVoiceovers(d.voiceovers || []) })
      .catch(() => setLoadError(true))
  }
  useEffect(load, [])

  const canReview = !!studio?.canReview
  const index = useMemo(() => indexVoiceovers(voiceovers, studio?.myId), [voiceovers, studio?.myId])

  function statusOf(key) {
    if (saving[key] === 'saving') return 'pending'
    if (index.approved[key]) return 'done'
    if (index.mine[key] || (canReview && index.pendingByKey[key])) return 'pending'
    return 'missing'
  }

  const counts = { missing: 0, pending: 0, done: 0, all: phrases.length }
  for (const p of phrases) counts[statusOf(p.key)]++

  const q = query.trim().toLowerCase()
  const queue = phrases.filter(p =>
    (kind === 'all' || p.kind === kind) &&
    (filter === 'all' || statusOf(p.key) === filter) &&
    (!q || p.key.includes(q) || p.text.toLowerCase().includes(q))
  )
  const current = queue.find(p => p.key === currentKey) || queue[0]

  useEffect(() => {
    if (current) listRefs.current[current.key]?.scrollIntoView({ block: 'nearest' })
  }, [current?.key]) // eslint-disable-line react-hooks/exhaustive-deps

  function move(step) {
    if (!queue.length) return
    const i = Math.max(0, queue.indexOf(current))
    setCurrentKey(queue[(i + step + queue.length) % queue.length].key)
  }

  async function save(blob) {
    const key = current.key
    move(1)
    setSaving(s => ({ ...s, [key]: 'saving' }))
    try {
      const doc = await uploadVoice(key, blob)
      setVoiceovers(list => mergeVoiceover(list, doc))
      setSaving(({ [key]: _, ...rest }) => rest)
    } catch (e) {
      setSaving(s => ({ ...s, [key]: e.message }))
    }
  }

  async function decide(doc, action) {
    setVoiceovers(list => action === 'approve'
      ? mergeVoiceover(list.filter(v => v.id !== doc.id), { ...doc, status: 'approved' })
      : list.filter(v => v.id !== doc.id))
    try {
      await reviewVoice(doc.id, action)
    } catch {
      load()
    }
  }

  if (loadError) return <div className={styles.loading}>Could not load the voice studio. Refresh to try again.</div>
  if (!studio) return <div className={styles.loading}>Loading...</div>
  if (!studio.loggedIn) return <SignIn />

  const recorded = counts.done
  const saveError = current && saving[current.key] !== 'saving' ? saving[current.key] : null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}><Chevron /> Course</Link>
        <h1 className={styles.title}>Voice studio</h1>
        {canReview && (
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'record' ? styles.tabOn : ''}`} onClick={() => setTab('record')}>Record</button>
            <button className={`${styles.tab} ${tab === 'review' ? styles.tabOn : ''}`} onClick={() => setTab('review')}>
              Review{index.pending.length > 0 && <span className={styles.badge}>{index.pending.length}</span>}
            </button>
          </div>
        )}
      </header>

      <div className={styles.progress}>
        <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${(recorded / phrases.length) * 100}%` }} /></div>
        <span className={styles.progressText}>{recorded} of {phrases.length} recorded</span>
      </div>

      {tab === 'review' && canReview ? (
        <ReviewQueue pending={index.pending} approved={index.approved} onDecide={decide} />
      ) : (
        <div className={styles.layout}>
          <main className={styles.main}>
            {current ? (
              <RecordCard
                phrase={current}
                approved={index.approved[current.key]}
                mine={index.mine[current.key]}
                saveError={saveError}
                canReview={canReview}
                onSave={save}
                onMove={move}
                onRemove={doc => decide(doc, 'reject')}
              />
            ) : (
              <div className={styles.emptyState}>
                {filter === 'missing' && !q ? 'Everything here has a recording. Nice work.' : 'Nothing matches these filters.'}
              </div>
            )}
          </main>

          <aside className={styles.side}>
            <div className={styles.chips}>
              {FILTERS.map(f => (
                <button key={f.id} className={`${styles.chip} ${filter === f.id ? styles.chipOn : ''}`} onClick={() => setFilter(f.id)}>
                  {f.label} <span className={styles.chipCount}>{counts[f.id]}</span>
                </button>
              ))}
            </div>
            <div className={styles.chips}>
              {KINDS.map(k => (
                <button key={k.id} className={`${styles.chip} ${kind === k.id ? styles.chipOn : ''}`} onClick={() => setKind(k.id)}>
                  {k.label}
                </button>
              ))}
            </div>
            <input
              className={styles.search}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape' || e.key === 'Enter') e.currentTarget.blur() }}
              placeholder="Search"
              lang="bg"
            />
            <div className={styles.list}>
              {queue.map(p => {
                const status = saving[p.key] && saving[p.key] !== 'saving' ? 'error' : statusOf(p.key)
                return (
                  <button
                    key={p.key}
                    ref={el => { listRefs.current[p.key] = el }}
                    className={`${styles.item} ${p === current ? styles.itemOn : ''}`}
                    onClick={e => { setCurrentKey(p.key); e.currentTarget.blur() }}
                  >
                    <span className={`${styles.dot} ${styles['dot_' + status]}`} />
                    <span className={styles.itemText} lang="bg">{p.text}</span>
                    <span className={styles.itemUses}>{p.uses.length}</span>
                  </button>
                )
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
