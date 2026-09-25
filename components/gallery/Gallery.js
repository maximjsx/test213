'use client'
import { useState } from 'react'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import Segmented from '../typing/Segmented'
import styles from './Gallery.module.css'

const CATEGORY_LABELS = { places: 'Places', nature: 'Nature', food: 'Food', traditions: 'Traditions', life: 'Everyday life', signs: 'Signs' }

function Photo({ photo }) {
  return (
    <figure className={styles.photo}>
      <img
        className={styles.image}
        src={photo.src}
        alt={photo.en}
        width={photo.width || undefined}
        height={photo.height || undefined}
        loading="lazy"
        decoding="async"
      />
      <figcaption className={styles.caption}>
        <div className={styles.captionHead}>
          <button className={styles.speak} onClick={() => { unlockAudio(); speakBulgarian(photo.bg) }} aria-label={`Listen: ${photo.bg}`}>
            <img src="/icons/speaker.png" alt="" width={16} height={16} />
          </button>
          <span className={styles.bg} lang="bg">{photo.bg}</span>
        </div>
        <span className={styles.en}>{photo.en}</span>
        <span className={styles.credit}>
          Photo: {photo.source ? <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.credit}</a> : photo.credit}
          {', '}
          {photo.licenceUrl ? <a href={photo.licenceUrl} target="_blank" rel="noopener noreferrer">{photo.licence}</a> : photo.licence}
        </span>
      </figcaption>
    </figure>
  )
}

export default function Gallery({ photos }) {
  const categories = Object.keys(CATEGORY_LABELS).filter(c => photos.some(p => p.category === c))
  const [category, setCategory] = useState('all')
  const shown = category === 'all' ? photos : photos.filter(p => p.category === category)

  return (
    <div className={styles.wrap}>
      <Segmented
        label="Category"
        options={[{ id: 'all', label: 'All' }, ...categories.map(c => ({ id: c, label: CATEGORY_LABELS[c] }))]}
        value={category}
        onChange={setCategory}
      />
      <div className={styles.grid}>
        {shown.map(p => <Photo key={p.id} photo={p} />)}
      </div>
    </div>
  )
}
