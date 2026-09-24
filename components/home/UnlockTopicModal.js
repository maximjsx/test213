'use client'
import { useState } from 'react'
import Modal, { ModalText, ModalActions } from '../ui/Modal'
import Button from '../ui/Button'
import CoinIcon from '../ui/CoinIcon'
import DiscordIcon from '../ui/DiscordIcon'
import TopicArt from '../TopicArt'

function GuildStep({ guild, user, onCheck, onClose }) {
  const [checking, setChecking] = useState(false)
  const [stillOut, setStillOut] = useState(false)

  async function check() {
    setChecking(true)
    const joined = await onCheck()
    setChecking(false)
    setStillOut(!joined)
  }

  if (!user) {
    return (
      <>
        <ModalText>This topic is for members of the <strong>{guild.name}</strong> Discord server. Sign in with Discord so we can check.</ModalText>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>Not now</Button>
          <Button href="/api/auth/login"><DiscordIcon size={18} /> Sign in</Button>
        </ModalActions>
      </>
    )
  }

  return (
    <>
      <ModalText>This topic is for members of the <strong>{guild.name}</strong> Discord server.</ModalText>
      {stillOut && <ModalText>We still don&apos;t see you in {guild.name}. Joining can take a moment to show up.</ModalText>}
      <ModalActions>
        <Button variant="secondary" onClick={check} disabled={checking}>
          {checking ? 'Checking' : 'I joined, check again'}
        </Button>
        {guild.invite && (
          <Button href={guild.invite} target="_blank" rel="noopener noreferrer">
            <DiscordIcon size={18} /> Join server
          </Button>
        )}
      </ModalActions>
    </>
  )
}

function CoinStep({ level, coins, onUnlock, onClose }) {
  const price = level.special.price
  const missing = price - coins
  return (
    <>
      <ModalText>
        Unlock it for <CoinIcon size={16} /> <strong>{price}</strong> coins. It stays unlocked for good.
      </ModalText>
      <ModalText>
        {missing > 0
          ? <>You have {coins} coins. Earn {missing} more to unlock it.</>
          : <>You have {coins} coins, {coins - price} left after unlocking.</>}
      </ModalText>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Not now</Button>
        <Button color={level.color} disabled={missing > 0} onClick={() => { onUnlock(level); onClose() }}>
          Unlock
        </Button>
      </ModalActions>
    </>
  )
}

export default function UnlockTopicModal({ level, lock, coins, user, onUnlock, onCheckGuild, onClose }) {
  return (
    <Modal
      title={level.title}
      icon={<TopicArt level={level} size={64} />}
      accent={level.color}
      role="alertdialog"
      onClose={onClose}
    >
      {level.subtitle && <ModalText>{level.subtitle}</ModalText>}
      {lock.needsGuild
        ? <GuildStep guild={level.special.guild} user={user} onCheck={onCheckGuild} onClose={onClose} />
        : <CoinStep level={level} coins={coins} onUnlock={onUnlock} onClose={onClose} />}
    </Modal>
  )
}
