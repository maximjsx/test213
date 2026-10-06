import styles from './Exercise.module.css'

// Every course picture goes through here so AI generated ones always carry their label (EU AI Act disclosure)
export default function Picture({ image, className = '' }) {
  if (!image?.url) return null
  return (
    <span className={`${styles.picture} ${className}`}>
      <img src={image.url} alt="" draggable={false} />
      {image.ai && <span className={styles.aiTag}>AI generated</span>}
    </span>
  )
}
