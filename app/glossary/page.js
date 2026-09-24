import GLOSSARY from '../../data/glossary.json'
import { DAILY_WORDS } from '../../lib/library'
import PageHeader from '../../components/ui/PageHeader'
import GlossaryList from '../../components/glossary/GlossaryList'
import WordOfTheDay from '../../components/library/WordOfTheDay'
import WikiTree from '../../components/library/WikiTree'
import layout from '../../components/library/Library.module.css'
import styles from '../../components/wiki/Wiki.module.css'

export const metadata = {
  title: 'Bulgarian literary words',
  description: `${GLOSSARY.length} rare and literary Bulgarian words with their Bulgarian definitions and English meanings: блян, развигор, нега, съзерцание and more.`,
  alternates: { canonical: '/glossary' },
}

export default function GlossaryPage() {
  return (
    <div className={styles.page}>
      <PageHeader backHref="/library" backLabel="Library" title="Literary words" />
      <div className={layout.layout}>
        <main className={`${layout.primary} ${styles.article}`}>
          <h1 className={styles.title}>Literary words</h1>
          <p className={styles.muted}>
            Rare, bookish and old Bulgarian words that make writing sound rich, each with its dictionary definition.
            English meanings marked as a draft have not been checked by a native speaker yet.
          </p>
          <GlossaryList entries={GLOSSARY} />
        </main>
        <aside className={layout.aside}>
          <WordOfTheDay words={DAILY_WORDS} />
          <WikiTree />
        </aside>
      </div>
    </div>
  )
}
