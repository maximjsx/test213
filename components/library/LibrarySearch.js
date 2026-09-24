'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import styles from './Library.module.css'

const MAX_RESULTS = 8

export default function LibrarySearch({ index }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const results = useMemo(
    () => (q.length < 2 ? [] : index.filter(item => item.label.toLowerCase().includes(q)).slice(0, MAX_RESULTS)),
    [index, q]
  )

  return (
    <div className={styles.search} role="search">
      <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        className={styles.searchInput}
        type="search"
        value={query}
        placeholder="Search pages and words, in Bulgarian or English"
        aria-label="Search the library"
        onChange={e => setQuery(e.target.value)}
      />
      {q.length >= 2 && (
        <ul className={styles.results}>
          {results.length === 0 && <li className={styles.noResults}>Nothing found for "{query}"</li>}
          {results.map(r => (
            <li key={r.href}>
              <Link href={r.href} className={styles.result}>
                <span className={styles.resultKind}>{r.kind}</span>
                <span className={styles.resultLabel}>{r.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
