'use client'
import Modal, { ModalText } from '../ui/Modal'
import Button from '../ui/Button'
import CoinIcon from '../ui/CoinIcon'
import styles from './ShopModal.module.css'

export default function ShopModal({ state, freezeCost, onBuyFreeze, onClose }) {
  const canAfford = state.coins >= freezeCost
  return (
    <Modal
      title="Shop"
      icon={<img src="/icons/gift_box.png" alt="" width={52} height={52} />}
      onClose={onClose}
    >
      <ModalText>
        <CoinIcon size={16} className={styles.inlineIcon} />
        {state.coins} coins available
      </ModalText>
      <div className={styles.item}>
        <img src="/icons/shield.png" alt="" width={32} height={32} />
        <div className={styles.info}>
          <div className={styles.name}>Streak Freeze</div>
          <div className={styles.meta}>Covers one missed day. {freezeCost} coins, you have {state.streakFreezes || 0}.</div>
        </div>
        <Button size="sm" onClick={onBuyFreeze} disabled={!canAfford}>
          {canAfford ? 'Buy' : 'Need coins'}
        </Button>
      </div>
    </Modal>
  )
}
