import Link from 'next/link'
import { wikiBody, wikiChildren } from '../../lib/wiki'
import PageHeader from '../../components/ui/PageHeader'
import Markdown from '../../components/ui/Markdown'
import styles from '../../components/wiki/Wiki.module.css'

export const metadata = {
  title: 'Bulgarian wiki',
  description: 'Community notes on Bulgarian: the alphabet, vocabulary lists, phrases, grammar rules, idioms, history, holidays, music and more.',
  alternates: { canonical: '/wiki' },
}

export default function WikiIndexPage() {
  const sections = wikiChildren('')
  return (
    <div className={styles.page}>
      <PageHeader backHref="/library" backLabel="Library" title="Wiki" />
      <main className={styles.main}>
        <h1 className={styles.title}>Bulgarian wiki</h1>
        <Markdown text={wikiBody('')} />
        <section className={styles.section} aria-labelledby="sections">
          <h2 id="sections" className={styles.sectionTitle}>Sections</h2>
          <div className={styles.grid}>
            {sections.map(s => {
              const count = wikiChildren(s.slug).length
              return (
                <Link key={s.slug} href={`/wiki/${s.slug}`} className={styles.tile}>
                  <span className={styles.tileTitle}>{s.title}</span>
                  <span className={styles.muted}>
                    {s.warning ? 'Vulgar language' : count ? `${count} ${count === 1 ? 'page' : 'pages'}` : 'One page'}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
