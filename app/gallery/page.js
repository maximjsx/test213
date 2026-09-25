import GALLERY from '../../data/gallery.json'
import PageHeader from '../../components/ui/PageHeader'
import Gallery from '../../components/gallery/Gallery'
import styles from '../../components/Hub.module.css'

export const metadata = {
  title: 'Bulgaria in photos',
  description: 'Photos of Bulgarian places, food and traditions, captioned in Bulgarian and English with audio. Reading practice with real pictures.',
  alternates: { canonical: '/gallery' },
}

export default function GalleryPage() {
  return (
    <div className={styles.page}>
      <PageHeader backHref="/wiki" backLabel="Wiki" title="Bulgaria in photos" />
      <main className={styles.wide}>
        <Gallery photos={GALLERY} />
      </main>
    </div>
  )
}
