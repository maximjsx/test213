import { findLesson } from '../../../lib/course'
import { privatePage, passThrough } from '../../../lib/seo'

export function generateMetadata({ params }) {
  const found = findLesson(params.id)
  return privatePage(found ? `${found.level.title}: ${found.lesson.title}` : 'Lesson')
}
export default passThrough
