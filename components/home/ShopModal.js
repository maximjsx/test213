'use client'
import Modal, { ModalText } from '../ui/Modal'
import Button from '../ui/Button'
import styles from './ShopModal.module.css'

export default function ShopModal({ state, freezeCost, onBuyFreeze, onClose }) {
  const canAfford = state.xp >= freezeCost
  return (
    <Modal
      title="Shop"
      icon={<img src="/icons/gift_box.png" alt="" width={52} height={52} />}
      onClose={onClose}
    >
      <ModalText>
        <img src="/icons/lightning.png" alt="" width={16} height={16} className={styles.inlineIcon} />
        {state.xp} XP available
      </ModalText>
      <div className={styles.item}>
        <img src="/icons/shield.png" alt="" width={32} height={32} />
        <div className={styles.info}>
          <div className={styles.name}>Streak Freeze</div>
          <div className={styles.meta}>Covers one missed day. {freezeCost} XP, you have {state.streakFreezes || 0}.</div>
        </div>
        <Button size="sm" onClick={onBuyFreeze} disabled={!canAfford}>
          {canAfford ? 'Buy' : 'Need XP'}
        </Button>
      </div>
    </Modal>
  )
}
