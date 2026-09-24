import { privatePage, passThrough } from '../../../lib/seo'

// Learner profiles are shareable by link but kept out of search results
export function generateMetadata({ params }) {
  return privatePage(`@${decodeURIComponent(params.username)}`)
}
export default passThrough
