'use client'
import { Marck_Script } from 'next/font/google'
import { LETTERS } from '../../lib/words'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import styles from './AlphabetGrid.module.css'

const cursive = Marck_Script({ weight: '400', subsets: ['cyrillic'], display: 'swap' })

// Official transliteration (Streamlined System, used on passports and road signs)
const LATIN = {
  А: 'a', Б: 'b', В: 'v', Г: 'g', Д: 'd', Е: 'e', Ж: 'zh', З: 'z', И: 'i', Й: 'y',
  К: 'k', Л: 'l', М: 'm', Н: 'n', О: 'o', П: 'p', Р: 'r', С: 's', Т: 't', У: 'u',
  Ф: 'f', Х: 'h', Ц: 'ts', Ч: 'ch', Ш: 'sh', Щ: 'sht', Ъ: 'a', Ь: 'y', Ю: 'yu', Я: 'ya',
}

function LetterCard({ item }) {
  const lower = item.letter.toLowerCase()
  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => { unlockAudio(); speakBulgarian(item.tts) }}
      aria-label={`${item.letter}: ${item.hint}. Tap to hear it.`}
    >
      <span className={styles.top}>
        <span className={styles.glyph} lang="bg">{item.letter}{lower}</span>
        <span className={styles.latin}>{LATIN[item.letter]}</span>
      </span>
      <span className={`${styles.cursive} ${cursive.className}`} lang="bg" aria-hidden="true">{item.letter}{lower}</span>
      <span className={styles.hint}>{item.hint}</span>
    </button>
  )
}

export default function AlphabetGrid() {
  return (
    <section className={styles.wrap} aria-label="The 30 letters">
      <div className={styles.grid}>
        {LETTERS.map(item => <LetterCard key={item.letter} item={item} />)}
      </div>
      <p className={styles.note}>Tap a letter to hear it. The second line is how it looks handwritten; the small tag is its official Latin spelling.</p>
    </section>
  )
}
