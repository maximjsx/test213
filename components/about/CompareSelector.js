'use client'
import { useState } from 'react'
import styles from './About.module.css'

// Qualitative only: no invented percentages. Each note is a concrete,
// checkable point about script, grammar or vocabulary.
const LANGUAGES = [
  { id: 'mk', name: 'Macedonian', level: 'Very close', tone: 'teal', notes: [
    'Bulgarian and Macedonian dialects form one continuum with no sharp border between them.',
    'Both put the definite article at the end of the noun, have no noun cases and no infinitive.',
    'Macedonian Cyrillic has a few letters of its own (ѓ, ќ, ѕ, џ, љ, њ, ј).',
  ] },
  { id: 'ru', name: 'Russian', level: 'Close', tone: 'blue', notes: [
    'Same Cyrillic alphabet with small differences: Bulgarian has no ы or э, and ъ is a full vowel.',
    'A large share of everyday and literary vocabulary is recognisably the same.',
    'The big difference: Russian has six noun cases and no articles; Bulgarian has articles and no noun cases.',
  ] },
  { id: 'sh', name: 'Serbian or Croatian', level: 'Close', tone: 'blue', notes: [
    'A South Slavic neighbour with plenty of shared vocabulary. Serbian is written in Cyrillic as well as Latin.',
    'Serbo-Croatian keeps seven noun cases and has no articles.',
  ] },
  { id: 'uk', name: 'Ukrainian', level: 'Close', tone: 'blue', notes: [
    'Cyrillic script (Ukrainian adds і, ї, є and ґ) and lots of related Slavic words.',
    'Ukrainian has seven cases and no articles.',
  ] },
  { id: 'pl', name: 'Polish or Czech', level: 'Related', tone: 'blue', notes: [
    'West Slavic languages: many words are recognisably related once you see past the spelling.',
    'Latin alphabet with diacritics, seven noun cases and no articles.',
  ] },
  { id: 'ro', name: 'Romanian', level: 'Shared grammar', tone: 'orange', notes: [
    'A Romance language, but a Balkan neighbour: it also puts the article at the end of the noun (om, omul like човек, човекът).',
    'It often swaps the infinitive for a clause: vreau să merg, like искам да отида, "I want to go".',
    'Romanian has many Slavic loanwords, so some Bulgarian words will look familiar.',
  ] },
  { id: 'el', name: 'Greek', level: 'Shared grammar', tone: 'orange', notes: [
    'Greek has no infinitive either: θέλω να πάω works like искам да отида.',
    'Both form the future with a particle that grew out of "want": θα in Greek, ще in Bulgarian.',
    'Cyrillic was built on Greek letters, so many shapes are familiar.',
  ] },
  { id: 'sq', name: 'Albanian', level: 'Shared grammar', tone: 'orange', notes: [
    'The definite article goes on the end of the noun, as in Bulgarian.',
    'The future is made with a "want" particle too (do të), like Bulgarian ще.',
  ] },
  { id: 'tr', name: 'Turkish', level: 'Shared words', tone: 'orange', notes: [
    'Unrelated, but centuries of Ottoman rule left many Turkish words in everyday Bulgarian, such as чорап (sock) and чанта (bag).',
    'Turkish also marks things you only heard about (-miş), much like the Bulgarian renarrative forms.',
  ] },
  { id: 'en', name: 'English', level: 'Distant', tone: 'muted', notes: [
    'Different alphabet and very little shared vocabulary beyond international words.',
    'Two helpful overlaps: English nouns have no case endings either, and both languages use a definite article. Bulgarian just attaches it to the end: книгата, "the book".',
    'The US Foreign Service Institute puts Bulgarian in category III: about 44 weeks of full-time study for English speakers.',
  ] },
  { id: 'de', name: 'German', level: 'Distant', tone: 'muted', notes: [
    'German keeps four cases on articles and adjectives; Bulgarian nouns have none.',
    'The FSI rates German category II (about 36 weeks) and Bulgarian category III (about 44 weeks).',
  ] },
  { id: 'es', name: 'Spanish', level: 'Distant', tone: 'muted', notes: [
    'Few shared words beyond international ones. Spanish puts its article before the noun (el libro), Bulgarian after it (книгата).',
    'The FSI rates Spanish category I (24 to 30 weeks) and Bulgarian category III (about 44 weeks).',
  ] },
]

export default function CompareSelector() {
  const [id, setId] = useState('ru')
  const lang = LANGUAGES.find(l => l.id === id)
  return (
    <div className={styles.compare}>
      <p className={styles.compareLabel} id="compare-label">I already speak</p>
      <div className={styles.chips} role="radiogroup" aria-labelledby="compare-label">
        {LANGUAGES.map(l => (
          <button
            key={l.id}
            role="radio"
            aria-checked={l.id === id}
            className={`${styles.chip} ${l.id === id ? styles.chipOn : ''}`}
            onClick={() => setId(l.id)}
          >
            {l.name}
          </button>
        ))}
      </div>
      <div className={styles.compareCard} aria-live="polite">
        <div className={styles.compareHead}>
          <span className={styles.compareName}>{lang.name} and Bulgarian</span>
          <span className={`${styles.level} ${styles[`level_${lang.tone}`]}`}>{lang.level}</span>
        </div>
        <ul className={styles.compareNotes}>
          {lang.notes.map(n => <li key={n}>{n}</li>)}
        </ul>
      </div>
    </div>
  )
}
