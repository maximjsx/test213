'use client'
import { useParams, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { COURSE } from '../../../data/course'
import styles from './page.module.css'

function renderMd(text) {
  const lines = text.trim().split('\n')
  const out = []
  let i = 0, k = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      out.push(<h2 key={k++} className={styles.h2}>{line.slice(3)}</h2>)
      i++
    } else if (line.startsWith('### ')) {
      out.push(<h3 key={k++} className={styles.h3}>{line.slice(4)}</h3>)
      i++
    } else if (line.startsWith('| ')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('| ')) { rows.push(lines[i]); i++ }
      const parse = r => r.split('|').map(c => c.trim()).filter(Boolean)
      const [hdr, , ...body] = rows
      out.push(
        <table key={k++} className={styles.table}>
          <thead><tr>{parse(hdr).map((c,j)=><th key={j}>{inline(c)}</th>)}</tr></thead>
          <tbody>{body.map((r,ri)=><tr key={ri}>{parse(r).map((c,j)=><td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
        </table>
      )
    } else if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) { items.push(lines[i].slice(2)); i++ }
      out.push(<ul key={k++} className={styles.ul}>{items.map((t,j)=><li key={j}>{inline(t)}</li>)}</ul>)
    } else if (line.trim() === '') {
      i++
    } else {
      out.push(<p key={k++} className={styles.p}>{inline(line)}</p>)
      i++
    }
  }
  return out
}

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2,-2)}</strong>
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1,-1)}</em>
    return p
  })
}

export default function LevelPage() {
  const { id } = useParams()
  const router = useRouter()
  const level = useMemo(() => COURSE.levels.find(l => l.id === id), [id])

  if (!level) return <div className={styles.notFound}>Level not found. <button onClick={() => router.push('/')}>← Back</button></div>

  return (
    <div className={styles.page}>
      <div className={styles.topBar} style={{ borderBottom: `3px solid ${level.color}` }}>
        <div className={styles.topBarInner}>
          <button className={styles.backBtn} onClick={() => router.back()}><img src="/icons/gray_x.png" alt="✕" width={14} height={14} /></button>
          <span className={styles.topTitle}>Notes</span>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.levelChip} style={{ background: level.color + '33', color: level.color }}>
          {level.title}
        </div>
        <h1 className={styles.title}>{level.subtitle}</h1>
        <div className={styles.notes}>{renderMd(level.notes)}</div>
      </div>
    </div>
  )
}
