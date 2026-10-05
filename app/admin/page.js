'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import BuilderGate, { useBuilderAccess } from '../../components/builder/BuilderGate'
import AdminUsersPanel from '../../components/builder/AdminUsersPanel'
import PageHeader from '../../components/ui/PageHeader'
import Skeleton from '../../components/ui/Skeleton'
import styles from './Admin.module.css'

function FolderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2.2h8.4A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" fill="var(--orange-bg)" />
    </svg>
  )
}

const TOOLS = [
  { href: '/builder', icon: <img src="/icons/open_book.png" alt="" width={40} height={40} />, title: 'Topic builder', text: 'Write and publish topics, lessons and exercises.', accent: 'var(--green)' },
  { href: '/voice', icon: <img src="/icons/microphone.png" alt="" width={40} height={40} />, title: 'Voice studio', text: 'Record, review, and share recording links with natives.', accent: 'var(--blue)' },
  { href: '/admin/files', icon: <FolderIcon />, title: 'Files', text: 'Every uploaded image and recording, grouped by topic.', accent: 'var(--orange)', adminOnly: true },
]

const fmtDay = day => new Date(day + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const fmtWhen = s => new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

function Stat({ label, value, note, accent }) {
  return (
    <div className={styles.stat} style={accent ? { '--stat-accent': accent } : undefined}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value.toLocaleString()}</span>
      {note && <span className={styles.statNote}>{note}</span>}
    </div>
  )
}

function SignupChart({ chart }) {
  const max = Math.max(1, ...chart.map(d => d.count))
  const total = chart.reduce((n, d) => n + d.count, 0)
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Sign-ups</h2>
        <span className={styles.panelNote}>{total} in the last 30 days</span>
      </div>
      <div className={styles.chart}>
        {chart.map(d => (
          <div key={d.day} className={styles.barSlot} title={`${fmtDay(d.day)}: ${d.count}`}>
            {d.count > 0 && <span className={styles.barCount}>{d.count}</span>}
            <div className={styles.bar} style={{ height: `${(d.count / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className={styles.chartAxis}>
        <span>{fmtDay(chart[0].day)}</span>
        <span>Today</span>
      </div>
    </section>
  )
}

function RecentUsers({ users }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Newest learners</h2>
      </div>
      <ul className={styles.userList}>
        {users.map(u => (
          <li key={u.username}>
            <Link href={`/u/${u.username}`} className={styles.userRow}>
              {u.avatarUrl
                ? <img src={u.avatarUrl} alt="" width={36} height={36} className={styles.avatar} />
                : <span className={styles.avatar} />}
              <span className={styles.userText}>
                <b>{u.username}</b>
                <span>{fmtWhen(u.createdAt)}</span>
              </span>
              <span className={styles.userLessons}>{u.lessons} {u.lessons === 1 ? 'lesson' : 'lessons'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function StatsSkeleton() {
  return (
    <>
      <div className={styles.stats}>
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={104} radius="var(--r-lg)" />)}
      </div>
      <div className={styles.columns}>
        <Skeleton height={240} radius="var(--r-lg)" />
        <Skeleton height={240} radius="var(--r-lg)" />
      </div>
    </>
  )
}

function Stats() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/admin/stats', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setError(true))
  }, [])

  if (error) return <p className={styles.error}>Could not load the stats. Refresh to try again.</p>
  if (!stats) return <StatsSkeleton />

  const { users, active, voice } = stats
  const coverage = voice.phrases ? Math.round((voice.approved / voice.phrases) * 100) : 0
  return (
    <>
      <div className={styles.stats}>
        <Stat label="Learners" value={users.total} note={`+${users.week} this week`} accent="var(--blue)" />
        <Stat label="New today" value={users.day} note={`${users.month} this month`} accent="var(--green)" />
        <Stat label="Active today" value={active.day} note="saved progress in 24h" accent="var(--orange)" />
        <Stat label="Active this week" value={active.week} note={`${users.total ? Math.round((active.week / users.total) * 100) : 0}% of learners`} accent="var(--yellow)" />
        <Stat label="Lessons finished" value={stats.lessons} note="across all accounts" accent="var(--teal)" />
        <Stat label="Recordings" value={voice.approved} note={`${coverage}% of ${voice.phrases} phrases, ${voice.pending} to review`} accent="var(--red)" />
      </div>
      <div className={styles.columns}>
        <SignupChart chart={stats.chart} />
        <RecentUsers users={stats.recent} />
      </div>
    </>
  )
}

function Dashboard() {
  const { isAdmin } = useBuilderAccess()
  return (
    <div className={styles.page}>
      <PageHeader backHref="/profile" backLabel="Profile" title="Admin" />
      <main className={styles.content}>
        <div className={styles.tools}>
          {TOOLS.filter(t => isAdmin || !t.adminOnly).map(t => (
            <Link key={t.href} href={t.href} className={styles.tool} style={{ '--tool-accent': t.accent }}>
              <span className={styles.toolIcon}>{t.icon}</span>
              <span className={styles.toolText}>
                <b>{t.title}</b>
                <span>{t.text}</span>
              </span>
            </Link>
          ))}
        </div>
        {isAdmin && <Stats />}
        <AdminUsersPanel />
      </main>
    </div>
  )
}

export default function AdminPage() {
  return <BuilderGate><Dashboard /></BuilderGate>
}
