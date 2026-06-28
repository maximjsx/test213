'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

function loadLevels() {
  try { return JSON.parse(localStorage.getItem('builder_levels') || '[]') } catch { return [] }
}
function saveLevels(levels) {
  try { localStorage.setItem('builder_levels', JSON.stringify(levels)) } catch {}
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

export default function BuilderDashboard() {
  const [levels, setLevels] = useState([])
  const [ready, setReady] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

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
    const updated = [...levels, level]
    saveLevels(updated)
    setLevels(updated)
    router.push('/builder/' + id)
  }

  function deleteLevel(id) {
    const updated = levels.filter(l => l.id !== id)
    saveLevels(updated)
    setLevels(updated)
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
    <div className={styles.page}>
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
                <div key={level.id} className={styles.card}>
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
                    <div className={styles.cardActions}>
                      <Link href={'/builder/' + level.id} className={styles.editBtn}>Edit</Link>
                      {level.lessons.length > 0 && (
                        <Link href={'/builder/play/' + level.id} className={styles.playBtn} style={{ background: level.color }}>
                          ▶ Play
                        </Link>
                      )}
                      <button
                        className={styles.deleteBtn}
                        onClick={() => { if (confirm('Delete "' + level.title + '"? This cannot be undone.')) deleteLevel(level.id) }}
                      >
                        Delete
                      </button>
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
  )
}
