'use client'
import { useEffect, useMemo, useState } from 'react'
import { parseCourseFromFilename, deleteMedia } from '../../lib/media'
import styles from './AdminFilesPanel.module.css'

function fmtSize(n) {
  if (!n && n !== 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
function fmtDate(s) {
  try { return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return '' }
}
async function downloadFile(url, name) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const obj = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = obj
    a.download = name || 'file'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(obj), 4000)
  } catch {
    // Fallback: just open it
    window.open(url, '_blank')
  }
}
function loadCourseTitles() {
  try {
    const levels = JSON.parse(localStorage.getItem('builder_levels') || '[]')
    const map = {}
    for (const l of levels) map[l.id] = l.title
    return map
  } catch { return {} }
}

// Super-admin only: browse every stored media file, filter by type, group by the
// course that created it, and bulk-delete a course's media. Renders nothing for non-admins.
export default function AdminFilesPanel() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [kind, setKind] = useState('all')
  const [sort, setSort] = useState('newest')
  const [view, setView] = useState('course') // 'course' | 'all'
  const [confirm, setConfirm] = useState(null) // { type:'course'|'file', id, label, count }
  const [titles, setTitles] = useState({})

  useEffect(() => {
    fetch('/api/builder/access').then(r => r.json()).then(d => setIsAdmin(!!d.isAdmin)).catch(() => {})
  }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/storage/files')
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Failed to load files'); return }
      setFiles(d.files || [])
      setTitles(loadCourseTitles())
    } catch { setError('Failed to load files') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (open && files.length === 0) load() }, [open]) // eslint-disable-line

  const decorated = useMemo(() => files.map(f => {
    const { courseId, name } = parseCourseFromFilename(f.filename)
    return { ...f, courseId, displayName: name || f.filename || f.id }
  }), [files])

  const filtered = useMemo(() => {
    let list = decorated
    if (kind !== 'all') list = list.filter(f => f.kind === kind)
    const s = [...list]
    s.sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sort === 'largest') return (b.size || 0) - (a.size || 0)
      if (sort === 'smallest') return (a.size || 0) - (b.size || 0)
      if (sort === 'type') return (a.kind || '').localeCompare(b.kind || '')
      return 0
    })
    return s
  }, [decorated, kind, sort])

  const groups = useMemo(() => {
    const m = new Map()
    for (const f of filtered) {
      const key = f.courseId || '__untagged__'
      if (!m.has(key)) m.set(key, [])
      m.get(key).push(f)
    }
    return [...m.entries()]
      .map(([id, list]) => ({
        id,
        untagged: id === '__untagged__',
        title: id === '__untagged__' ? 'Untagged / legacy files' : (titles[id] || null),
        files: list,
        bytes: list.reduce((n, f) => n + (f.size || 0), 0),
      }))
      .sort((a, b) => b.files.length - a.files.length)
  }, [filtered, titles])

  const totalBytes = useMemo(() => files.reduce((n, f) => n + (f.size || 0), 0), [files])

  async function doDeleteFile(id) {
    setConfirm(null)
    await deleteMedia(id)
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  async function doDeleteCourse(courseId) {
    setConfirm(null)
    try {
      const res = await fetch('/api/storage/delete-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const d = await res.json()
      if (res.ok) setFiles(prev => prev.filter(f => parseCourseFromFilename(f.filename).courseId !== courseId))
      else setError(d.error || 'Bulk delete failed')
    } catch { setError('Bulk delete failed') }
  }

  if (!isAdmin) return null

  return (
    <div className={styles.panel}>
      <div className={styles.head} onClick={() => setOpen(o => !o)}>
        <span className={styles.headTitle}>Media files</span>
        <span className={styles.badge}>ADMIN</span>
        <span className={styles.spacer} />
        {open && files.length > 0 && <span className={styles.meta}>{files.length} files · {fmtSize(totalBytes)}</span>}
        <span className={styles.chev}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className={styles.body}>
          {error && <div className={styles.err}>{error}</div>}

          <div className={styles.controls}>
            <div className={styles.seg}>
              {['all', 'image', 'audio', 'video'].map(k => (
                <button key={k} className={`${styles.segBtn} ${kind === k ? styles.segBtnActive : ''}`} onClick={() => setKind(k)}>
                  {k === 'all' ? 'All' : k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            <select className={styles.select} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="largest">Largest first</option>
              <option value="smallest">Smallest first</option>
              <option value="type">By type</option>
            </select>
            <div className={styles.seg}>
              <button className={`${styles.segBtn} ${view === 'course' ? styles.segBtnActive : ''}`} onClick={() => setView('course')}>By course</button>
              <button className={`${styles.segBtn} ${view === 'all' ? styles.segBtnActive : ''}`} onClick={() => setView('all')}>All files</button>
            </div>
            <span className={styles.spacer} />
            <button className={styles.refresh} onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
          </div>

          {loading && files.length === 0 ? (
            <div className={styles.empty}>Loading files…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No files{kind !== 'all' ? ` of type "${kind}"` : ''} yet.</div>
          ) : view === 'course' ? (
            groups.map(g => (
              <div key={g.id} className={styles.group}>
                <div className={styles.groupHead}>
                  <span className={styles.groupTitle}>{g.title || 'Unknown course'}</span>
                  {!g.untagged && <span className={styles.groupId}>{g.id}</span>}
                  <span className={styles.spacer} />
                  <span className={styles.groupMeta}>{g.files.length} files · {fmtSize(g.bytes)}</span>
                  {!g.untagged && (
                    <button className={styles.delCourseBtn} onClick={() => setConfirm({ type: 'course', id: g.id, label: g.title || g.id, count: g.files.length })}>
                      Delete all
                    </button>
                  )}
                </div>
                <FileGrid files={g.files} onDelete={f => setConfirm({ type: 'file', id: f.id, label: f.displayName })} />
              </div>
            ))
          ) : (
            <FileGrid files={filtered} onDelete={f => setConfirm({ type: 'file', id: f.id, label: f.displayName })} />
          )}
        </div>
      )}

      {confirm && (
        <div className={styles.overlay} onClick={() => setConfirm(null)}>
          <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40 }}>🗑️</div>
            <h3 className={styles.confirmTitle}>
              {confirm.type === 'course' ? 'Delete all course media?' : 'Delete this file?'}
            </h3>
            <p className={styles.confirmText}>
              {confirm.type === 'course'
                ? `Permanently delete all ${confirm.count} file(s) uploaded for "${confirm.label}". This cannot be undone and will break any lessons that reference them.`
                : `"${confirm.label}" will be permanently deleted from storage.`}
            </p>
            <button className={styles.confirmDel} onClick={() => confirm.type === 'course' ? doDeleteCourse(confirm.id) : doDeleteFile(confirm.id)}>DELETE</button>
            <button className={styles.confirmCancel} onClick={() => setConfirm(null)}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FileGrid({ files, onDelete }) {
  return (
    <div className={styles.fileGrid}>
      {files.map(f => (
        <div key={f.id} className={styles.fileCard}>
          {f.kind === 'image' ? (
            <img src={f.url} alt="" className={styles.thumb} loading="lazy" />
          ) : f.kind === 'audio' ? (
            <button className={styles.thumbAudio} onClick={() => { try { new Audio(f.url).play().catch(() => {}) } catch {} }} title="Play">
              <img src="/icons/speaker.png" alt="🔊" />
            </button>
          ) : (
            <div className={styles.thumbAudio}><span className={styles.kindTag}>{f.kind}</span></div>
          )}
          <div className={styles.fileInfo}>
            <span className={styles.kindTag}>{f.kind}</span>
            <span className={styles.fileName}>{f.displayName}</span>
            <span className={styles.fileSub}>{fmtSize(f.size)} · {fmtDate(f.createdAt)}</span>
          </div>
          <div className={styles.fileActions}>
            <button className={styles.dlBtn} onClick={() => downloadFile(f.url, f.displayName)}>Download</button>
            <button className={styles.delBtn} onClick={() => onDelete(f)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
