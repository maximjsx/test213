'use client'
import { ASPECT_PAIRS, ASPECT_DRILL } from '../../lib/aspect'
import { speakBulgarian, unlockAudio } from '../../lib/audio'
import AddToDeckButton from '../decks/AddToDeckButton'
import Button from '../ui/Button'
import PageHeader from '../ui/PageHeader'
import hub from '../Hub.module.css'
import styles from './AspectIntro.module.css'

const DRILL_SIZE = ASPECT_DRILL.context + ASPECT_DRILL.pairs

function Example({ bg, en }) {
  return (
    <li className={styles.example}>
      <button className={styles.speak} onClick={() => { unlockAudio(); speakBulgarian(bg) }} aria-label={`Listen: ${bg}`}>
        <img src="/icons/speaker.png" alt="" width={16} height={16} />
      </button>
      <span>
        <span className={styles.exampleBg} lang="bg">{bg}</span>
        <span className={styles.exampleEn}>{en}</span>
      </span>
    </li>
  )
}

export default function AspectIntro() {
  return (
    <div className={hub.page}>
      <PageHeader backHref="/practice" backLabel="Practice" title="Verb aspect" />
      <main className={`${hub.single} ${styles.intro}`}>
        <section className={styles.card}>
          <h2 className={styles.title}>Two verbs for one action</h2>
          <p className={styles.text}>
            Most Bulgarian verbs come in pairs. The <b className={styles.ipf}>imperfective</b> is for actions that repeat,
            are habits or are still going on. The <b className={styles.pf}>perfective</b> is for one complete action with a result.
          </p>
          <p className={styles.text}>
            In the present tense a perfective verb cannot stand on its own. It comes after <b lang="bg">да</b> or <b lang="bg">ще</b>.
          </p>
          <ul className={styles.examples}>
            <Example bg="Всеки ден купувам хляб." en="Every day I buy bread." />
            <Example bg="Искам да купя хляб." en="I want to buy bread." />
            <Example bg="Ще купя хляб." en="I'll buy bread." />
          </ul>
          <Button size="lg" block href="/practice/aspect/drill">Practise, {DRILL_SIZE} questions</Button>
        </section>
  
        <section className={styles.card} aria-labelledby="pairs-title">
          <h2 id="pairs-title" className={styles.title}>{ASPECT_PAIRS.length} everyday pairs</h2>
          <div className={styles.tableHead} aria-hidden="true">
            <span className={styles.ipf}>Imperfective</span>
            <span className={styles.pf}>Perfective</span>
          </div>
          <ul className={styles.pairs}>
            {ASPECT_PAIRS.map(p => (
              <li key={p.ipf} className={styles.pair}>
                <button className={styles.pairWords} onClick={() => { unlockAudio(); speakBulgarian(`${p.ipf}, ${p.pf}`) }} aria-label={`Listen: ${p.ipf}, ${p.pf}`}>
                  <span className={styles.pairIpf} lang="bg">{p.ipf}</span>
                  <span className={styles.pairPf} lang="bg">{p.pf}</span>
                  <span className={styles.pairEn}>{p.en}</span>
                </button>
                <AddToDeckButton size="sm" word={{ bg: `${p.ipf} / ${p.pf}`, en: p.en, note: 'imperfective / perfective', source: { kind: 'custom', ref: 'aspect' } }} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
