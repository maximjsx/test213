import styles from './Markdown.module.css'

// The small Markdown subset used by topic notes: ## and ### headings, tables,
// - and 1. lists, > callouts, paragraphs, **bold**, *italic* and `code`.
// The builder preview renders through this too, so it always matches the site.
export default function Markdown({ text, className = '' }) {
  return <div className={`${styles.md} ${className}`}>{parseBlocks(text || '')}</div>
}

const BLOCKS = [
  { test: l => l.startsWith('### '), render: (lines, k) => <h3 key={k} className={styles.h3}>{inline(lines[0].slice(4))}</h3>, single: true },
  { test: l => l.startsWith('## '), render: (lines, k) => <h2 key={k} className={styles.h2}>{inline(lines[0].slice(3))}</h2>, single: true },
  { test: l => l.startsWith('|'), render: renderTable },
  { test: l => l.startsWith('- '), render: (lines, k) => <ul key={k} className={styles.list}>{lines.map((t, j) => <li key={j}>{inline(t.slice(2))}</li>)}</ul> },
  { test: l => /^\d+\. /.test(l), render: (lines, k) => <ol key={k} className={styles.list}>{lines.map((t, j) => <li key={j}>{inline(t.replace(/^\d+\. /, ''))}</li>)}</ol> },
  { test: l => l.startsWith('>'), render: (lines, k) => <aside key={k} className={styles.callout}>{inline(lines.map(t => t.replace(/^>\s?/, '')).join(' '))}</aside> },
]

function parseBlocks(text) {
  const lines = text.trim().split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    const block = BLOCKS.find(b => b.test(line))
    if (!block) {
      out.push(<p key={i} className={styles.p}>{inline(line)}</p>)
      i++
      continue
    }
    const start = i++
    while (!block.single && i < lines.length && block.test(lines[i])) i++
    out.push(block.render(lines.slice(start, i), start))
  }
  return out
}

function renderTable(rows, key) {
  const cells = row => row.split('|').map(c => c.trim()).filter(Boolean)
  const [head, , ...body] = rows
  return (
    <div key={key} className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr>{cells(head).map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
        <tbody>{body.map((r, ri) => <tr key={ri}>{cells(r).map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className={styles.code}>{part.slice(1, -1)}</code>
    return part
  })
}
