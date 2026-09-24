import { LEVELS, findLevel } from '../../../lib/course'
import { passThrough } from '../../../lib/seo'

export function generateStaticParams() {
  return LEVELS.map(level => ({ id: level.id }))
}

export function generateMetadata({ params }) {
  const level = findLevel(params.id)
  if (!level) return { title: 'Topic not found' }
  const title = `${level.title}: Bulgarian lessons`
  const description = `${level.subtitle}. ${level.lessons.length} free interactive Bulgarian lessons with audio.`
  return {
    title,
    description,
    alternates: { canonical: `/topic/${level.id}` },
    openGraph: { title, description, url: `/topic/${level.id}` },
  }
}
export default passThrough
