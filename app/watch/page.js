import Link from 'next/link'
import { MEDIA } from '../../lib/mediaLibrary'
import PageHeader from '../../components/ui/PageHeader'
import styles from '../../components/media/Watch.module.css'

export const metadata = {
  title: 'Bulgarian videos and songs',
  description: 'Learn Bulgarian from real videos and songs with Bulgarian and English subtitles side by side. Tap any word for its meaning and save it to a deck.',
  alternates: { canonical: '/watch' },
}

const KINDS = [
  { kind: 'video', title: 'Videos' },
  { kind: 'song', title: 'Songs' },
]

function MediaCard({ item }) {
  return (
    <Link href={`/watch/${item.id}`} className={styles.card}>
      <img
        className={styles.thumb}
        src={`https://i.ytimg.com/vi/${item.youtubeId}/mqdefault.jpg`}
        alt=""
        width={320}
        height={180}
        loading="lazy"
      />
      <span className={styles.cardBody}>
        <span className={styles.cardTitle}>{item.title}</span>
        <span className={styles.cardMeta}>
          {item.artist || item.channel}
          {item.level && <span className={styles.level}>{item.level}</span>}
        </span>
      </span>
    </Link>
  )
}

export default function WatchPage() {
  return (
    <div className={styles.page}>
      <PageHeader backHref="/library" backLabel="Library" title="Watch and listen" />
      <main className={styles.main}>
        <h1 className={styles.title}>Watch and listen</h1>
        <p className={styles.muted}>
          Real Bulgarian with subtitles in both languages. Tap a word to see what it means, loop a line until you catch
          it, or slow the video down.
        </p>
        {MEDIA.length === 0 && <p className={styles.empty}>The first videos are on their way.</p>}
        {KINDS.map(({ kind, title }) => {
          const items = MEDIA.filter(m => m.kind === kind)
          if (!items.length) return null
          return (
            <section key={kind} className={styles.section} aria-labelledby={`kind-${kind}`}>
              <h2 id={`kind-${kind}`} className={styles.sectionTitle}>{title}</h2>
              <div className={styles.grid}>{items.map(item => <MediaCard key={item.id} item={item} />)}</div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
