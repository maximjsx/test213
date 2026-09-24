import Link from 'next/link'
import { FEATURED_CARDS, CULTURE_CARDS, SEARCH_INDEX, DAILY_WORDS } from '../../lib/library'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import LibraryArt from '../../components/library/LibraryArt'
import LibrarySearch from '../../components/library/LibrarySearch'
import WordOfTheDay from '../../components/library/WordOfTheDay'
import WikiTree from '../../components/library/WikiTree'
import styles from '../../components/library/Library.module.css'

export const metadata = {
  title: 'Library: the Bulgarian language, explained',
  description: 'Read about Bulgarian: the Cyrillic alphabet, themed vocabulary lists, grammar notes, rare literary words, holidays, music and real videos with subtitles.',
  alternates: { canonical: '/library' },
}

function FeaturedCard({ card }) {
  return (
    <Link href={card.href} className={styles.feature} style={{ '--card': card.color }}>
      <span className={styles.glyph} lang="bg" aria-hidden="true">{card.glyph}</span>
      <span className={styles.featureBody}>
        <span className={styles.cardTitle}>{card.title}</span>
        <span className={styles.cardBlurb}>{card.blurb}</span>
        {card.pages > 0 && <span className={styles.cardMeta}>{card.pages} pages</span>}
      </span>
    </Link>
  )
}

function SmallCard({ card }) {
  return (
    <Link href={card.href} className={`${styles.small} ${card.warning ? styles.smallWarn : ''}`}>
      <span className={styles.cardTitle}>{card.title}</span>
      <span className={styles.cardBlurb}>{card.blurb}</span>
    </Link>
  )
}

export default function LibraryPage() {
  return (
    <div className={styles.page}>
      <PageHeader backHref={null} title="Library" />
      <div className={styles.layout}>
        <main className={styles.primary}>
          <section className={styles.hero}>
            <div className={styles.heroText}>
              <p className={styles.kicker} lang="bg">Български език</p>
              <h1 className={styles.heroTitle}>Everything around the language</h1>
              <p className={styles.heroLead}>
                Bulgarian is a South Slavic language and the official language of Bulgaria. Its medieval form, Old
                Church Slavonic, is the oldest written Slavic language, and the Cyrillic alphabet took shape in
                Bulgaria in the late 9th and early 10th centuries. Today it is one of the official languages of the
                European Union.
              </p>
              <div className={styles.heroActions}>
                <Button href="/wiki/the-alphabet">Start with the alphabet</Button>
                <Button href="/about-bulgarian" variant="secondary">About the language</Button>
              </div>
            </div>
            <LibraryArt className={styles.heroArt} />
          </section>

          <LibrarySearch index={SEARCH_INDEX} />

          <section className={styles.section} aria-labelledby="start">
            <h2 id="start" className={styles.sectionTitle}>Learn and look up</h2>
            <div className={styles.features}>
              {FEATURED_CARDS.map(card => <FeaturedCard key={card.href} card={card} />)}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="culture">
            <h2 id="culture" className={styles.sectionTitle}>Culture and more</h2>
            <div className={styles.smalls}>
              {CULTURE_CARDS.map(card => <SmallCard key={card.href} card={card} />)}
            </div>
          </section>
        </main>

        <aside className={styles.aside}>
          <WordOfTheDay words={DAILY_WORDS} />
          <WikiTree />
        </aside>
      </div>
    </div>
  )
}
