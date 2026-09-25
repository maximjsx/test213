import GLOSSARY from '../../../data/glossary.json'
import PageHeader from '../../../components/ui/PageHeader'
import TypingTest from '../../../components/typing/TypingTest'
import styles from '../../../components/Hub.module.css'

export const metadata = {
  title: 'Bulgarian typing test',
  description: 'Test how fast you type in Bulgarian Cyrillic. Real words and sentences, 30 or 60 seconds, with an on-screen phonetic keyboard map.',
  alternates: { canonical: '/practice/typing' },
}

// Single words from the glossary add some rarer letters to the mix
const EXTRA_WORDS = GLOSSARY.map(g => g.bg).filter(w => !w.includes(' '))

export default function TypingPage() {
  return (
    <div className={styles.page}>
      <PageHeader backHref="/practice" backLabel="Practice" title="Typing test" />
      <main className={styles.single}>
        <TypingTest extraWords={EXTRA_WORDS} />
      </main>
    </div>
  )
}
