'use client'
import BuilderGate from '../../../components/builder/BuilderGate'
import AdminFilesPanel from '../../../components/builder/AdminFilesPanel'
import PageHeader from '../../../components/ui/PageHeader'
import styles from '../Admin.module.css'

export default function AdminFiles() {
  return (
    <BuilderGate>
      <div className={styles.page}>
        <PageHeader backHref="/admin" backLabel="Admin" title="Files" />
        <main className={styles.content}>
          <AdminFilesPanel />
        </main>
      </div>
    </BuilderGate>
  )
}
