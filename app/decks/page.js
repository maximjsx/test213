'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useDecks } from '../../hooks/useDecks'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import { ListSkeleton } from '../../components/PageSkeletons'
import { ArrowRight } from '../../components/home/ResumeCard'
import DeckCounts from '../../components/decks/DeckCounts'
import SignInCard from '../../components/decks/SignInCard'
import ReviewCta from '../../components/decks/ReviewCta'
import styles from '../../components/decks/Decks.module.css'

function NewDeckForm() {
  const { createDeck } = useDecks()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createDeck(name)
      setName('')
    } catch {
      setError('Could not create the deck.')
    }
    setBusy(false)
  }

  return (
    <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
      <label className={styles.label} htmlFor="new-deck">New deck</label>
      <div className={styles.row}>
        <input id="new-deck" className={styles.input} value={name} maxLength={60} placeholder="Slang, Food, Song words..." onChange={e => setName(e.target.value)} />
        <Button type="submit" disabled={busy}>Create</Button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  )
}

export default function DecksPage() {
  const { status, decks, dueCount } = useDecks()
  if (status === 'loading') return <ListSkeleton rows={4} />

  return (
    <div className={styles.page}>
      <PageHeader backHref="/practice" backLabel="Practice" title="Decks" />
      <main className={styles.main}>
        {status === 'guest' && <SignInCard />}
        {status === 'error' && <p className={styles.error}>Your decks could not be loaded. Check your connection and reload.</p>}
        {status === 'ready' && (
          <>
            <ReviewCta count={dueCount} />
            {decks.length === 0 ? (
              <div className={styles.empty}>
                <img src="/icons/open_book.png" alt="" width={48} height={48} />
                <p className={styles.emptyTitle}>No decks yet</p>
                <p className={styles.muted}>Create one below, or tap the plus next to any word in lessons and the word list.</p>
              </div>
            ) : (
              <div className={styles.list}>
                {decks.map(deck => (
                  <Link key={deck.id} href={`/decks/${deck.id}`} className={styles.deckRow}>
                    <span className={styles.deckInfo}>
                      <span className={styles.deckName}>{deck.name}</span>
                      <DeckCounts deck={deck} />
                    </span>
                    <ArrowRight size={20} />
                  </Link>
                ))}
              </div>
            )}
            <NewDeckForm />
          </>
        )}
      </main>
    </div>
  )
}
