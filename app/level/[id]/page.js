import { notFound } from 'next/navigation'
import { LEVELS, findLevel } from '../../../lib/course'
import PageHeader from '../../../components/ui/PageHeader'
import Markdown from '../../../components/ui/Markdown'
import Button from '../../../components/ui/Button'
import styles from './page.module.css'

export function generateStaticParams() {
  return LEVELS.map(level => ({ id: level.id }))
}

export function generateMetadata({ params }) {
  const level = findLevel(params.id)
  if (!level) return {}
  const title = `${level.title} notes`
  const description = `${level.subtitle}. Bulgarian vocabulary and grammar notes for the "${level.title}" topic.`
  return {
    title,
    description,
    alternates: { canonical: `/level/${level.id}` },
    openGraph: { title, description, url: `/level/${level.id}` },
  }
}

export default function LevelNotesPage({ params }) {
  const level = findLevel(params.id)
  if (!level) notFound()

  return (
    <div className={styles.page} style={{ '--lvl': level.color }}>
      <PageHeader backHref={`/topic/${level.id}`} backLabel={level.title} />
      <main className={styles.content}>
        <span className={styles.levelChip}>{level.title}</span>
        <h1 className={styles.title}>{level.subtitle}</h1>
        {level.notes?.trim()
          ? <Markdown text={level.notes} />
          : <p className={styles.empty}>No notes for this topic yet.</p>}
        <div className={styles.cta}>
          <Button href={`/topic/${level.id}`} color={level.color} size="lg" block>Practice this topic</Button>
        </div>
      </main>
    </div>
  )
}
