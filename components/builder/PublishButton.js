'use client'
import { useEffect, useState } from 'react'
import Modal, { ModalText, ModalActions } from '../ui/Modal'
import Button from '../ui/Button'
import { useBuilderAccess } from './BuilderGate'
import styles from './PublishButton.module.css'

async function publish(level, dryRun) {
  const res = await fetch('/api/builder/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, dryRun }),
  })
  return res.json().catch(() => ({ error: 'publish_failed' }))
}

function PublishDialog({ level, onClose }) {
  const [step, setStep] = useState({ name: 'checking' })

  useEffect(() => {
    publish(level, true).then(r => setStep(
      r.problems ? { name: 'problems', problems: r.problems }
        : r.ok ? { name: 'confirm', isNew: r.isNew, configured: r.configured }
        : { name: 'error', message: r.message || r.error }
    ))
  }, [level])

  async function confirm() {
    setStep({ name: 'publishing' })
    const r = await publish(level, false)
    setStep(r.ok ? { name: 'done', url: r.url } : { name: 'error', message: r.message || r.error })
  }

  return (
    <Modal title={`Publish ${level.title}`} onClose={onClose} role="alertdialog">
      {step.name === 'checking' && <ModalText>Checking the topic...</ModalText>}

      {step.name === 'problems' && (
        <>
          <ModalText>Fix these first:</ModalText>
          <ul className={styles.problems}>
            {step.problems.map(p => <li key={p}>{p}</li>)}
          </ul>
          <ModalActions><Button variant="secondary" onClick={onClose}>OK</Button></ModalActions>
        </>
      )}

      {step.name === 'confirm' && (
        <>
          <ModalText>
            {step.isNew ? 'Adds' : 'Updates'} <code>data/{level.id}.json</code> in the repo with one commit on master.
            Vercel puts it live in about a minute.
          </ModalText>
          {!step.configured && <ModalText>Publishing is not set up: add GITHUB_TOKEN and GITHUB_REPO to the environment.</ModalText>}
          <ModalActions>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={confirm} disabled={!step.configured}>{step.isNew ? 'Publish topic' : 'Publish update'}</Button>
          </ModalActions>
        </>
      )}

      {step.name === 'publishing' && <ModalText>Committing...</ModalText>}

      {step.name === 'done' && (
        <>
          <ModalText>Published. The site updates when the Vercel deploy finishes.</ModalText>
          <ModalActions>
            {step.url && <Button variant="secondary" href={step.url} target="_blank" rel="noopener noreferrer">View commit</Button>}
            <Button onClick={onClose}>Done</Button>
          </ModalActions>
        </>
      )}

      {step.name === 'error' && (
        <>
          <ModalText>Publishing failed: {step.message}</ModalText>
          <ModalActions><Button variant="secondary" onClick={onClose}>Close</Button></ModalActions>
        </>
      )}
    </Modal>
  )
}

// Only the super-admin sees it: publishing deploys to the live site.
export default function PublishButton({ level, className = '' }) {
  const { isAdmin } = useBuilderAccess()
  const [open, setOpen] = useState(false)
  if (!isAdmin) return null
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>Publish</button>
      {open && <PublishDialog level={level} onClose={() => setOpen(false)} />}
    </>
  )
}
