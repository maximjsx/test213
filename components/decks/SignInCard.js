import Button from '../ui/Button'
import DiscordIcon from '../ui/DiscordIcon'
import styles from './Decks.module.css'

export default function SignInCard() {
  return (
    <div className={styles.empty}>
      <img src="/icons/open_book.png" alt="" width={48} height={48} />
      <p className={styles.emptyTitle}>Keep the words you meet</p>
      <p className={styles.muted}>
        Collect words from lessons, the word list and your own notes in decks, then review them with
        spaced repetition, the same method Anki uses. Decks are saved to your account.
      </p>
      <Button href="/api/auth/login"><DiscordIcon size={18} /> Sign in with Discord</Button>
    </div>
  )
}
