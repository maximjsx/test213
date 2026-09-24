import Link from 'next/link'
import { SITE_URL } from '../../lib/seo'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FamilyTree from '../../components/about/FamilyTree'
import Timeline from '../../components/about/Timeline'
import CompareSelector from '../../components/about/CompareSelector'
import FsiChart from '../../components/about/FsiChart'
import GrammarHighlights from '../../components/about/GrammarHighlights'
import styles from '../../components/about/About.module.css'

const TITLE = 'About the Bulgarian language'
const DESCRIPTION = 'Where Bulgarian comes from, how hard it is for English speakers, how close it is to Russian, Macedonian and other languages, and the grammar that makes it unusual among Slavic languages.'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about-bulgarian' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/about-bulgarian', type: 'article' },
}

const ARTICLE_DATA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: TITLE,
  description: DESCRIPTION,
  url: `${SITE_URL}/about-bulgarian`,
  inLanguage: 'en',
  about: { '@type': 'Language', name: 'Bulgarian', alternateName: 'bg' },
}

const SOURCES = [
  { label: 'Bulgarian language, Wikipedia', href: 'https://en.wikipedia.org/wiki/Bulgarian_language' },
  { label: 'Middle Bulgarian, Wikipedia', href: 'https://en.wikipedia.org/wiki/Middle_Bulgarian' },
  { label: 'Preslav Literary School, Wikipedia', href: 'https://en.wikipedia.org/wiki/Preslav_Literary_School' },
  { label: 'Reforms of Bulgarian orthography, Wikipedia', href: 'https://en.wikipedia.org/wiki/Reforms_of_Bulgarian_orthography' },
  { label: '2007 enlargement of the European Union, Wikipedia', href: 'https://en.wikipedia.org/wiki/2007_enlargement_of_the_European_Union' },
  { label: 'Foreign Language Training, U.S. Department of State', href: 'https://2021-2025.state.gov/foreign-language-training/' },
]

const SECTIONS = [
  ['family', 'Family tree'],
  ['history', 'History'],
  ['compare', 'Compared to your language'],
  ['difficulty', 'How hard is it?'],
  ['grammar', 'What makes it unusual'],
  ['sources', 'Sources'],
]

export default function AboutBulgarianPage() {
  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_DATA) }} />
      <PageHeader backHref="/library" backLabel="Library" title="About Bulgarian" />
      <div className={styles.layout}>
        <main className={styles.article}>
          <header className={styles.intro}>
            <p className={styles.kicker} lang="bg">Български език</p>
            <h1 className={styles.title}>{TITLE}</h1>
            <p className={styles.lead}>
              Bulgarian is a South Slavic language written in Cyrillic, the official language of Bulgaria and one of the
              official languages of the European Union. It was the first Slavic language to be written down, and its
              grammar took a different road from its relatives: no noun cases, an article on the end of the word, and
              verbs that say whether you saw something yourself.
            </p>
          </header>

          <section id="family" className={styles.section}>
            <h2 className={styles.h2}>Family tree</h2>
            <p className={styles.p}>
              Bulgarian belongs to the Slavic branch of the Indo-European family. Its closest relative is Macedonian;
              the two form the eastern group of the South Slavic languages.
            </p>
            <FamilyTree />
          </section>

          <section id="history" className={styles.section}>
            <h2 className={styles.h2}>History</h2>
            <p className={styles.p}>From the first Slavic alphabet to the third official alphabet of the EU.</p>
            <Timeline />
          </section>

          <section id="compare" className={styles.section}>
            <h2 className={styles.h2}>Compared to a language you know</h2>
            <p className={styles.p}>
              What you can carry over depends on where you start: the alphabet and vocabulary from other Slavic
              languages, grammar from Bulgaria&apos;s Balkan neighbours.
            </p>
            <CompareSelector />
          </section>

          <section id="difficulty" className={styles.section}>
            <h2 className={styles.h2}>How hard is it?</h2>
            <p className={styles.p}>
              For English speakers the US Foreign Service Institute places Bulgarian in category III, the same group as
              Russian, Polish and Greek: about 44 weeks, or 1100 class hours, of full-time study to reach professional
              working proficiency. The alphabet takes days, not months; the verbs take longest.
            </p>
            <FsiChart />
          </section>

          <section id="grammar" className={styles.section}>
            <h2 className={styles.h2}>What makes it unusual</h2>
            <p className={styles.p}>Four features that set Bulgarian apart from most other Slavic languages. Tap an example to hear it.</p>
            <GrammarHighlights />
          </section>

          <div className={styles.cta}>
            <Button href="/topic/alphabet" size="lg">Start with the alphabet</Button>
            <Button href="/library" variant="secondary" size="lg">Browse the library</Button>
          </div>

          <section id="sources" className={styles.section}>
            <h2 className={styles.h2}>Sources</h2>
            <ul className={styles.sources}>
              {SOURCES.map(s => (
                <li key={s.href}><a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
              ))}
            </ul>
          </section>
        </main>

        <aside className={styles.toc}>
          <nav aria-label="On this page">
            <p className={styles.tocTitle}>On this page</p>
            <ul>
              {SECTIONS.map(([id, label]) => <li key={id}><Link href={`#${id}`}>{label}</Link></li>)}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  )
}
