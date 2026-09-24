import styles from './About.module.css'

// Classification as given in Wikipedia's "Bulgarian language" article
const TREE = {
  name: 'Indo-European',
  children: [{
    name: 'Balto-Slavic',
    children: [
      { name: 'Baltic', note: 'Lithuanian, Latvian' },
      {
        name: 'Slavic',
        children: [
          { name: 'East Slavic', note: 'Russian, Ukrainian, Belarusian' },
          { name: 'West Slavic', note: 'Polish, Czech, Slovak' },
          {
            name: 'South Slavic',
            children: [
              { name: 'Western South Slavic', note: 'Serbo-Croatian, Slovene' },
              {
                name: 'Eastern South Slavic',
                children: [
                  { name: 'Bulgarian', highlight: true },
                  { name: 'Macedonian' },
                ],
              },
            ],
          },
        ],
      },
    ],
  }],
}

const onPath = node => node.highlight || node.children?.some(onPath)

function Node({ node }) {
  return (
    <li className={styles.node}>
      <span className={`${styles.nodeLabel} ${node.highlight ? styles.nodeHere : onPath(node) ? styles.nodePath : ''}`} lang={node.highlight ? 'en' : undefined}>
        {node.name}
        {node.note && <span className={styles.nodeNote}>{node.note}</span>}
      </span>
      {node.children && <ul className={styles.branch}>{node.children.map(c => <Node key={c.name} node={c} />)}</ul>}
    </li>
  )
}

export default function FamilyTree() {
  return (
    <ul className={styles.tree} aria-label="Language family tree of Bulgarian">
      <Node node={TREE} />
    </ul>
  )
}
