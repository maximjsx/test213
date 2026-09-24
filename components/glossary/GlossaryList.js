'use client'
import { useMemo, useState } from 'react'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import AddToDeckButton from '../decks/AddToDeckButton'
import styles from './Glossary.module.css'

const ALPHABET = [...'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЮЯ']

function Entry({ entry }) {
  return (
    <li className={styles.entry} id={entry.id}>
      <div className={styles.head}>
        <button className={styles.speak} onClick={() => { unlockAudio(); speakBulgarian(entry.bg) }} aria-label={`Listen to ${entry.bg}`}>
          <img src="/icons/speaker.png" alt="" width={18} height={18} />
        </button>
        <div className={styles.words}>
          <h2 className={styles.bg} lang="bg">{entry.bg}</h2>
          {entry.en && (
            <p className={styles.en}>
              {entry.en}
              {!entry.enReviewed && <span className={styles.draft} title="Not yet checked by a native speaker">draft</span>}
            </p>
          )}
        </div>
        <AddToDeckButton
          size="sm"
          word={{ bg: entry.bg, en: entry.en, note: entry.senses[0], source: { kind: 'glossary', ref: entry.id } }}
        />
      </div>
      {entry.senses.length > 1
        ? <ol className={styles.senses} lang="bg">{entry.senses.map((s, i) => <li key={i}>{s}</li>)}</ol>
        : <p className={styles.sense} lang="bg">{entry.senses[0]}</p>}
      {(entry.tags || entry.usage) && (
        <p className={styles.meta} lang="bg">
          {entry.tags?.map(t => <span key={t} className={styles.tag}>{t}</span>)}
          {entry.usage}
        </p>
      )}
    </li>
  )
}

export default function GlossaryList({ entries }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = useMemo(
    () => q ? entries.filter(e => `${e.bg} ${e.en} ${e.senses.join(' ')}`.toLowerCase().includes(q)) : entries,
    [entries, q]
  )
  const letters = new Set(entries.map(e => e.bg[0].toUpperCase()))

  return (
    <>
      <input
        className={styles.search}
        type="search"
        value={query}
        placeholder="Search in Bulgarian or English"
        aria-label="Search the glossary"
        onChange={e => setQuery(e.target.value)}
      />
      {!q && (
        <nav className={styles.letters} aria-label="Jump to letter">
          {ALPHABET.filter(l => letters.has(l)).map(l => (
            <a key={l} href={`#${entries.find(e => e.bg[0].toUpperCase() === l).id}`} className={styles.letter}>{l}</a>
          ))}
        </nav>
      )}
      <p className={styles.count}>{shown.length} {shown.length === 1 ? 'word' : 'words'}</p>
      <ul className={styles.list}>
        {shown.map(e => <Entry key={e.id} entry={e} />)}
      </ul>
    </>
  )
}
