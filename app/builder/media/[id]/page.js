'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import BuilderGate, { useBuilderAccess } from '../../../../components/builder/BuilderGate'
import PageHeader from '../../../../components/ui/PageHeader'
import Button from '../../../../components/ui/Button'
import { useYouTubePlayer } from '../../../../hooks/useYouTubePlayer'
import MEDIA from '../../../../data/media/index.json'
import styles from './page.module.css'

const round = n => Math.round(n * 100) / 100

function download(id, track) {
  const blob = new Blob([JSON.stringify(track, null, 2) + '\n'], { type: 'application/json' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${id}.json` })
  a.click()
  URL.revokeObjectURL(a.href)
}

function PublishTrack({ id, track }) {
  const { isAdmin } = useBuilderAccess()
  const [status, setStatus] = useState('')
  if (!isAdmin) return null

  async function publish() {
    setStatus('Publishing...')
    const res = await fetch('/api/builder/publish-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, track }),
    })
    const data = await res.json().catch(() => ({}))
    setStatus(data.ok ? 'Published. Live after the Vercel deploy.' : data.problems?.join(' ') || data.message || data.error || 'Failed.')
  }

  return (
    <>
      <Button onClick={publish}>Publish</Button>
      {status && <span className={styles.status}>{status}</span>}
    </>
  )
}

// Sync lyrics or fix caption timings: play the video and tap Space (or the
// big button) as each line starts. Timings save in this browser until you
// download or publish the file.
function SyncTool({ media }) {
  const { mountRef, ready, time, seek } = useYouTubePlayer(media.youtubeId)
  const storeKey = `media_sync_${media.id}`
  const [track, setTrack] = useState(null)
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    let saved = null
    try { saved = JSON.parse(localStorage.getItem(storeKey)) } catch {}
    if (saved) return setTrack(saved)
    import(`../../../../data/media/${media.id}.json`).then(m => setTrack(m.default))
  }, [media.id, storeKey])

  useEffect(() => {
    if (track) try { localStorage.setItem(storeKey, JSON.stringify(track)) } catch {}
  }, [track, storeKey])

  const setLine = (i, patch) => setTrack(t => ({ ...t, lines: t.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }))

  function tap() {
    if (!track || cursor >= track.lines.length) return
    const now = round(time)
    setTrack(t => ({
      ...t,
      lines: t.lines.map((l, j) => {
        if (j === cursor) return { ...l, start: now, end: Math.max(l.end, now + 0.5) }
        if (j === cursor - 1) return { ...l, end: now }
        return l
      }),
    }))
    setCursor(c => c + 1)
  }

  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === ' ') { e.preventDefault(); tap() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!track) return <p className={styles.status}>Loading...</p>

  return (
    <div className={styles.tool}>
      <div className={styles.video}><div ref={mountRef} /></div>
      <div className={styles.bar}>
        <Button size="lg" onClick={tap} disabled={!ready || cursor >= track.lines.length}>
          {cursor < track.lines.length ? `Line ${cursor + 1} starts now (Space)` : 'All lines synced'}
        </Button>
        <span className={styles.time}>{time.toFixed(2)}s</span>
        <Button variant="secondary" onClick={() => setCursor(0)}>Restart syncing</Button>
        <Button variant="secondary" onClick={() => download(media.id, track)}>Download JSON</Button>
        <PublishTrack id={media.id} track={track} />
      </div>
      <ol className={styles.lines}>
        {track.lines.map((l, i) => (
          <li key={i} className={`${styles.line} ${i === cursor ? styles.lineNext : ''}`}>
            <div className={styles.timing}>
              <button className={styles.nudge} onClick={() => setLine(i, { start: round(l.start - 0.1) })} aria-label="Start 0.1s earlier">-</button>
              <button className={styles.seek} onClick={() => seek(l.start)}>{l.start.toFixed(2)}</button>
              <button className={styles.nudge} onClick={() => setLine(i, { start: round(l.start + 0.1) })} aria-label="Start 0.1s later">+</button>
              <button className={styles.cursorBtn} onClick={() => setCursor(i)}>Sync from here</button>
            </div>
            <input className={styles.input} lang="bg" value={l.bg} onChange={e => setLine(i, { bg: e.target.value })} aria-label={`Line ${i + 1} Bulgarian`} />
            <input
              className={styles.input}
              value={l.en || ''}
              onChange={e => setLine(i, { en: e.target.value, enReviewed: true })}
              aria-label={`Line ${i + 1} English`}
              placeholder="English"
            />
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function MediaSyncPage() {
  const { id } = useParams()
  const media = MEDIA.find(m => m.id === id)
  return (
    <BuilderGate>
      <div className={styles.page}>
        <PageHeader backHref="/builder" backLabel="Builder" title={media ? `Sync: ${media.title}` : 'Media not found'} />
        <main className={styles.main}>
          {media ? <SyncTool media={media} /> : <p className={styles.status}>No media with id "{id}" in data/media/index.json.</p>}
        </main>
      </div>
    </BuilderGate>
  )
}
