'use client'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import styles from './About.module.css'

const HIGHLIGHTS = [
  {
    title: 'No noun cases',
    text: 'Nouns keep one form whatever their role in the sentence; prepositions do the work. Only pronouns still change (аз, мен, ми), and a vocative survives in calls like Иване! and мамо!',
    examples: [['Давам книгата на Мария.', 'I give the book to Maria.']],
  },
  {
    title: 'The article goes on the end',
    text: 'There is no separate word for "the". It is a suffix, as in Romanian or the Scandinavian languages.',
    examples: [['книга, книгата', 'a book, the book'], ['дете, детето', 'a child, the child']],
  },
  {
    title: 'No infinitive',
    text: 'Where English says "to go", Bulgarian uses да and a conjugated verb.',
    examples: [['Искам да отида.', 'I want to go. (literally: I want that I go)']],
  },
  {
    title: 'The renarrative',
    text: 'Verbs show whether you saw something yourself or only heard about it.',
    examples: [['Той беше в София.', 'He was in Sofia. (I know it)'], ['Той бил в София.', 'He was in Sofia, apparently. (I was told)']],
  },
]

export default function GrammarHighlights() {
  return (
    <div className={styles.grammar}>
      {HIGHLIGHTS.map(h => (
        <article key={h.title} className={styles.grammarCard}>
          <h3 className={styles.grammarTitle}>{h.title}</h3>
          <p className={styles.grammarText}>{h.text}</p>
          {h.examples.map(([bg, en]) => (
            <div key={bg} className={styles.example}>
              <button className={styles.exampleSpeak} onClick={() => { unlockAudio(); speakBulgarian(bg) }} aria-label={`Listen: ${bg}`}>
                <img src="/icons/speaker.png" alt="" width={16} height={16} />
              </button>
              <span className={styles.exampleText}>
                <span className={styles.exampleBg} lang="bg">{bg}</span>
                <span className={styles.exampleEn}>{en}</span>
              </span>
            </div>
          ))}
        </article>
      ))}
    </div>
  )
}
