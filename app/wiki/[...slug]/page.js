import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WIKI_PAGES, wikiPage, wikiBody, wikiChildren, wikiTrail, shortTitle } from '../../../lib/wiki'
import PageHeader from '../../../components/ui/PageHeader'
import Markdown from '../../../components/ui/Markdown'
import WikiList from '../../../components/wiki/WikiList'
import VulgarGate from '../../../components/wiki/VulgarGate'
import WikiTree from '../../../components/library/WikiTree'
import layout from '../../../components/library/Library.module.css'
import styles from '../../../components/wiki/Wiki.module.css'

export const dynamicParams = false

export function generateStaticParams() {
  return WIKI_PAGES.map(p => ({ slug: p.slug.split('/') }))
}

function describe(page, body) {
  const text = body.replace(/[#>*=`|\[\]()!_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 40 ? `${text.slice(0, 155).replace(/\s\S*$/, '')}...` : `${page.title}: Bulgarian notes from the Learn Bulgarian wiki.`
}

export function generateMetadata({ params }) {
  const slug = params.slug.join('/')
  const page = wikiPage(slug)
  if (!page) return {}
  return {
    title: page.title,
    description: describe(page, wikiBody(slug)),
    alternates: { canonical: `/wiki/${slug}` },
    ...(page.warning ? { robots: { index: false, follow: true } } : {}),
  }
}

export default function WikiPage({ params }) {
  const slug = params.slug.join('/')
  const page = wikiPage(slug)
  if (!page) notFound()

  const trail = wikiTrail(slug)
  const parent = trail[trail.length - 1]
  const children = wikiChildren(slug)
  const body = wikiBody(slug).trim()
  const content = (
    <>
      {body && <Markdown text={body} wordRows />}
      {children.length > 0 && (
        <section className={styles.section} aria-labelledby="subpages">
          <h2 id="subpages" className={styles.sectionTitle}>In this section</h2>
          <WikiList pages={children} />
        </section>
      )}
    </>
  )

  return (
    <div className={styles.page}>
      <PageHeader
        backHref={parent ? `/wiki/${parent.slug}` : '/library'}
        backLabel={parent ? shortTitle(parent.title) : 'Library'}
        title={shortTitle(page.title)}
      />
      <div className={layout.layout}>
        <main className={`${layout.primary} ${styles.article}`}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/library">Library</Link>
            {trail.map(p => <span key={p.slug}>/ <Link href={`/wiki/${p.slug}`}>{shortTitle(p.title)}</Link></span>)}
          </nav>
          <h1 className={styles.title}>{page.title}</h1>
          {page.warning ? <VulgarGate>{content}</VulgarGate> : content}
        </main>
        <aside className={layout.aside}>
          <WikiTree current={slug} />
        </aside>
      </div>
    </div>
  )
}
