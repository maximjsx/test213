'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BuilderGate from '../../components/builder/BuilderGate'
import SyncStatus from '../../components/builder/SyncStatus'
import AdminUsersPanel from '../../components/builder/AdminUsersPanel'
import AdminFilesPanel from '../../components/builder/AdminFilesPanel'
import { loadLevels, syncLevels, addLevel, deleteLevel as removeLevel, newLevel, newLevelId, countExercises, shareUrl, decodeLevel, copyText } from '../../lib/builderStore'
import Modal, { ModalText, ModalActions } from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { clickable } from '../../lib/a11y'
import styles from './page.module.css'

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
    syncLevels().then(setLevels)
  }, [])

  function createLevel() {
    const level = newLevel()
    addLevel(level)
    router.push('/builder/' + level.id)
  }

  function deleteLevel(id) {
    setLevels(removeLevel(id))
    setConfirmDeleteLevel(null)
  }
  function shareLevel(level) {
    const url = shareUrl(level)
    if (!url) return
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
      setImportError('Could not read topic. Paste raw JSON or a share link.')
      return
    }

    // give it a fresh id so it never collides
    addLevel({ ...level, id: newLevelId() })
    setLevels(loadLevels())
    setShowImport(false)
    setImportText('')
  }

  if (!ready) return <div className={styles.loading}>Loading…</div>

  return (
    <BuilderGate>
    <div className={styles.page}>
      {confirmDeleteLevel && (
        <Modal role="alertdialog" size="sm" title="Delete topic?" onClose={() => setConfirmDeleteLevel(null)}>
          <ModalText>"{confirmDeleteLevel.title}" and all its lessons will be permanently removed.</ModalText>
          <ModalActions>
            <Button variant="danger" block onClick={() => deleteLevel(confirmDeleteLevel.id)}>Delete</Button>
            <Button variant="secondary" block onClick={() => setConfirmDeleteLevel(null)} data-autofocus>Cancel</Button>
          </ModalActions>
        </Modal>
      )}
      <div className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <img src="/icons/gray_x.png" alt="Back to course" width={18} height={18} />
        </Link>
        <h1 className={styles.pageTitle}>Topic Builder</h1>
        <SyncStatus />
        <div className={styles.headerActions}>
          <Link href="/voice" className={styles.importBtn}>Voice studio</Link>
          <button className={styles.importBtn} onClick={() => { setShowImport(v => !v); setImportError('') }}>
            Import
          </button>
          <button className={styles.createBtn} onClick={createLevel}>+ New Topic</button>
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
              Import Topic
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
            <p className={styles.emptyText}>No custom topics yet.</p>
            <p className={styles.emptyHint}>
              Create a topic, add lessons and exercises, then share it via URL or export as JSON.
            </p>
            <button className={styles.createBtnLg} onClick={createLevel}>Create First Topic</button>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {levels.map(level => (
                <div key={level.id} className={styles.card} {...clickable(() => router.push('/builder/' + level.id))} style={{ cursor: 'pointer' }}>
                  <div className={styles.cardTop} style={{ background: level.color }}>
                    <span className={styles.cardIcon}>{level.icon}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTitle}>{level.title}</div>
                    <div className={styles.cardSub}>{level.subtitle}</div>
                    <div className={styles.cardMeta}>
                      {level.lessons.length} lesson{level.lessons.length !== 1 ? 's' : ''} ·{' '}
                      {countExercises(level)} exercises
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
                          title="Delete topic"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.createBtnRow} onClick={createLevel}>+ Create Another Topic</button>
          </>
        )}
      </div>
    </div>
    </BuilderGate>
  )
}
