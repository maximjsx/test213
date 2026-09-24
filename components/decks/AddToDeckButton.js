'use client'
import { useState } from 'react'
import { useDecks, lastDeckId } from '../../hooks/useDecks'
import { lookupEnglish } from '../../lib/lookup'
import Modal, { ModalText, ModalActions } from '../ui/Modal'
import Button from '../ui/Button'
import DiscordIcon from '../ui/DiscordIcon'
import styles from './AddToDeckButton.module.css'

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  )
}

function DeckPicker({ word, onClose }) {
  const { status, decks, addCard, createDeck } = useDecks()
  const [en, setEn] = useState(word.en || lookupEnglish(word.bg))
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const preferred = decks.find(d => d.id === lastDeckId())?.id

  async function add(deckId) {
    setBusy(true)
    setError('')
    try {
      await addCard(deckId, { ...word, en })
      onClose()
    } catch {
      setError('Could not add the word. Try again.')
      setBusy(false)
    }
  }

  async function addToNewDeck(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const deck = await createDeck(newName || 'My words')
      await add(deck.id)
    } catch {
      setError('Could not create the deck.')
      setBusy(false)
    }
  }

  return (
    <Modal title="Add to deck" onClose={onClose} size="sm">
      <div className={styles.word}>
        <span className={styles.bg} lang="bg">{word.bg}</span>
        <input
          className={styles.input}
          value={en}
          placeholder="English meaning"
          aria-label="English meaning"
          onChange={e => setEn(e.target.value)}
        />
      </div>
      {status === 'loading' && <ModalText>Loading your decks...</ModalText>}
      {status === 'error' && <ModalText>Your decks could not be loaded. Check your connection and try again.</ModalText>}
      {decks.length > 0 && (
        <div className={styles.decks}>
          {[...decks].sort((a, b) => (b.id === preferred) - (a.id === preferred)).map(d => (
            <button key={d.id} className={styles.deck} onClick={() => add(d.id)} disabled={busy}>
              <span className={styles.deckName}>{d.name}</span>
              <span className={styles.deckCount}>{d.total} cards</span>
            </button>
          ))}
        </div>
      )}
      {status === 'ready' && (
        <form className={styles.newDeck} onSubmit={addToNewDeck}>
          <input
            className={styles.input}
            value={newName}
            placeholder={decks.length ? 'New deck name' : 'My words'}
            aria-label="New deck name"
            maxLength={60}
            onChange={e => setNewName(e.target.value)}
          />
          <Button type="submit" variant={decks.length ? 'secondary' : 'primary'} disabled={busy}>
            {decks.length ? 'New deck' : 'Create deck'}
          </Button>
        </form>
      )}
      {error && <ModalText>{error}</ModalText>}
    </Modal>
  )
}

function SignInPrompt({ onClose }) {
  return (
    <Modal title="Save words to decks" onClose={onClose} size="sm">
      <ModalText>Sign in with Discord to collect words in decks and review them with spaced repetition on any device.</ModalText>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Not now</Button>
        <Button href="/api/auth/login"><DiscordIcon size={18} /> Sign in</Button>
      </ModalActions>
    </Modal>
  )
}

// word: { bg, en?, note?, source: { kind, ref? } }
export default function AddToDeckButton({ word, size = 'md', className = '' }) {
  const { status, decksWith } = useDecks()
  const [open, setOpen] = useState(false)
  const saved = status === 'ready' && decksWith(word.bg).length > 0

  return (
    <>
      <button
        type="button"
        className={`${styles.button} ${styles[size]} ${saved ? styles.saved : ''} ${className}`}
        onClick={e => { e.stopPropagation(); setOpen(true) }}
        aria-label={saved ? `${word.bg} is in a deck. Add to another deck` : `Add ${word.bg} to a deck`}
        title={saved ? 'In your deck' : 'Add to deck'}
      >
        {saved ? <CheckIcon /> : <PlusIcon />}
      </button>
      {open && (status === 'guest'
        ? <SignInPrompt onClose={() => setOpen(false)} />
        : <DeckPicker word={word} onClose={() => setOpen(false)} />)}
    </>
  )
}
