import AddToDeckButton from '../decks/AddToDeckButton'
import styles from './Markdown.module.css'

// The Markdown subset used by topic notes and the wiki: ## and ### headings,
// tables, - / * / 1. lists (one level of nesting), > callouts, --- rules,
// ``` code blocks, image and audio lines, paragraphs, and inline **bold**,
// *italic*, `code`, ==highlight==, [links](url) and <https://autolinks>.
// The builder preview renders through this too, so it always matches the site.
//
// wordRows: tables with a Bulgarian and an English column get an
// add-to-deck button on every row.
export default function Markdown({ text, className = '', wordRows = false }) {
  return <div className={`${styles.md} ${className}`}>{parseBlocks(text || '', { wordRows })}</div>
}

const isBullet = l => /^\s*[-*] /.test(l)
const isOrdered = l => /^\s*\d+\. /.test(l)
const MEDIA_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/

const BLOCKS = [
  { test: l => l.startsWith('### '), single: true, render: (lines, k) => <h3 key={k} className={styles.h3}>{inline(lines[0].slice(4))}</h3> },
  { test: l => l.startsWith('## '), single: true, render: (lines, k) => <h2 key={k} className={styles.h2}>{inline(lines[0].slice(3))}</h2> },
  { test: l => /^(-{3,}|\*{3,})$/.test(l.trim()), single: true, render: (_, k) => <hr key={k} className={styles.hr} /> },
  { test: l => MEDIA_LINE.test(l.trim()), single: true, render: (lines, k) => media(lines[0].trim(), k) },
  { test: l => l.startsWith('|'), render: renderTable },
  { test: isBullet, render: (lines, k) => renderList(lines, k, 'ul') },
  { test: isOrdered, render: (lines, k) => renderList(lines, k, 'ol') },
  { test: l => l.startsWith('>'), render: (lines, k) => <aside key={k} className={styles.callout}>{inline(lines.map(t => t.replace(/^>\s?/, '')).join(' '))}</aside> },
]

function parseBlocks(text, options) {
  const lines = text.trim().split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    if (line.trim().startsWith('```')) {
      const start = i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) i++
      out.push(<pre key={start} className={styles.pre}><code>{lines.slice(start + 1, i).join('\n')}</code></pre>)
      i++
      continue
    }

    const block = BLOCKS.find(b => b.test(line))
    if (!block) {
      out.push(<p key={i} className={styles.p}>{inline(line.trim())}</p>)
      i++
      continue
    }
    const start = i++
    // Lists keep going through indented sub-items
    const isList = block.test === isBullet || block.test === isOrdered
    const continues = l => block.test(l) || (isList && /^\s{2,}\S/.test(l))
    while (!block.single && i < lines.length && continues(lines[i])) i++
    out.push(block.render(lines.slice(start, i), start, options))
  }
  return out
}

function media(line, key) {
  const [, alt, src] = line.match(MEDIA_LINE)
  if (/\.(mp3|ogg|wav|m4a)$/i.test(src)) {
    return (
      <figure key={key} className={styles.figure}>
        <audio controls preload="none" src={src} className={styles.audio} />
        {alt && <figcaption className={styles.caption}>{alt}</figcaption>}
      </figure>
    )
  }
  return (
    <figure key={key} className={styles.figure}>
      <img src={src} alt={alt} loading="lazy" className={styles.image} />
      {alt && <figcaption className={styles.caption}>{inline(alt)}</figcaption>}
    </figure>
  )
}

function renderList(lines, key, Tag) {
  const items = []
  for (const line of lines) {
    const text = line.replace(/^\s*(?:[-*]|\d+\.) /, '')
    if (/^\s{2,}/.test(line) && items.length) items[items.length - 1].children.push(text)
    else items.push({ text, children: [] })
  }
  return (
    <Tag key={key} className={styles.list}>
      {items.map((item, j) => (
        <li key={j}>
          {inline(item.text)}
          {item.children.length > 0 && (
            <ul className={styles.list}>{item.children.map((c, n) => <li key={n}>{inline(c)}</li>)}</ul>
          )}
        </li>
      ))}
    </Tag>
  )
}

const plain = s => s.replace(/\*\*|==|`/g, '').trim()
const cellsOf = row => row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

function wordColumns(header) {
  const bg = header.findIndex(h => /^(bulgarian|български)/i.test(plain(h)))
  const en = header.findIndex(h => /^(english|английски)/i.test(plain(h)))
  return bg !== -1 && en !== -1 ? { bg, en } : null
}

function renderTable(rows, key, { wordRows } = {}) {
  const [head, , ...body] = rows
  const header = cellsOf(head)
  const words = wordRows ? wordColumns(header) : null
  return (
    <div key={key} className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {header.map((c, j) => <th key={j}>{inline(c)}</th>)}
            {words && <th><span className="sr-only">Add to deck</span></th>}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => {
            const cells = cellsOf(r)
            const bg = words && plain(cells[words.bg] || '')
            return (
              <tr key={ri}>
                {cells.map((c, j) => <td key={j} lang={words?.bg === j ? 'bg' : undefined}>{inline(c)}</td>)}
                {words && (
                  <td className={styles.addCell}>
                    {bg && <AddToDeckButton size="sm" word={{ bg, en: plain(cells[words.en] || ''), source: { kind: 'wiki' } }} />}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const INLINE = /(\*\*[^*]+?\*\*|==[^=]+?==|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|<https?:\/\/[^>\s]+>|\*[^*\s][^*]*?\*)/

function link(href, children, key) {
  const external = /^https?:\/\//.test(href)
  return (
    <a key={key} href={href} className={styles.link} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}

function inline(text) {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{inline(part.slice(2, -2))}</strong>
    if (part.startsWith('==') && part.endsWith('==') && part.length > 4) return <mark key={i} className={styles.mark}>{inline(part.slice(2, -2))}</mark>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className={styles.code}>{part.slice(1, -1)}</code>
    const md = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
    if (md) return link(md[2], inline(md[1]), i)
    const auto = part.match(/^<(https?:\/\/[^>\s]+)>$/)
    if (auto) return link(auto[1], auto[1].replace(/^https?:\/\/(www\.)?/, ''), i)
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{inline(part.slice(1, -1))}</em>
    return part
  })
}
