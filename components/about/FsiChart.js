import styles from './About.module.css'

// US Foreign Service Institute estimates for an English speaker to reach
// professional working proficiency (ILR 3/3). Source: U.S. Department of State.
const CATEGORIES = [
  { id: 'I', weeks: [24, 30], hours: '600 to 750 hours', examples: 'Spanish, French, Italian, Dutch, Swedish' },
  { id: 'II', weeks: [36, 36], hours: 'about 900 hours', examples: 'German, Indonesian, Malay, Swahili' },
  { id: 'III', weeks: [44, 44], hours: 'about 1100 hours', examples: 'Bulgarian, Russian, Polish, Greek, Macedonian', highlight: true },
  { id: 'IV', weeks: [88, 88], hours: '2200 hours', examples: 'Arabic, Mandarin, Cantonese, Japanese, Korean' },
]

const W = 340
const LABEL_H = 34
const BAR_H = 22
const ROW_H = LABEL_H + BAR_H + 22
const MAX_WEEKS = 88
const x = weeks => (weeks / MAX_WEEKS) * (W - 60)

export default function FsiChart() {
  return (
    <figure className={styles.chart}>
      <svg viewBox={`0 0 ${W} ${CATEGORIES.length * ROW_H}`} role="img" aria-labelledby="fsi-title fsi-desc">
        <title id="fsi-title">Weeks of study by FSI language category</title>
        <desc id="fsi-desc">
          {CATEGORIES.map(c => `Category ${c.id}: ${c.weeks[0] === c.weeks[1] ? c.weeks[0] : `${c.weeks[0]} to ${c.weeks[1]}`} weeks, ${c.hours}. ${c.examples}.`).join(' ')}
        </desc>
        {CATEGORIES.map((c, i) => {
          const y = i * ROW_H
          const range = c.weeks[0] !== c.weeks[1]
          const label = range ? `${c.weeks[0]} to ${c.weeks[1]} weeks` : `${c.weeks[0]} weeks`
          return (
            <g key={c.id} className={c.highlight ? styles.barOn : styles.bar}>
              <title>{`Category ${c.id}: ${label}, ${c.hours}. ${c.examples}`}</title>
              <text x="0" y={y + 14} className={styles.barLabel}>Category {c.id}{c.highlight ? ', Bulgarian' : ''}</text>
              <text x="0" y={y + 30} className={styles.barSub}>{c.examples}</text>
              <rect x="0" y={y + LABEL_H} width={x(c.weeks[0])} height={BAR_H} rx="4" className={styles.barFill} />
              {range && (
                <rect x={x(c.weeks[0]) + 2} y={y + LABEL_H} width={x(c.weeks[1]) - x(c.weeks[0]) - 2} height={BAR_H} rx="4" className={styles.barRange} />
              )}
              <text x={x(c.weeks[1]) + 8} y={y + LABEL_H + 16} className={styles.barValue}>{label}</text>
            </g>
          )
        })}
      </svg>
      <figcaption className={styles.caption}>
        Full-time classroom weeks for English speakers to reach professional working proficiency, as estimated by the
        US Foreign Service Institute.
      </figcaption>
    </figure>
  )
}
