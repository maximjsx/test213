'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BuilderGate from '../../components/builder/BuilderGate'
import AdminUsersPanel from '../../components/builder/AdminUsersPanel'
import AdminFilesPanel from '../../components/builder/AdminFilesPanel'
import styles from './page.module.css'

function loadLevels() {
  try { return JSON.parse(localStorage.getItem('builder_levels') || '[]') } catch { return [] }
}
function saveLevels(levels) {
  try { localStorage.setItem('builder_levels', JSON.stringify(levels)) } catch {}
}

function encodeLevel(level) {
  try {
    const json = JSON.stringify(level)
    const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch { return null }
}
function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const ta = Object.assign(document.createElement('textarea'), { value: text, style: 'position:fixed;opacity:0' })
  document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
  return Promise.resolve()
}

// Unicode-safe, URL-safe base64 decode
function decodeLevel(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((str.length % 4) || 4)
    return JSON.parse(decodeURIComponent(
      Array.from(atob(b64)).map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ))
  } catch { return null }
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

export default function BuilderDashboard() {
  const [levels, setLevels] = useState([])
  const [ready, setReady] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [shareFlashId, setShareFlashId] = useState(null)
  const [confirmDeleteLevel, setConfirmDeleteLevel] = useState(null) // { id, title }

  function handleFileImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setImportText(ev.target.result); setImportError('') }
    reader.readAsText(file)
    e.target.value = ''
  }
  const router = useRouter()

  useEffect(() => {
    setLevels(loadLevels())
    setReady(true)
  }, [])

  function createLevel() {
    const id = 'custom_' + Date.now()
    const level = {
      id,
      title: 'New Level',
      subtitle: 'A custom course level',
      color: '#58cc02',
      icon: '★',
      notes: '## Notes\n\nWrite your level notes here.',
      lessons: [],
    }
    saveLevels([...levels, level])
    router.push('/builder/' + id)
  }

  function deleteLevel(id) {
    const updated = levels.filter(l => l.id !== id)
    saveLevels(updated)
    setLevels(updated)
    setConfirmDeleteLevel(null)
  }
  function shareLevel(level) {
    const encoded = encodeLevel(level)
    if (!encoded) return
    const url = window.location.origin + '/builder/import?d=' + encoded
    copyText(url).then(() => {
      setShareFlashId(level.id)
      setTimeout(() => setShareFlashId(null), 2500)
    })
  }

  function doImport() {
    setImportError('')
    const text = importText.trim()
    let level = null

    // try as share URL first
    try {
      const url = new URL(text)
      const d = url.searchParams.get('d')
      if (d) level = decodeLevel(d)
    } catch {}

    // try as raw JSON
    if (!level) {
      try { level = JSON.parse(text) } catch {}
    }

    if (!level || typeof level !== 'object' || !level.title) {
      setImportError('Could not read level. Paste raw JSON or a share link.')
      return
    }

    // give it a fresh id so it never collides
    const imported = { ...level, id: 'custom_' + Date.now() }
    const updated = [...levels, imported]
    saveLevels(updated)
    setLevels(updated)
    setShowImport(false)
    setImportText('')
  }

  if (!ready) return <div className={styles.loading}>Loading…</div>

  return (
    <BuilderGate>
    <div className={styles.page}>
      {confirmDeleteLevel && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDeleteLevel(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalEmoji}>🗑️</div>
            <h3 className={styles.modalTitle}>Delete level?</h3>
            <p className={styles.modalText}>"{confirmDeleteLevel.title}" and all its lessons will be permanently removed.</p>
            <button className={styles.modalConfirmBtn} onClick={() => deleteLevel(confirmDeleteLevel.id)}>DELETE</button>
            <button className={styles.modalCancelBtn} onClick={() => setConfirmDeleteLevel(null)}>CANCEL</button>
          </div>
        </div>
      )}
      <div className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <img src="/icons/gray_x.png" alt="✕" width={18} height={18} />
        </Link>
        <h1 className={styles.pageTitle}>Level Builder</h1>
        <div className={styles.headerActions}>
          <button className={styles.importBtn} onClick={() => { setShowImport(v => !v); setImportError('') }}>
            Import
          </button>
          <button className={styles.createBtn} onClick={createLevel}>+ New Level</button>
        </div>
      </div>

      {showImport && (
        <div className={styles.importPanel}>
          <div className={styles.importRow}>
            <div className={styles.importTextCol}>
              <p className={styles.importLabel}>Paste a share link or raw JSON:</p>
              <textarea
                className={styles.importTextarea}
                value={importText}
                onChange={e => { setImportText(e.target.value); setImportError('') }}
                placeholder={'https://…/builder/import?d=…\nor paste raw JSON'}
                rows={3}
                autoFocus
              />
            </div>
            <div className={styles.importOr}>or</div>
            <label className={styles.fileLabel}>
              <input type="file" accept=".json,application/json" className={styles.fileInput} onChange={handleFileImport} />
              Choose .json file
            </label>
          </div>
          {importError && <p className={styles.importError}>{importError}</p>}
          <div className={styles.importActions}>
            <button className={styles.importSubmit} onClick={doImport} disabled={!importText.trim()}>
              Import Level
            </button>
            <button className={styles.importCancel} onClick={() => { setShowImport(false); setImportText(''); setImportError('') }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <AdminUsersPanel />
        <AdminFilesPanel />
        {levels.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyEmoji}>🏗️</div>
            <p className={styles.emptyText}>No custom levels yet.</p>
            <p className={styles.emptyHint}>
              Create a level, add lessons and exercises, then share it via URL or export as JSON.
            </p>
            <button className={styles.createBtnLg} onClick={createLevel}>Create First Level</button>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {levels.map(level => (
                <div key={level.id} className={styles.card} onClick={() => router.push('/builder/' + level.id)} style={{ cursor: 'pointer' }}>
                  <div className={styles.cardTop} style={{ background: level.color }}>
                    <span className={styles.cardIcon}>{level.icon}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTitle}>{level.title}</div>
                    <div className={styles.cardSub}>{level.subtitle}</div>
                    <div className={styles.cardMeta}>
                      {level.lessons.length} lesson{level.lessons.length !== 1 ? 's' : ''} ·{' '}
                      {level.lessons.reduce((n, l) => n + (l.exercises?.length || 0), 0)} exercises
                    </div>
                    <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                      <div className={styles.cardActionsRow}>
                        <Link href={'/builder/' + level.id} className={styles.editBtn}>Edit</Link>
                        {level.lessons.length > 0 && (
                          <Link href={'/builder/play/' + level.id} className={styles.playBtn} style={{ background: level.color }}>
                            ▶ Play
                          </Link>
                        )}
                      </div>
                      <div className={styles.cardActionsRow}>
                        <button
                          className={`${styles.shareCardBtn} ${shareFlashId === level.id ? styles.shareCardBtnFlash : ''}`}
                          onClick={() => shareLevel(level)}
                          title={shareFlashId === level.id ? 'Link copied!' : 'Share'}
                        >
                          {shareFlashId === level.id ? '✓' : <ShareIcon />}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setConfirmDeleteLevel({ id: level.id, title: level.title })}
                          title="Delete level"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.createBtnRow} onClick={createLevel}>+ Create Another Level</button>
          </>
        )}
      </div>
    </div>
    </BuilderGate>
  )
}
