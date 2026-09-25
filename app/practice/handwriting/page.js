import PageHeader from '../../../components/ui/PageHeader'
import Handwriting from '../../../components/handwriting/Handwriting'
import styles from '../../../components/Hub.module.css'

export const metadata = {
  title: 'Write Bulgarian by hand',
  description: 'Practise writing Bulgarian letters, words and whole sentences by hand, in cursive or print. Trace them and get instant feedback.',
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
