import PageHeader from '../../../components/ui/PageHeader'
import Handwriting from '../../../components/handwriting/Handwriting'
import styles from '../../../components/Hub.module.css'

export const metadata = {
  title: 'Write the Cyrillic alphabet',
  description: 'Practise writing all 30 Bulgarian letters by hand, in print and in cursive. Trace them or write from memory and get instant feedback.',
  alternates: { canonical: '/practice/handwriting' },
}

export default function HandwritingPage() {
  return (
    <div className={styles.page}>
      <PageHeader backHref="/practice" backLabel="Practice" title="Handwriting" />
      <main className={styles.single}>
        <Handwriting />
      </main>
    </div>
  )
}
