'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Bear from '../../../components/Bear'
import Chevron from '../../../components/Chevron'
import LoadingBear from '../../../components/LoadingBear'
import { formatCertificateDate } from '../../../lib/certificates'
import styles from './page.module.css'

function linkedInUrl(cert, pageUrl) {
  const issued = new Date(cert.issuedAt)
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: `${cert.title} (${cert.level})`,
    organizationName: 'Learn Bulgarian',
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certUrl: pageUrl,
    certId: cert.id,
  })
  return `https://www.linkedin.com/profile/add?${params}`
}

function CertificatePreview({ cert }) {
  return (
    <div className={styles.paper}>
      <div className={styles.flag}><span /><span /><span /></div>
      <div className={styles.brand}>Learn Bulgarian</div>
      <div className={styles.heading}>Certificate of Achievement</div>
      <div className={styles.soft}>This certifies that</div>
      <div className={styles.recipient}>{cert.name}</div>
      <div className={styles.rule} />
      <div className={styles.soft}>has successfully completed</div>
      <div className={styles.credential}>{cert.title} · {cert.level}</div>
      <div className={styles.scope}>{cert.topics} {cert.topics === 1 ? 'topic' : 'topics'} · {cert.lessons} lessons</div>
      <div className={styles.paperFooter}>
        <div className={styles.meta}>
          <span>Issued</span>
          <b>{formatCertificateDate(cert.issuedAt)}</b>
        </div>
        <div className={styles.paperSeal}>{cert.seal}<small>Verified</small></div>
        <div className={`${styles.meta} ${styles.metaRight}`}>
          <span>Certificate ID</span>
          <b>{cert.id}</b>
        </div>
      </div>
    </div>
  )
}

const VERIFY_MESSAGES = {
  exact: { tone: 'good', title: 'Authentic file', text: 'This PDF is byte for byte the one Learn Bulgarian issued.' },
  modified: { tone: 'warn', title: 'Genuine signature, altered file', text: 'The signature inside is ours, but the file was edited or re-saved after it was issued. Trust only the details shown on this page.' },
  unknown: { tone: 'bad', title: 'Not a Learn Bulgarian certificate', text: 'No valid signature from us was found in this file.' },
  error: { tone: 'bad', title: 'Could not check that file', text: 'Make sure it is a PDF under 5 MB and try again.' },
}

function FileCheck({ certId }) {
  const [state, setState] = useState(null)

  async function check(file) {
    if (!file) return
    setState({ result: 'checking' })
    try {
      const res = await fetch('/api/certificates/verify', { method: 'POST', body: file })
      if (!res.ok) throw new Error()
      setState(await res.json())
    } catch {
      setState({ result: 'error' })
    }
  }

  const message = VERIFY_MESSAGES[state?.result]
  const otherCert = state?.certificate && state.certificate.id !== certId ? state.certificate : null

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Check a certificate file</h2>
      <p className={styles.sectionText}>Got a PDF from someone? Drop it here to confirm it was issued by us and has not been changed.</p>
      <label className={styles.drop}>
        <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={e => check(e.target.files?.[0])} />
        <img src="/icons/open_book.png" alt="" width={28} height={28} />
        <span>{state?.result === 'checking' ? 'Checking...' : 'Choose PDF'}</span>
      </label>
      {message && (
        <div className={`${styles.verdict} ${styles[message.tone]}`}>
          <b>{message.title}</b>
          <span>{message.text}</span>
          {otherCert && (
            <Link href={`/certificate/${otherCert.id}`} className={styles.verdictLink}>
              It belongs to {otherCert.name}, certificate {otherCert.id}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, mono }) {
  return (
    <div className={styles.row}>
      <span>{label}</span>
      <b className={mono ? styles.mono : undefined}>{value}</b>
    </div>
  )
}

export default function CertificatePage() {
  const { id } = useParams()
  const [cert, setCert] = useState(undefined)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/certificates/${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setCert(d?.certificate ?? null))
      .catch(() => setCert(null))
  }, [id])

  if (cert === undefined) return <LoadingBear fullscreen={false} />

  if (!cert) {
    return (
      <div className={styles.page}>
        <Link href="/" className={styles.backBtn}><Chevron /> Home</Link>
        <div className={styles.missing}>
          <Bear mood="sad" size={90} />
          <h1>Certificate not found</h1>
          <p>No certificate has the ID "{id}". Check it for typos, it looks like BG-XXXX-XXXX.</p>
        </div>
      </div>
    )
  }

  const pageUrl = typeof window === 'undefined' ? '' : window.location.href

  async function copyLink() {
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backBtn}><Chevron /> Home</Link>

      <div className={styles.status}>
        <img src="/icons/green_checkmark.png" alt="" width={18} height={18} />
        Verified certificate
      </div>

      <CertificatePreview cert={cert} />

      <div className={styles.actions}>
        <a href={`/api/certificates/${cert.id}/pdf`} download className={styles.primaryBtn}>Download PDF</a>
        <button onClick={copyLink} className={styles.secondaryBtn}>{copied ? 'Link copied' : 'Copy link'}</button>
        <a href={linkedInUrl(cert, pageUrl)} target="_blank" rel="noopener noreferrer" className={styles.secondaryBtn}>Add to LinkedIn</a>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Details</h2>
        <DetailRow label="Recipient" value={cert.name} />
        <DetailRow label="Credential" value={`${cert.title} · ${cert.level}`} />
        <DetailRow label="Issued" value={formatCertificateDate(cert.issuedAt)} />
        <DetailRow label="Certificate ID" value={cert.id} mono />
        <DetailRow label="Signature" value={cert.fingerprint} mono />
        <p className={styles.sectionText}>
          The PDF carries an Ed25519 signature over these details. Anyone can check it offline
          with our <a href="/api/certificates/public-key" className={styles.inlineLink}>public key</a>.
        </p>
        <p className={styles.sectionText}>
          This certificate confirms that the holder finished these lessons on Learn Bulgarian. It is not
          an official CEFR exam result; the level name describes the course content.
        </p>
      </div>

      <FileCheck certId={cert.id} />
    </div>
  )
}
