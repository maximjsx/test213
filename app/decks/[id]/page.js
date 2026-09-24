'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDecks, deckRequest } from '../../../hooks/useDecks'
import { speakBulgarian, unlockAudio } from '../../../lib/audio'
import { lookupEnglish } from '../../../lib/lookup'
import { STATE_NEW, formatInterval } from '../../../lib/srs'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Modal, { ModalText, ModalActions } from '../../../components/ui/Modal'
import { ListSkeleton } from '../../../components/PageSkeletons'
import DeckCounts from '../../../components/decks/DeckCounts'
import SignInCard from '../../../components/decks/SignInCard'
import ReviewCta from '../../../components/decks/ReviewCta'
import styles from '../../../components/decks/Decks.module.css'

function play(text) {
  unlockAudio()
  speakBulgarian(text)
}

function SpeakerButton({ text }) {
  return (
    <button type="button" className={styles.iconBtn} onClick={() => play(text)} aria-label={`Listen to ${text}`} disabled={!text.trim()}>
      <img src="/icons/speaker.png" alt="" width={18} height={18} />
    </button>
  )
}

function CardForm({ initial = { bg: '', en: '', note: '' }, submitLabel, onSubmit, onCancel }) {
  const [card, setCard] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (field, value) => setCard(c => ({ ...c, [field]: value }))

  async function submit(e) {
    e.preventDefault()
    if (!card.bg.trim()) return
    setBusy(true)
    setError('')
    try {
      await onSubmit(card)
      if (!onCancel) setCard({ bg: '', en: '', note: '' })
    } catch (err) {
      setError(err.message === 'duplicate' ? 'That word is already in this deck.' : 'Could not save the card.')
    }
    setBusy(false)
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.row}>
        <input
          className={styles.input} lang="bg" value={card.bg} maxLength={200} placeholder="Bulgarian" aria-label="Bulgarian"
          onChange={e => set('bg', e.target.value)}
          onBlur={() => !card.en && set('en', lookupEnglish(card.bg))}
        />
        <SpeakerButton text={card.bg} />
      </div>
      <input className={styles.input} value={card.en} maxLength={300} placeholder="English" aria-label="English" onChange={e => set('en', e.target.value)} />
      <textarea className={styles.textarea} value={card.note} maxLength={500} rows={2} placeholder="Note (optional): when to use it, an example..." aria-label="Note" onChange={e => set('note', e.target.value)} />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.row}>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={busy || !card.bg.trim()}>{submitLabel}</Button>
      </div>
    </form>
  )
}

function dueLabel(card, now) {
  if (card.suspended) return 'Suspended'
  if (card.fsrs.state === STATE_NEW) return 'New'
  const ms = new Date(card.fsrs.due) - now
  return ms <= 0 ? 'Due' : `In ${formatInterval(ms)}`
}

function CardRow({ card, now, onEdit, onToggleSuspend, onDelete }) {
  return (
    <div className={`${styles.cardRow} ${card.suspended ? styles.cardSuspended : ''}`}>
      <SpeakerButton text={card.bg} />
      <div className={styles.cardText}>
        <span className={styles.cardBg} lang="bg">{card.bg}</span>
        {card.en && <span className={styles.cardEn}>{card.en}</span>}
        {card.note && <span className={styles.cardNote}>{card.note}</span>}
      </div>
      <div className={styles.cardActions}>
        <span className={styles.cardDue}>{dueLabel(card, now)}</span>
        <span className={styles.row}>
          <button className={styles.linkBtn} onClick={onEdit}>Edit</button>
          <button className={styles.linkBtn} onClick={onToggleSuspend}>{card.suspended ? 'Resume' : 'Pause'}</button>
          <button className={`${styles.linkBtn} ${styles.danger}`} onClick={onDelete}>Delete</button>
        </span>
      </div>
    </div>
  )
}

function DeckSettings({ deck, onSaved, onDelete }) {
  const [name, setName] = useState(deck.name)
  const [settings, setSettings] = useState(deck.settings)
  const [saved, setSaved] = useState(false)
  const setNum = (field, value) => setSettings(s => ({ ...s, [field]: Number(value) }))

  async function save(e) {
    e.preventDefault()
    await deckRequest(`/api/decks/${deck.id}`, 'PATCH', { name, settings })
    setSaved(true)
    onSaved()
  }

  return (
    <form className={`${styles.card} ${styles.form}`} onSubmit={save}>
      <h2 className={styles.cardTitle}>Deck settings</h2>
      <label className={styles.label}>Name
        <input className={styles.input} value={name} maxLength={60} onChange={e => { setName(e.target.value); setSaved(false) }} />
      </label>
      <div className={styles.settingsGrid}>
        <label className={styles.label}>New cards a day
          <input className={styles.input} type="number" min={0} max={500} value={settings.newPerDay} onChange={e => { setNum('newPerDay', e.target.value); setSaved(false) }} />
        </label>
        <label className={styles.label}>Reviews a day
          <input className={styles.input} type="number" min={0} max={5000} value={settings.reviewsPerDay} onChange={e => { setNum('reviewsPerDay', e.target.value); setSaved(false) }} />
        </label>
        <label className={styles.label}>Target recall
          <select className={styles.select} value={settings.retention} onChange={e => { setNum('retention', e.target.value); setSaved(false) }}>
            <option value={0.8}>80%, fewer reviews</option>
            <option value={0.85}>85%</option>
            <option value={0.9}>90%, recommended</option>
            <option value={0.95}>95%, more reviews</option>
          </select>
        </label>
      </div>
      <div className={styles.row}>
        <Button type="submit" variant="secondary">{saved ? 'Saved' : 'Save settings'}</Button>
        <Button variant="danger" onClick={onDelete}>Delete deck</Button>
      </div>
    </form>
  )
}

export default function DeckPage() {
  const { id } = useParams()
  const router = useRouter()
  const { status, decks, refresh } = useDecks()
  const deck = decks.find(d => d.id === id)
  const [cards, setCards] = useState(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind: 'card' | 'deck', card? }
  const now = useMemo(() => new Date(), [cards])

  useEffect(() => {
    if (status !== 'ready') return
    deckRequest(`/api/decks/${id}/cards`, 'GET').then(d => setCards(d.cards)).catch(() => setCards([]))
  }, [status, id])

  if (status === 'loading' || (status === 'ready' && deck && !cards)) return <ListSkeleton />

  const header = <PageHeader backHref="/decks" backLabel="Decks" title={deck?.name || 'Deck'} />
  if (status === 'guest') return <div className={styles.page}>{header}<main className={styles.main}><SignInCard /></main></div>
  if (!deck) {
    return (
      <div className={styles.page}>{header}
        <main className={styles.main}><p className={styles.muted}>This deck does not exist or was deleted.</p></main>
      </div>
    )
  }

  async function addCard(card) {
    const result = await deckRequest(`/api/decks/${id}/cards`, 'POST', { ...card, source: { kind: 'custom' } })
    if (result.duplicate) throw new Error('duplicate')
    setCards(cs => [result.card, ...cs])
    refresh()
  }

  async function saveEdit(card) {
    const { card: updated } = await deckRequest(`/api/cards/${editing.id}`, 'PATCH', card)
    setCards(cs => cs.map(c => c.id === updated.id ? updated : c))
    setEditing(null)
  }

  async function toggleSuspend(card) {
    const { card: updated } = await deckRequest(`/api/cards/${card.id}`, 'PATCH', { suspended: !card.suspended })
    setCards(cs => cs.map(c => c.id === updated.id ? updated : c))
    refresh()
  }

  async function confirmDelete() {
    if (confirm.kind === 'card') {
      await deckRequest(`/api/cards/${confirm.card.id}`, 'DELETE')
      setCards(cs => cs.filter(c => c.id !== confirm.card.id))
      setConfirm(null)
      refresh()
      return
    }
    await deckRequest(`/api/decks/${id}`, 'DELETE')
    await refresh()
    router.push('/decks')
  }

  const q = query.trim().toLowerCase()
  const shown = q ? cards.filter(c => `${c.bg} ${c.en} ${c.note}`.toLowerCase().includes(q)) : cards

  return (
    <div className={styles.page}>
      {header}
      {editing && (
        <Modal title="Edit card" onClose={() => setEditing(null)} size="sm">
          <CardForm initial={{ bg: editing.bg, en: editing.en, note: editing.note }} submitLabel="Save" onSubmit={saveEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {confirm && (
        <Modal role="alertdialog" size="sm" title={confirm.kind === 'deck' ? 'Delete this deck?' : 'Delete this card?'} onClose={() => setConfirm(null)}>
          <ModalText>
            {confirm.kind === 'deck'
              ? `"${deck.name}", its ${deck.total} cards and their review history will be removed for good.`
              : `"${confirm.card.bg}" and its review history will be removed for good.`}
          </ModalText>
          <ModalActions>
            <Button variant="secondary" onClick={() => setConfirm(null)} data-autofocus>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </ModalActions>
        </Modal>
      )}
      <main className={styles.main}>
        <DeckCounts deck={deck} />
        <ReviewCta count={deck.dueToday + deck.newToday} href={`/review?deck=${id}`} />
        {cards.length >= 4 && (
          <Button variant="secondary" href={`/study?list=deck:${id}`}>Practise without scheduling</Button>
        )}

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Add a card</h2>
          <CardForm submitLabel="Add card" onSubmit={addCard} />
        </section>

        <section className={styles.form} aria-labelledby="cards-title">
          <h2 id="cards-title" className={styles.groupTitle}>Cards</h2>
          {cards.length > 5 && (
            <input className={styles.input} type="search" value={query} placeholder="Search cards" aria-label="Search cards" onChange={e => setQuery(e.target.value)} />
          )}
          {cards.length === 0 && <p className={styles.muted}>No cards yet. Add one above or tap the plus next to any word on the site.</p>}
          <div className={styles.list}>
            {shown.map(card => (
              <CardRow
                key={card.id}
                card={card}
                now={now}
                onEdit={() => setEditing(card)}
                onToggleSuspend={() => toggleSuspend(card)}
                onDelete={() => setConfirm({ kind: 'card', card })}
              />
            ))}
          </div>
        </section>

        <DeckSettings deck={deck} onSaved={refresh} onDelete={() => setConfirm({ kind: 'deck' })} />
      </main>
    </div>
  )
}
