import GLOSSARY from '../../data/glossary.json'
import PageHeader from '../../components/ui/PageHeader'
import GlossaryList from '../../components/glossary/GlossaryList'
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
      <main className={styles.main}>
        <h1 className={styles.title}>Literary words</h1>
        <p className={styles.muted}>
          Rare, bookish and old Bulgarian words that make writing sound rich, each with its dictionary definition.
          English meanings marked as a draft have not been checked by a native speaker yet.
        </p>
        <GlossaryList entries={GLOSSARY} />
      </main>
    </div>
  )
}
