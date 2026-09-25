import Link from 'next/link'
import PageHeader from '../../components/ui/PageHeader'
import Converter from '../../components/converter/Converter'
import hub from '../../components/Hub.module.css'
import styles from '../../components/converter/Page.module.css'

export const metadata = {
  title: 'Latin to Cyrillic converter for Bulgarian',
  description: 'Turn Bulgarian written in Latin letters (shliokavica) into proper Cyrillic. Knows when u means ъ, and when y, i or j mean й.',
  alternates: { canonical: '/converter' },
}

export default function ConverterPage() {
  return (
    <div className={hub.page}>
      <PageHeader backHref="/wiki/the-alphabet/latinized-bulgarian" backLabel="Latinized Bulgarian" title="Converter" />
      <main className={`${hub.single} ${styles.page}`}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Latin to Cyrillic</h1>
          <p className={styles.lead}>
            Type or paste Bulgarian written in Latin letters. Words are checked against the course vocabulary to tell
            ъ from у and й from и.
          </p>
        </div>
        <Converter />
        <p className={styles.tip}>
          Better long term: switch to the Bulgarian phonetic keyboard layout. The <Link href="/practice/typing">typing test</Link> shows
          where every letter sits.
        </p>
      </main>
    </div>
  )
}
