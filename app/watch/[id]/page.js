import { notFound } from 'next/navigation'
import { MEDIA, findMedia, loadTrack } from '../../../lib/mediaLibrary'
import PageHeader from '../../../components/ui/PageHeader'
import MediaPlayer from '../../../components/media/MediaPlayer'
import styles from '../../../components/media/Watch.module.css'

export const dynamicParams = false

export function generateStaticParams() {
  return MEDIA.map(m => ({ id: m.id }))
}

// Song lyrics are copyrighted, so song pages stay out of search results
export function generateMetadata({ params }) {
  const item = findMedia(params.id)
  if (!item) return {}
  const by = item.artist || item.channel
  return {
    title: `${item.title}${by ? ` (${by})` : ''} with Bulgarian and English subtitles`,
    description: `Watch "${item.title}" with Bulgarian and English subtitles. Tap any word for its meaning, loop lines and slow it down.`,
    alternates: { canonical: `/watch/${item.id}` },
    ...(item.kind === 'song' ? { robots: { index: false, follow: true } } : {}),
  }
}

export default function WatchItemPage({ params }) {
  const item = findMedia(params.id)
  if (!item) notFound()
  return (
    <div className={styles.page}>
      <PageHeader backHref="/watch" backLabel="Watch" title={item.title} />
      <main className={`${styles.main} ${styles.mainWide}`}>
        <MediaPlayer media={item} track={loadTrack(item.id)} />
        {item.captionSource === 'auto' && (
          <p className={styles.muted}>Bulgarian lines come from YouTube&apos;s automatic captions and may contain mistakes.</p>
        )}
      </main>
    </div>
  )
}
