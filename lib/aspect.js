// Verb aspect drill: pick the imperfective or perfective form for a sentence,
// and recall the partner of a pair. Content lives in data/aspect-pairs.json.
import PAIRS from '../data/aspect-pairs.json'
import { shuffle } from './checker'

export { PAIRS as ASPECT_PAIRS }

export const ASPECT_DRILL = { context: 8, pairs: 4 }

function contextExercise(pair, perfective, i) {
  const { bg, en } = perfective ? pair.pfSentence : pair.ipfSentence
  const why = perfective
    ? `One complete action, after да or ще: perfective ${pair.pf}.`
    : `Repeated, habitual or ongoing: imperfective ${pair.ipf}.`
  return {
    id: `aspect-context-${i}`,
    type: 'multiple_choice',
    question: bg,
    choices: [pair.ipf, pair.pf],
    answer: perfective ? pair.pf : pair.ipf,
    usage: `${en} ${why}`,
  }
}

function pairExercise(pair, askPerfective, i) {
  return {
    id: `aspect-pair-${i}`,
    type: 'fill_blank',
    sentence: askPerfective ? `${pair.ipf} / ___ (${pair.en})` : `___ / ${pair.pf} (${pair.en})`,
    answer: askPerfective ? pair.pf : pair.ipf,
    usage: `Imperfective ${pair.ipf}, perfective ${pair.pf}: ${pair.en}.`,
  }
}

export function buildAspectDrill() {
  const picked = shuffle(PAIRS)
  const context = picked.slice(0, ASPECT_DRILL.context).map((p, i) => contextExercise(p, Math.random() < 0.5, i))
  const pairs = picked.slice(ASPECT_DRILL.context, ASPECT_DRILL.context + ASPECT_DRILL.pairs)
    .map((p, i) => pairExercise(p, i % 2 === 0, i))
  return shuffle([...context, ...pairs])
}
