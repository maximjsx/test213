import Link from 'next/link'
import GLOSSARY from '../../data/glossary.json'
import { WIKI_PAGES } from '../../lib/wiki'
import PageHeader from '../../components/ui/PageHeader'
import { ArrowRight } from '../../components/home/ResumeCard'
import styles from '../../components/Hub.module.css'

export const metadata = {
  title: 'Library',
  description: 'Read about Bulgarian: a community wiki with vocabulary lists and grammar notes, and a glossary of literary words.',
  alternates: { canonical: '/library' },
}

const SECTIONS = [
  { href: '/wiki', icon: '/icons/open_book.png', title: 'Wiki', sub: `${WIKI_PAGES.length} pages: vocabulary lists, phrases, grammar rules, history, music` },
  { href: '/glossary', icon: '/icons/another_star.png', title: 'Literary words', sub: `${GLOSSARY.length} rare and bookish words with definitions` },
]

export default function LibraryPage() {
  return (
    <div className={styles.page}>
      <PageHeader backHref={null} title="Library" />
      <main className={styles.main}>
        {SECTIONS.map(s => (
          <Link key={s.href} href={s.href} className={styles.link}>
            <span className={styles.icon}><img src={s.icon} alt="" width={30} height={30} /></span>
            <span className={styles.text}>
              <span className={styles.title}>{s.title}</span>
              <span className={styles.sub}>{s.sub}</span>
            </span>
            <span className={styles.arrow}><ArrowRight size={20} /></span>
          </Link>
        ))}
      </main>
    </div>
  )
}
