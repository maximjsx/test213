'use client'
import styles from './LevelEditor.module.css'

function without(obj, key) {
  const { [key]: _, ...rest } = obj
  return rest
}

// Special topics show locked on the home path. They can cost coins, need
// membership of a Discord server, or both.
export default function SpecialTopicFields({ special, onChange }) {
  const setGuild = patch => onChange({ ...special, guild: { ...(special.guild || {}), ...patch } })

  if (!special) {
    return (
      <label className={styles.checkLabel}>
        <input type="checkbox" checked={false} onChange={() => onChange({ price: 150 })} />
        Make this a special topic
      </label>
    )
  }

  return (
    <div className={styles.specialFields}>
      <label className={styles.checkLabel}>
        <input type="checkbox" checked onChange={() => onChange(undefined)} />
        Special topic
      </label>

      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          checked={special.price !== undefined}
          onChange={e => onChange(e.target.checked ? { ...special, price: 150 } : without(special, 'price'))}
        />
        Costs coins
      </label>
      {special.price !== undefined && (
        <input
          className={styles.input}
          type="number"
          min={1}
          style={{ width: 110 }}
          value={special.price}
          aria-label="Price in coins"
          onChange={e => onChange({ ...special, price: parseInt(e.target.value) || 0 })}
        />
      )}

      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          checked={!!special.guild}
          onChange={e => onChange(e.target.checked ? { ...special, guild: { id: '', name: '', invite: '' } } : without(special, 'guild'))}
        />
        Only for members of a Discord server
      </label>
      {special.guild && (
        <div className={styles.guildFields}>
          <input className={styles.input} value={special.guild.id} placeholder="Server id (17-20 digits)" inputMode="numeric" onChange={e => setGuild({ id: e.target.value.trim() })} />
          <input className={styles.input} value={special.guild.name} placeholder="Server name" onChange={e => setGuild({ name: e.target.value })} />
          <input className={styles.input} value={special.guild.invite} placeholder="https://discord.gg/..." onChange={e => setGuild({ invite: e.target.value.trim() })} />
        </div>
      )}
    </div>
  )
}
