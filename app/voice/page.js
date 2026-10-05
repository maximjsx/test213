'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { COURSE } from '../../data/course'
import { collectPhrases } from '../../lib/voicePhrases'
import { readShare, sharedPhrases, describeShare } from '../../lib/voiceShare'
import { fetchStudio, uploadVoice, reviewVoice, mergeVoiceover } from '../../lib/voiceStudio'
import RecordCard from '../../components/voice/RecordCard'
import ReviewQueue from '../../components/voice/ReviewQueue'
import VoiceAgreement from '../../components/voice/VoiceAgreement'
import ShareLinkModal from '../../components/voice/ShareLinkModal'
import ShareBanner from '../../components/voice/ShareBanner'
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

const TOPIC_KEY = 'voiceTopic'

function savedTopic() {
  try { return localStorage.getItem(TOPIC_KEY) || 'all' } catch { return 'all' }
}

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

function SignIn({ request, count }) {
  const next = typeof window === 'undefined' ? '/voice' : window.location.pathname + window.location.search
  return (
    <div className={styles.signIn}>
      <img src="/icons/microphone.png" alt="" width={56} height={56} />
      <h1 className={styles.signInTitle}>{request ? 'You have been asked to record' : 'Help voice the course'}</h1>
      {request && (
        <div className={styles.signInRequest}>
          <b>{request.title}</b>
          <span>{count} {count === 1 ? 'phrase' : 'phrases'}{request.subtitle ? `, ${request.subtitle}` : ''}</span>
        </div>
      )}
      <p className={styles.signInText}>
        Record words and sentences in your own voice. Every recording plays in all the lessons that use it.
        Sign in with Discord to start.
      </p>
      <a className={styles.discordBtn} href={`/api/auth/login?next=${encodeURIComponent(next)}`}>Log in with Discord</a>
    </div>
  )
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  )
}

export default function VoiceStudio() {
  const allPhrases = useMemo(() => collectPhrases(COURSE.levels), [])
  const [topic, setTopic] = useState('all')
  const [share, setShare] = useState(null)
  const [sharing, setSharing] = useState(false)
  const phrases = useMemo(() => {
    if (share) return sharedPhrases(allPhrases, share)
    return topic === 'all' ? allPhrases : allPhrases.filter(p => p.uses.some(u => u.levelId === topic))
  }, [allPhrases, topic, share])
  const request = useMemo(() => share && describeShare(share, COURSE.levels), [share])
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
  useEffect(() => {
    setShare(readShare(window.location.search))
    const saved = savedTopic()
    if (COURSE.levels.some(l => l.id === saved)) setTopic(saved)
  }, [])

  function leaveShare() {
    window.history.replaceState(null, '', '/voice')
    setShare(null)
    setCurrentKey(null)
  }

  function pickTopic(id) {
    setTopic(id)
    setCurrentKey(null)
    try { localStorage.setItem(TOPIC_KEY, id) } catch {}
  }

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
  if (!studio.loggedIn) return <SignIn request={request} count={phrases.length} />
  if (!studio.agreed) return <VoiceAgreement onAccept={() => setStudio(s => ({ ...s, agreed: true }))} />

  const recorded = counts.done
  const saveError = current && saving[current.key] !== 'saving' ? saving[current.key] : null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}><Chevron /> Course</Link>
        <h1 className={styles.title}>Voice studio</h1>
        {canReview && <button className={styles.shareBtn} onClick={() => setSharing(true)}><LinkIcon /> Share</button>}
        {canReview && (
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'record' ? styles.tabOn : ''}`} onClick={() => setTab('record')}>Record</button>
            <button className={`${styles.tab} ${tab === 'review' ? styles.tabOn : ''}`} onClick={() => setTab('review')}>
              Review{index.pending.length > 0 && <span className={styles.badge}>{index.pending.length}</span>}
            </button>
          </div>
        )}
      </header>

      {sharing && (
        <ShareLinkModal
          phrases={allPhrases}
          statusOf={statusOf}
          initialTopic={share?.topic || topic}
          onClose={() => setSharing(false)}
        />
      )}

      {request && <ShareBanner request={request} count={phrases.length} recorded={counts.done + counts.pending} onLeave={leaveShare} />}

      {!request && <div className={styles.progress}>
        <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${phrases.length ? (recorded / phrases.length) * 100 : 0}%` }} /></div>
        <span className={styles.progressText}>{recorded} of {phrases.length} recorded</span>
      </div>}

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
                {filter === 'missing' && !q ? (share ? 'All done. Thank you for recording these!' : 'Everything here has a recording. Nice work.') : 'Nothing matches these filters.'}
              </div>
            )}
          </main>

          <aside className={styles.side}>
            {!share && (
              <select className={styles.search} value={topic} onChange={e => pickTopic(e.target.value)}>
                <option value="all">All topics</option>
                {COURSE.levels.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            )}
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
