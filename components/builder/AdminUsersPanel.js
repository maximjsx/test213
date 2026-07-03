'use client'
import { useEffect, useState } from 'react'
import styles from './BuilderGate.module.css'

// Super-admin only: manage which Discord IDs can access the Level Builder.
// Renders nothing for non-admins.
export default function AdminUsersPanel() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState([])
  const [newId, setNewId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/builder/access')
      .then(r => r.json())
      .then(d => { setIsAdmin(!!d.isAdmin); setUsers(d.users || []) })
      .catch(() => {})
  }, [])

  async function addUser() {
    const id = newId.trim()
    if (!id) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/builder/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: id }),
      })
      const d = await res.json()
      if (!res.ok) { setError(errText(d.error)); return }
      setUsers(d.users || [])
      setNewId('')
    } catch { setError('Something went wrong') }
    finally { setBusy(false) }
  }

  async function removeUser(id) {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/builder/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: id }),
      })
      const d = await res.json()
      if (!res.ok) { setError(errText(d.error)); return }
      setUsers(d.users || [])
    } catch { setError('Something went wrong') }
    finally { setBusy(false) }
  }

  if (!isAdmin) return null

  return (
    <div className={styles.admin}>
      <div className={styles.adminHead}>
        Builder access <span className={styles.adminBadge}>ADMIN</span>
      </div>
      {error && <div className={styles.err}>{error}</div>}
      <div className={styles.addRow}>
        <input
          className={styles.addInput}
          value={newId}
          onChange={e => setNewId(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && addUser()}
          placeholder="Discord user ID to grant access"
          inputMode="numeric"
        />
        <button className={styles.addBtn} onClick={addUser} disabled={busy || !newId.trim()}>Add user</button>
      </div>
      <div className={styles.userList}>
        {users.length === 0 ? (
          <div className={styles.empty}>No extra users yet. Add a Discord ID to grant builder access.</div>
        ) : users.map(u => (
          <div key={u.discordId} className={styles.userRow}>
            <span className={styles.userName}>{u.discordName || u.username || 'Unknown user'}</span>
            <span className={styles.userId}>{u.discordId}</span>
            <span className={styles.spacer} />
            <button className={styles.removeBtn} onClick={() => removeUser(u.discordId)} disabled={busy}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function errText(code) {
  switch (code) {
    case 'invalid_id': return 'That does not look like a valid Discord ID.'
    case 'already_admin': return 'That ID is the admin already.'
    case 'cannot_remove_admin': return 'The admin cannot be removed.'
    case 'forbidden': return 'Only the admin can manage access.'
    default: return 'Something went wrong.'
  }
}
