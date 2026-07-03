'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTTSMuted, setTTSMuted } from '../../../lib/audio'
import { BG_VOICES, DEFAULT_VOICE } from '../../../lib/voices'
import { AudioField, ImageField } from '../../../components/builder/MediaControls'
import BuilderGate from '../../../components/builder/BuilderGate'
import Link from 'next/link'
import styles from './page.module.css'

const uid = () => Math.random().toString(36).slice(2, 9)

// ── storage ───────────────────────────────────────────────────────────────────
function loadLevels() {
  try { return JSON.parse(localStorage.getItem('builder_levels') || '[]') } catch { return [] }
}
function saveLevels(levels) {
  try { localStorage.setItem('builder_levels', JSON.stringify(levels)) } catch {}
}

// Unicode-safe, URL-safe base64 encode/decode
function encodeLevel(level) {
  try {
    const json = JSON.stringify(level)
    const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch { return null }
}

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const ta = Object.assign(document.createElement('textarea'), { value: text, style: 'position:fixed;opacity:0' })
  document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
  return Promise.resolve()
}

// ── exercise metadata ─────────────────────────────────────────────────────────
const EXERCISE_TYPES = [
  { type: 'introduce',        label: 'Introduce',          icon: '📖', desc: 'Show a new word or phrase with translation' },
  { type: 'multiple_choice',  label: 'Multiple Choice',    icon: '🔘', desc: 'Pick the correct answer from options' },
  { type: 'word_bank',        label: 'Word Bank',          icon: '🧩', desc: 'Tap words to arrange a sentence' },
  { type: 'translate_to_en',  label: 'Translate to English', icon: '🇬🇧', desc: 'Type the English meaning' },
  { type: 'translate_to_bg',  label: 'Translate to Bulgarian', icon: '🇧🇬', desc: 'Type the Bulgarian translation' },
  { type: 'fill_blank',       label: 'Fill in the Blank',  icon: '✏️', desc: 'Complete the missing word in a sentence' },
  { type: 'listen_and_type',  label: 'Listen & Type',      icon: '🎧', desc: 'Hear the audio and type what you hear' },
  { type: 'speak_sentence',   label: 'Speak Sentence',     icon: '🎤', desc: 'Say the sentence aloud (speech recognition)' },
  { type: 'match_pairs',      label: 'Match Pairs',        icon: '🔗', desc: 'Connect each word to its translation' },
  { type: 'listen_translate', label: 'Listen & Translate', icon: '👂', desc: 'Hear audio and type the English meaning' },
  { type: 'select_word',     label: 'Select the Word',   icon: '🎯', desc: 'Tap the correct word to fill the blank in a sentence' },
  { type: 'dialog',          label: 'Dialog',             icon: '💬', desc: 'Watch a conversation play out, then answer a question about it' },
  { type: 'image_select',    label: 'Pick the Image',     icon: '🖼️', desc: 'Hear a Bulgarian word, tap the matching picture' },
  { type: 'image_match',     label: 'Match Images',       icon: '🧩', desc: 'Connect each picture to its Bulgarian word' },
  { type: 'image_name',      label: 'Name the Picture',   icon: '📷', desc: 'Show a picture, learner types the Bulgarian word' },
  { type: 'image_mc',        label: 'Image Multiple Choice', icon: '🏞️', desc: 'Show a picture, pick the correct Bulgarian word' },
]

function defaultExercise(type) {
  const id = 'ex_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
  switch (type) {
    case 'introduce':        return { type, id, label: 'NEW WORD', display: '', sublabel: '', translation: '', tts: '' }
    case 'multiple_choice':  return { type, id, question: '', choices: ['', '', ''], answer: '', tts: '' }
    case 'word_bank':        return { type, id, direction: 'to_bg', prompt: '', tts: '', words: ['', '', '', ''], answer: '' }
    case 'translate_to_en':  return { type, id, prompt: '', answers: [''], hint: '', tts: '' }
    case 'translate_to_bg':  return { type, id, prompt: '', answers: [''] }
    case 'fill_blank':       return { type, id, sentence: '', answer: '', hint: '' }
    case 'listen_and_type':  return { type, id, tts: '', answer: '' }
    case 'speak_sentence':   return { type, id, tts: '' }
    case 'match_pairs':      return { type, id, instruction: 'Match each pair:', pairs: [{ left: '', right: '' }, { left: '', right: '' }] }
    case 'listen_translate': return { type, id, tts: '', answers: [''] }
    case 'select_word':     return { type, id, sentence: '', choices: ['', '', ''], answer: '' }
    case 'dialog':          return { type, id, speakers: [{ id: 'A', name: '', voice: DEFAULT_VOICE }, { id: 'B', name: '', voice: DEFAULT_VOICE }], lines: [{ speaker: 'A', text: '', tts: '', audio: null }, { speaker: 'B', text: '', tts: '', audio: null }], prompt: '', answer: '', choices: [] }
    case 'image_select':    return { type, id, prompt: '', tts: '', audio: null, options: [{ key: uid(), image: null }, { key: uid(), image: null }], answer: 0 }
    case 'image_match':     return { type, id, instruction: 'Match each picture to its word:', pairs: [{ key: uid(), word: '', image: null }, { key: uid(), word: '', image: null }] }
    case 'image_name':      return { type, id, image: null, answers: [''], tts: '', audio: null, hint: '' }
    case 'image_mc':        return { type, id, image: null, question: '', choices: ['', '', ''], answer: '', tts: '', audio: null }
    default: return { type, id }
  }
}

function defaultLesson(levelId) {
  return { id: levelId + '_l' + Date.now(), title: 'New Lesson', xp: 10, exercises: [] }
}

function exerciseSummary(ex) {
  switch (ex.type) {
    case 'introduce':        return ex.display || ''
    case 'multiple_choice':  return ex.question || ''
    case 'word_bank':        return ex.prompt ? `"${ex.prompt}" : ${ex.answer || '?'}` : ''
    case 'translate_to_en':  return ex.prompt || ''
    case 'translate_to_bg':  return ex.prompt || ''
    case 'fill_blank':       return ex.sentence || ''
    case 'listen_and_type':  return ex.tts || ''
    case 'speak_sentence':   return ex.tts || ''
    case 'match_pairs':      return ex.pairs?.map(p => p.left).filter(Boolean).join(', ') || ''
    case 'listen_translate': return ex.tts || ''
    case 'select_word':     return ex.sentence || ''
    case 'dialog':          return ex.lines?.map(l => l.text).filter(Boolean).join(' / ') || ''
    case 'image_select':    return ex.prompt || ex.tts || ''
    case 'image_match':     return ex.pairs?.map(p => p.word).filter(Boolean).join(', ') || ''
    case 'image_name':      return (ex.answers && ex.answers[0]) || ''
    case 'image_mc':        return ex.question || ex.answer || ''
    default: return '—'
  }
}

// ── markdown renderer (same logic as /level/[id]/page.js) ────────────────────
function renderMd(text) {
  const lines = (text || '').trim().split('\n')
  const out = []; let i = 0, k = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('## '))  { out.push(<h2 key={k++} className={styles.mdH2}>{line.slice(3)}</h2>); i++ }
    else if (line.startsWith('### ')) { out.push(<h3 key={k++} className={styles.mdH3}>{line.slice(4)}</h3>); i++ }
    else if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++ }
      const parse = r => r.split('|').map(c => c.trim()).filter(Boolean)
      const [hdr,, ...body] = rows
      out.push(<table key={k++} className={styles.mdTable}>
        <thead><tr>{parse(hdr).map((c,j)=><th key={j}>{mdInline(c)}</th>)}</tr></thead>
        <tbody>{body.map((r,ri)=><tr key={ri}>{parse(r).map((c,j)=><td key={j}>{mdInline(c)}</td>)}</tr>)}</tbody>
      </table>)
    } else if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) { items.push(lines[i].slice(2)); i++ }
      out.push(<ul key={k++} className={styles.mdUl}>{items.map((t,j)=><li key={j}>{mdInline(t)}</li>)}</ul>)
    } else if (line.trim() === '') { i++ }
    else { out.push(<p key={k++} className={styles.mdP}>{mdInline(line)}</p>); i++ }
  }
  return out
}
function mdInline(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2,-2)}</strong>
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1,-1)}</em>
    return p
  })
}

// ── small reusable pieces ─────────────────────────────────────────────────────
function FieldRow({ label, children, hint }) {
  return (
    <div className={styles.fieldRow}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldInput}>
        {children}
        {hint && <div className={styles.fieldHint}>{hint}</div>}
      </div>
    </div>
  )
}

function StringList({ label, values, onChange, placeholder = 'Add item…', minItems = 1 }) {
  return (
    <div className={styles.fieldRow}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      <div className={styles.fieldInput}>
        {values.map((v, i) => (
          <div key={i} className={styles.strListRow}>
            <input
              className={styles.input}
              value={v}
              placeholder={placeholder}
              onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n) }}
            />
            {values.length > minItems && (
              <button className={styles.removeBtn} onClick={() => onChange(values.filter((_, j) => j !== i))} title="Remove">✕</button>
            )}
          </div>
        ))}
        <button className={styles.addSmallBtn} onClick={() => onChange([...values, ''])}>+ Add</button>
      </div>
    </div>
  )
}

// ── exercise-specific editors ─────────────────────────────────────────────────
function ExerciseEditor({ ex, onChange }) {
  const set = (field, val) => onChange({ ...ex, [field]: val })
  const ttsField = (
    <div className={styles.fieldRow}>
      <label className={styles.fieldLabel}>Audio (Bulgarian)</label>
      <div className={styles.fieldInput}>
        <input className={styles.input} value={ex.tts || ''} placeholder="Здравей" onChange={e => set('tts', e.target.value)} />
        <AudioField audio={ex.audio || null} onChange={a => set('audio', a)} />
      </div>
    </div>
  )

  switch (ex.type) {
    case 'introduce': return (
      <>
        <FieldRow label="Badge label">
          <input className={styles.input} value={ex.label || ''} placeholder="NEW WORD" onChange={e => set('label', e.target.value)} />
        </FieldRow>
        <FieldRow label="Display (big text shown)" hint="The word or phrase being introduced">
          <input className={styles.input} value={ex.display || ''} placeholder="Здравей!" onChange={e => set('display', e.target.value)} />
        </FieldRow>
        <FieldRow label="Sublabel (usage note)">
          <input className={styles.input} value={ex.sublabel || ''} placeholder="informal hello to one person" onChange={e => set('sublabel', e.target.value)} />
        </FieldRow>
        <FieldRow label="Translation">
          <input className={styles.input} value={ex.translation || ''} placeholder="Hello!" onChange={e => set('translation', e.target.value)} />
        </FieldRow>
        {ttsField}
      </>
    )

    case 'multiple_choice': return (
      <>
        <FieldRow label="Question">
          <input className={styles.input} value={ex.question || ''} placeholder="Which means 'Hello'?" onChange={e => set('question', e.target.value)} />
        </FieldRow>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            Choices
            <span className={styles.fieldLabelHint}>click ✓ to mark correct</span>
          </label>
          <div className={styles.fieldInput}>
            {(ex.choices || []).map((c, i) => (
              <div key={i} className={styles.choiceRow}>
                <input
                  className={`${styles.input} ${c && c === ex.answer ? styles.inputCorrect : ''}`}
                  value={c}
                  placeholder={`Option ${i + 1}`}
                  onChange={e => { const n = [...(ex.choices || [])]; n[i] = e.target.value; set('choices', n) }}
                />
                <button
                  className={`${styles.correctBtn} ${c && c === ex.answer ? styles.correctBtnActive : ''}`}
                  onClick={() => set('answer', c)}
                  title="Mark as correct answer"
                >✓</button>
                {(ex.choices || []).length > 2 && (
                  <button className={styles.removeBtn} onClick={() => { const n = (ex.choices || []).filter((_, j) => j !== i); set('choices', n); if (ex.answer === c) set('answer', '') }} title="Remove">✕</button>
                )}
              </div>
            ))}
            <button className={styles.addSmallBtn} onClick={() => set('choices', [...(ex.choices || []), ''])}>+ Add choice</button>
            {ex.answer && <div className={styles.correctHint}>✓ correct answer: <strong>{ex.answer}</strong></div>}
          </div>
        </div>
        {ttsField}
      </>
    )

    case 'word_bank': return (
      <>
        <FieldRow label="Direction">
          <select className={styles.select} value={ex.direction || 'to_bg'} onChange={e => set('direction', e.target.value)}>
            <option value="to_bg">to_bg — prompt is English, arrange Bulgarian words</option>
            <option value="to_en">to_en — prompt is Bulgarian, arrange English words</option>
          </select>
        </FieldRow>
        <FieldRow label="Prompt (the sentence to translate)">
          <input className={styles.input} value={ex.prompt || ''} placeholder="Good morning" onChange={e => set('prompt', e.target.value)} />
        </FieldRow>
        <FieldRow label="Correct answer" hint="Must be buildable from the words below">
          <input className={styles.input} value={ex.answer || ''} placeholder="Добро утро" onChange={e => set('answer', e.target.value)} />
        </FieldRow>
        <StringList
          label="Word bank (include answer words + distractors)"
          values={ex.words || []}
          onChange={v => set('words', v)}
          placeholder="Word…"
          minItems={2}
        />
        <FieldRow label="Word hints (optional)" hint="Per-word glosses, e.g. добре = fine, съм = I am. Used to colour/annotate the Bulgarian prompt.">
          <input className={styles.input} value={ex.hint || ''} placeholder="добре = fine, съм = I am" onChange={e => set('hint', e.target.value)} />
        </FieldRow>
        {ttsField}
      </>
    )

    case 'translate_to_en': return (
      <>
        <FieldRow label="Bulgarian prompt (shown to learner)">
          <input className={styles.input} value={ex.prompt || ''} placeholder="Добре съм" onChange={e => set('prompt', e.target.value)} />
        </FieldRow>
        <StringList
          label="Accepted English answers (add all valid forms)"
          values={ex.answers || ['']}
          onChange={v => set('answers', v)}
          placeholder="I am fine"
        />
        <div className={styles.exNote}>Typos, contractions ("I'm" / "I am"), and common global synonyms ("nice / pleased / glad to meet you") are accepted automatically.</div>
        <FieldRow label="Hint (optional, shown if wrong)">
          <input className={styles.input} value={ex.hint || ''} placeholder="добре = fine, съм = I am" onChange={e => set('hint', e.target.value)} />
        </FieldRow>
        {ttsField}
      </>
    )

    case 'translate_to_bg': return (
      <>
        <FieldRow label="English prompt (shown to learner)">
          <input className={styles.input} value={ex.prompt || ''} placeholder="Good morning" onChange={e => set('prompt', e.target.value)} />
        </FieldRow>
        <StringList
          label="Accepted Bulgarian answers (add all valid forms)"
          values={ex.answers || (ex.answer ? [ex.answer] : [''])}
          onChange={v => { const next = { ...ex, answers: v }; delete next.answer; onChange(next) }}
          placeholder="Добро утро"
        />
        <div className={styles.exNote}>Roman-letter typing (e.g. "dobro utro") and common global synonyms are accepted automatically. You only need to add genuinely different phrasings.</div>
      </>
    )

    case 'fill_blank': return (
      <>
        <FieldRow label="Sentence (use ___ for the blank)" hint="Example: Казвам ___ Иван.">
          <input className={styles.input} value={ex.sentence || ''} placeholder="Казвам ___ Иван." onChange={e => set('sentence', e.target.value)} />
        </FieldRow>
        <FieldRow label="Answer (the missing word)">
          <input className={styles.input} value={ex.answer || ''} placeholder="се" onChange={e => set('answer', e.target.value)} />
        </FieldRow>
        <FieldRow label="Hint (optional)">
          <input className={styles.input} value={ex.hint || ''} placeholder="Казвам се = My name is" onChange={e => set('hint', e.target.value)} />
        </FieldRow>
      </>
    )

    case 'listen_and_type': return (
      <>
        {ttsField}
        <FieldRow label="Expected typed answer" hint="What the learner must type after hearing the audio">
          <input className={styles.input} value={ex.answer || ''} placeholder="Здравей" onChange={e => set('answer', e.target.value)} />
        </FieldRow>
      </>
    )

    case 'speak_sentence': return (
      <>
        {ttsField}
        <div className={styles.exNote}>The learner will hear this text, then must repeat it aloud. Speech recognition checks their answer.</div>
      </>
    )

    case 'match_pairs': return (
      <>
        <FieldRow label="Instruction text">
          <input className={styles.input} value={ex.instruction || ''} placeholder="Match each word to its translation:" onChange={e => set('instruction', e.target.value)} />
        </FieldRow>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            Pairs
            <span className={styles.fieldLabelHint}>left = Bulgarian · right = English</span>
          </label>
          <div className={styles.fieldInput}>
            {(ex.pairs || []).map((pair, i) => (
              <div key={i} className={styles.pairRow}>
                <input
                  className={styles.input}
                  value={pair.left || ''}
                  placeholder="Здравей"
                  onChange={e => { const p = [...(ex.pairs || [])]; p[i] = { ...p[i], left: e.target.value }; set('pairs', p) }}
                />
                <span className={styles.pairArrow}>and</span>
                <input
                  className={styles.input}
                  value={pair.right || ''}
                  placeholder="Hello"
                  onChange={e => { const p = [...(ex.pairs || [])]; p[i] = { ...p[i], right: e.target.value }; set('pairs', p) }}
                />
                {(ex.pairs || []).length > 2 && (
                  <button className={styles.removeBtn} onClick={() => set('pairs', (ex.pairs || []).filter((_, j) => j !== i))} title="Remove">✕</button>
                )}
              </div>
            ))}
            <button className={styles.addSmallBtn} onClick={() => set('pairs', [...(ex.pairs || []), { left: '', right: '' }])}>+ Add pair</button>
          </div>
        </div>
      </>
    )

    case 'listen_translate': return (
      <>
        {ttsField}
        <StringList
          label="Accepted English answers"
          values={ex.answers || ['']}
          onChange={v => set('answers', v)}
          placeholder="Hello"
        />
      </>
    )

    case 'select_word': return (
      <>
        <FieldRow label="Sentence (use ___ for the blank)" hint="Example: Аз ___ студент.">
          <input className={styles.input} value={ex.sentence || ''} placeholder="Аз ___ студент." onChange={e => set('sentence', e.target.value)} />
        </FieldRow>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            Choices
            <span className={styles.fieldLabelHint}>click ✓ to mark correct</span>
          </label>
          <div className={styles.fieldInput}>
            {(ex.choices || []).map((c, i) => (
              <div key={i} className={styles.choiceRow}>
                <input
                  className={`${styles.input} ${c && c === ex.answer ? styles.inputCorrect : ''}`}
                  value={c}
                  placeholder={`Option ${i + 1}`}
                  onChange={e => { const n = [...(ex.choices || [])]; n[i] = e.target.value; set('choices', n) }}
                />
                <button
                  className={`${styles.correctBtn} ${c && c === ex.answer ? styles.correctBtnActive : ''}`}
                  onClick={() => set('answer', c)}
                  title="Mark as correct"
                >✓</button>
                {(ex.choices || []).length > 2 && (
                  <button className={styles.removeBtn} onClick={() => { const n = (ex.choices || []).filter((_, j) => j !== i); set('choices', n); if (ex.answer === c) set('answer', '') }}>✕</button>
                )}
              </div>
            ))}
            <button className={styles.addSmallBtn} onClick={() => set('choices', [...(ex.choices || []), ''])}>+ Add choice</button>
            {ex.answer && <div className={styles.correctHint}>✓ correct: <strong>{ex.answer}</strong></div>}
          </div>
        </div>
        <FieldRow label="Optional prompt (shown above sentence)">
          <input className={styles.input} value={ex.prompt || ''} placeholder="Optional context question" onChange={e => set('prompt', e.target.value)} />
        </FieldRow>
      </>
    )

    case 'dialog': return (
      <>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            Speakers
            <span className={styles.fieldLabelHint}>name · voice per person</span>
          </label>
          <div className={styles.fieldInput}>
            {(ex.speakers || []).map((sp, si) => (
              <div key={sp.id} className={styles.dialogLineRow}>
                <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-muted)', width: 18, flexShrink: 0 }}>{sp.id}</span>
                <input
                  className={styles.input}
                  value={sp.name || ''}
                  placeholder="Display name (optional)"
                  onChange={e => { const s = [...(ex.speakers || [])]; s[si] = { ...s[si], name: e.target.value }; set('speakers', s) }}
                />
                <select
                  className={styles.selectSm}
                  style={{ width: 120 }}
                  value={sp.voice || DEFAULT_VOICE}
                  onChange={e => { const s = [...(ex.speakers || [])]; s[si] = { ...s[si], voice: e.target.value }; set('speakers', s) }}
                >
                  {BG_VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.gender} {v.label}</option>
                  ))}
                </select>
                {(ex.speakers || []).length > 2 && (
                  <button className={styles.removeBtn} onClick={() => set('speakers', (ex.speakers || []).filter((_, j) => j !== si))}>✕</button>
                )}
              </div>
            ))}
            <button className={styles.addSmallBtn} onClick={() => {
              const ids = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
              const used = new Set((ex.speakers || []).map(s => s.id))
              const nextId = ids.split('').find(c => !used.has(c)) || `S${(ex.speakers || []).length + 1}`
              set('speakers', [...(ex.speakers || []), { id: nextId, name: '', voice: DEFAULT_VOICE }])
            }}>+ Add speaker</button>
          </div>
        </div>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            Conversation lines
            <span className={styles.fieldLabelHint}>speaker A or B · add TTS for Bulgarian lines</span>
          </label>
          <div className={styles.fieldInput}>
            {(ex.lines || []).map((line, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 8, marginBottom: 8, borderBottom: '1px dashed var(--border-hi, #ddd)' }}>
                <div className={styles.dialogLineRow}>
                  <select
                    className={styles.selectSm}
                    value={line.speaker || (ex.speakers?.[0]?.id ?? 'A')}
                    onChange={e => { const l = [...(ex.lines || [])]; l[i] = { ...l[i], speaker: e.target.value }; set('lines', l) }}
                  >
                    {(ex.speakers || [{ id: 'A' }, { id: 'B' }]).map(s => (
                      <option key={s.id} value={s.id}>{s.id}{s.name ? ` (${s.name})` : ''}</option>
                    ))}
                  </select>
                  <input
                    className={styles.input}
                    value={line.text || ''}
                    placeholder="Line text (displayed)"
                    onChange={e => { const l = [...(ex.lines || [])]; l[i] = { ...l[i], text: e.target.value }; set('lines', l) }}
                  />
                  <input
                    className={styles.input}
                    value={line.tts || ''}
                    placeholder="TTS override (leave blank to speak the text above)"
                    onChange={e => { const l = [...(ex.lines || [])]; l[i] = { ...l[i], tts: e.target.value }; set('lines', l) }}
                  />
                  {(ex.lines || []).length > 2 && (
                    <button className={styles.removeBtn} onClick={() => set('lines', (ex.lines || []).filter((_, j) => j !== i))}>✕</button>
                  )}
                </div>
                <AudioField
                  audio={line.audio || null}
                  onChange={a => { const l = [...(ex.lines || [])]; l[i] = { ...l[i], audio: a }; set('lines', l) }}
                  hint="Custom audio for this line. Leave empty to speak the text/TTS above."
                />
              </div>
            ))}
            <button className={styles.addSmallBtn} onClick={() => set('lines', [...(ex.lines || []), { speaker: 'A', text: '', tts: '' }])}>+ Add line</button>
          </div>
        </div>
        <FieldRow label="Question / prompt shown after the dialog">
          <input className={styles.input} value={ex.prompt || ''} placeholder="What does B say?" onChange={e => set('prompt', e.target.value)} />
        </FieldRow>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            Choices
            <span className={styles.fieldLabelHint}>leave empty to use a typed text input instead</span>
          </label>
          <div className={styles.fieldInput}>
            {(ex.choices || []).map((c, i) => (
              <div key={i} className={styles.choiceRow}>
                <input
                  className={`${styles.input} ${c && c === ex.answer ? styles.inputCorrect : ''}`}
                  value={c}
                  placeholder={`Choice ${i + 1}`}
                  onChange={e => { const n = [...(ex.choices || [])]; n[i] = e.target.value; set('choices', n) }}
                />
                <button
                  className={`${styles.correctBtn} ${c && c === ex.answer ? styles.correctBtnActive : ''}`}
                  onClick={() => set('answer', c)}
                  title="Mark as correct"
                >✓</button>
                {(ex.choices || []).length > 0 && (
                  <button className={styles.removeBtn} onClick={() => { const n = (ex.choices || []).filter((_, j) => j !== i); set('choices', n); if (ex.answer === c) set('answer', '') }}>✕</button>
                )}
              </div>
            ))}
            <button className={styles.addSmallBtn} onClick={() => set('choices', [...(ex.choices || []), ''])}>+ Add choice</button>
            {ex.answer && <div className={styles.correctHint}>✓ correct: <strong>{ex.answer}</strong></div>}
          </div>
        </div>
      </>
    )

    case 'image_select': {
      const options = ex.options || []
      return (
        <>
          <FieldRow label="Word shown / spoken (Bulgarian)" hint="Displayed above the pictures and used for the audio prompt">
            <input className={styles.input} value={ex.prompt || ''} placeholder="куче" onChange={e => set('prompt', e.target.value)} />
          </FieldRow>
          {ttsField}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>
              Picture options
              <span className={styles.fieldLabelHint}>click ✓ to mark the correct picture</span>
            </label>
            <div className={styles.fieldInput}>
              {options.map((opt, i) => (
                <div key={opt.key || i} className={styles.choiceRow} style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <ImageField image={opt.image || null} onChange={img => { const o = [...options]; o[i] = { ...o[i], image: img }; set('options', o) }} label={`Option ${i + 1}`} />
                  </div>
                  <button
                    className={`${styles.correctBtn} ${ex.answer === i ? styles.correctBtnActive : ''}`}
                    onClick={() => set('answer', i)}
                    title="Mark as correct"
                  >✓</button>
                  {options.length > 2 && (
                    <button className={styles.removeBtn} onClick={() => {
                      const o = options.filter((_, j) => j !== i)
                      set('options', o)
                      if (ex.answer === i) set('answer', 0)
                      else if (ex.answer > i) set('answer', ex.answer - 1)
                    }}>✕</button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <button className={styles.addSmallBtn} onClick={() => set('options', [...options, { key: uid(), image: null }])}>+ Add picture</button>
              )}
            </div>
          </div>
        </>
      )
    }

    case 'image_match': {
      const pairs = ex.pairs || []
      return (
        <>
          <FieldRow label="Instruction text">
            <input className={styles.input} value={ex.instruction || ''} placeholder="Match each picture to its word:" onChange={e => set('instruction', e.target.value)} />
          </FieldRow>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>
              Pairs
              <span className={styles.fieldLabelHint}>picture + its Bulgarian word</span>
            </label>
            <div className={styles.fieldInput}>
              {pairs.map((pair, i) => (
                <div key={pair.key || i} className={styles.pairRow} style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <ImageField image={pair.image || null} onChange={img => { const p = [...pairs]; p[i] = { ...p[i], image: img }; set('pairs', p) }} label={`Pair ${i + 1}`} />
                  </div>
                  <input
                    className={styles.input}
                    value={pair.word || ''}
                    placeholder="куче"
                    onChange={e => { const p = [...pairs]; p[i] = { ...p[i], word: e.target.value }; set('pairs', p) }}
                  />
                  {pairs.length > 2 && (
                    <button className={styles.removeBtn} onClick={() => set('pairs', pairs.filter((_, j) => j !== i))}>✕</button>
                  )}
                </div>
              ))}
              {pairs.length < 6 && (
                <button className={styles.addSmallBtn} onClick={() => set('pairs', [...pairs, { key: uid(), word: '', image: null }])}>+ Add pair</button>
              )}
            </div>
          </div>
        </>
      )
    }

    case 'image_name': return (
      <>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>Picture</label>
          <div className={styles.fieldInput}>
            <ImageField image={ex.image || null} onChange={img => set('image', img)} label="Picture" />
          </div>
        </div>
        <StringList
          label="Accepted Bulgarian answers"
          values={ex.answers || ['']}
          onChange={v => set('answers', v)}
          placeholder="куче"
        />
        <div className={styles.exNote}>Roman-letter typing (e.g. "kuche") and small typos are accepted automatically.</div>
        <FieldRow label="Hint (optional, shown if wrong)">
          <input className={styles.input} value={ex.hint || ''} placeholder="a common pet" onChange={e => set('hint', e.target.value)} />
        </FieldRow>
        {ttsField}
      </>
    )

    case 'image_mc': return (
      <>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>Picture</label>
          <div className={styles.fieldInput}>
            <ImageField image={ex.image || null} onChange={img => set('image', img)} label="Picture" />
          </div>
        </div>
        <FieldRow label="Question (optional)">
          <input className={styles.input} value={ex.question || ''} placeholder="What is this?" onChange={e => set('question', e.target.value)} />
        </FieldRow>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            Choices
            <span className={styles.fieldLabelHint}>click ✓ to mark correct</span>
          </label>
          <div className={styles.fieldInput}>
            {(ex.choices || []).map((c, i) => (
              <div key={i} className={styles.choiceRow}>
                <input
                  className={`${styles.input} ${c && c === ex.answer ? styles.inputCorrect : ''}`}
                  value={c}
                  placeholder={`Option ${i + 1}`}
                  onChange={e => { const n = [...(ex.choices || [])]; n[i] = e.target.value; set('choices', n) }}
                />
                <button
                  className={`${styles.correctBtn} ${c && c === ex.answer ? styles.correctBtnActive : ''}`}
                  onClick={() => set('answer', c)}
                  title="Mark as correct"
                >✓</button>
                {(ex.choices || []).length > 2 && (
                  <button className={styles.removeBtn} onClick={() => { const n = (ex.choices || []).filter((_, j) => j !== i); set('choices', n); if (ex.answer === c) set('answer', '') }}>✕</button>
                )}
              </div>
            ))}
            <button className={styles.addSmallBtn} onClick={() => set('choices', [...(ex.choices || []), ''])}>+ Add choice</button>
            {ex.answer && <div className={styles.correctHint}>✓ correct: <strong>{ex.answer}</strong></div>}
          </div>
        </div>
        {ttsField}
      </>
    )

    default: return <div className={styles.exNote}>Unknown type: {ex.type}</div>
  }
}

// ── icons ─────────────────────────────────────────────────────────────────────
function ExpandIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1h4v4" /><path d="M1 8v4h4" />
      <line x1="12" y1="1" x2="7" y2="6" /><line x1="1" y1="12" x2="6" y2="7" />
    </svg>
  )
}
function CollapseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5H8V1" /><path d="M1 8h4v4" />
      <line x1="8" y1="5" x2="13" y2="0" /><line x1="0" y1="13" x2="5" y2="8" />
    </svg>
  )
}

// ── main editor ───────────────────────────────────────────────────────────────
export default function LevelEditor() {
  const { id } = useParams()
  const router = useRouter()
  const [level, setLevel] = useState(null)
  const [ready, setReady] = useState(false)
  const [expandedLessons, setExpandedLessons] = useState(new Set())
  const [expandedEx, setExpandedEx] = useState({}) // { [lessonIdx]: Set<exIdx> }
  const [addExLesson, setAddExLesson] = useState(null)
  const [showLessons, setShowLessons] = useState(true)
  const [notesTab, setNotesTab] = useState('edit') // 'edit' | 'preview'
  const [confirmDelete, setConfirmDelete] = useState(null) // { type: 'lesson'|'level', li?, label }
  const [showSettings, setShowSettings] = useState(true)
  const [maximized, setMaximized] = useState(null) // null | 'settings' | 'lessons'
  const [exportFlash, setExportFlash] = useState(false)
  const [shareFlash, setShareFlash] = useState(false)
  const [ttsMuted, setTtsMuted] = useState(() => getTTSMuted())

  useEffect(() => {
    if (!maximized) { document.body.style.overflow = ''; return }
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') setMaximized(null) }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [maximized])

  useEffect(() => {
    const levels = loadLevels()
    const found = levels.find(l => l.id === id)
    if (found) {
      setLevel(found)
      if (found.lessons.length > 0) setExpandedLessons(new Set([0]))
    }
    setReady(true)
  }, [id])

  const persist = useCallback((next) => {
    setLevel(next)
    const levels = loadLevels()
    const idx = levels.findIndex(l => l.id === id)
    if (idx !== -1) { levels[idx] = next; saveLevels(levels) }
  }, [id])

  const updateLevel = useCallback((updater) => {
    setLevel(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      const levels = loadLevels()
      const idx = levels.findIndex(l => l.id === id)
      if (idx !== -1) { levels[idx] = next; saveLevels(levels) }
      return next
    })
  }, [id])

  // ── lesson helpers ──
  function addLesson() {
    const lesson = defaultLesson(id)
    updateLevel(prev => {
      const lessons = [...prev.lessons, lesson]
      setTimeout(() => setExpandedLessons(prev => { const next = new Set(prev); next.add(lessons.length - 1); return next }), 0)
      return { ...prev, lessons }
    })
  }
  function deleteLesson(li) {
    updateLevel(prev => {
      const lessons = prev.lessons.filter((_, i) => i !== li)
      setExpandedLessons(prev => {
        const next = new Set()
        for (const idx of prev) {
          if (idx < li) next.add(idx)
          else if (idx > li) next.add(idx - 1)
        }
        return next
      })
      return { ...prev, lessons }
    })
    setConfirmDelete(null)
  }
  function deleteLevelAndExit() {
    const levels = loadLevels()
    saveLevels(levels.filter(l => l.id !== id))
    router.push('/builder')
  }
  function moveLesson(li, dir) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      const j = li + dir
      if (j < 0 || j >= lessons.length) return prev;
      [lessons[li], lessons[j]] = [lessons[j], lessons[li]]
      setExpandedLessons(prev => {
        const next = new Set(prev)
        const hadLi = next.has(li), hadJ = next.has(j)
        if (hadLi) { next.delete(li); next.add(j) }
        if (hadJ) { next.delete(j); next.add(li) }
        return next
      })
      return { ...prev, lessons }
    })
  }
  function setLessonField(li, field, val) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      lessons[li] = { ...lessons[li], [field]: val }
      return { ...prev, lessons }
    })
  }

  // ── exercise helpers ──
  function addExercise(li, type) {
    const ex = defaultExercise(type)
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      const exercises = [...(lessons[li].exercises || []), ex]
      lessons[li] = { ...lessons[li], exercises }
      setExpandedEx(prev => {
        const set = new Set(prev[li] || [])
        set.add(exercises.length - 1)
        return { ...prev, [li]: set }
      })
      return { ...prev, lessons }
    })
    setAddExLesson(null)
  }
  function deleteExercise(li, ei) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      lessons[li] = { ...lessons[li], exercises: lessons[li].exercises.filter((_, i) => i !== ei) }
      return { ...prev, lessons }
    })
  }
  function moveExercise(li, ei, dir) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      const exercises = [...lessons[li].exercises]
      const j = ei + dir
      if (j < 0 || j >= exercises.length) return prev;
      [exercises[ei], exercises[j]] = [exercises[j], exercises[ei]]
      lessons[li] = { ...lessons[li], exercises }
      return { ...prev, lessons }
    })
  }
  function updateExercise(li, ei, ex) {
    updateLevel(prev => {
      const lessons = [...prev.lessons]
      const exercises = [...lessons[li].exercises]
      exercises[ei] = ex
      lessons[li] = { ...lessons[li], exercises }
      return { ...prev, lessons }
    })
  }
  function toggleEx(li, ei) {
    setExpandedEx(prev => {
      const set = new Set(prev[li] || [])
      if (set.has(ei)) set.delete(ei); else set.add(ei)
      return { ...prev, [li]: set }
    })
  }

  function shareLevel() {
    const encoded = encodeLevel(level)
    if (!encoded) return
    const url = window.location.origin + '/builder/import?d=' + encoded
    copyText(url).then(() => {
      setShareFlash(true)
      setTimeout(() => setShareFlash(false), 2500)
    }).catch(() => {
      setShareFlash(true)
      setTimeout(() => setShareFlash(false), 2500)
    })
  }

  function exportJSON() {
    const json = JSON.stringify(level, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (level.id || 'level') + '.json'
    a.click()
    URL.revokeObjectURL(url)
    setExportFlash(true)
    setTimeout(() => setExportFlash(false), 2000)
  }

  if (!ready) return <div className={styles.loading}>Loading…</div>
  if (!level) return (
    <div className={styles.notFound}>
      Level not found.{' '}
      <Link href="/builder" className={styles.link}>← Back to Builder</Link>
    </div>
  )

  return (
    <BuilderGate>
    <div className={styles.page}>

      {/* ── delete confirm modal ── */}
      {confirmDelete && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalEmoji}>🗑️</div>
            <h3 className={styles.modalTitle}>
              {confirmDelete.type === 'level' ? 'Delete level?' : 'Delete lesson?'}
            </h3>
            <p className={styles.modalText}>
              {confirmDelete.type === 'level'
                ? `"${confirmDelete.label}" and all its lessons will be permanently removed.`
                : `"${confirmDelete.label}" and all its exercises will be permanently removed.`}
            </p>
            <button
              className={styles.modalConfirmBtn}
              onClick={() => confirmDelete.type === 'level' ? deleteLevelAndExit() : deleteLesson(confirmDelete.li)}
            >DELETE</button>
            <button className={styles.modalCancelBtn} onClick={() => setConfirmDelete(null)}>CANCEL</button>
          </div>
        </div>
      )}

      {/* ── top bar ── */}
      <div className={styles.topBar}>
        <Link href="/builder" className={styles.backBtn} title="Back to Builder">
          <img src="/icons/gray_x.png" alt="✕" width={18} height={18} />
        </Link>
        <div className={styles.topCenter}>
          <span className={styles.topLevel} style={{ color: level.color }}>{level.icon}</span>
          <span className={styles.topTitle}>{level.title}</span>
        </div>
        <div className={styles.topActions}>
          {level.lessons.length > 0 && (
            <Link href={'/builder/play/' + level.id} className={styles.playBtn} style={{ background: level.color }}>
              ▶ Play
            </Link>
          )}
          <button
            className={`${styles.muteBtn} ${ttsMuted ? styles.muteBtnOff : ''}`}
            onClick={() => { setTTSMuted(!ttsMuted); setTtsMuted(!ttsMuted) }}
            title={ttsMuted ? 'Unmute TTS' : 'Mute TTS'}
          >{ttsMuted ? '🔇' : '🔊'}</button>
          <button className={`${styles.shareBtn} ${shareFlash ? styles.shareBtnFlash : ''}`} onClick={shareLevel}>
            {shareFlash ? 'Link copied!' : 'Share'}
          </button>
          <button className={`${styles.exportBtn} ${exportFlash ? styles.exportFlash : ''}`} onClick={exportJSON}>
            {exportFlash ? 'Exported!' : 'Export JSON'}
          </button>
          <button className={styles.deleteTopBtn} onClick={() => setConfirmDelete({ type: 'level', label: level.title })} title="Delete level">
            🗑️
          </button>
        </div>
      </div>

      <div className={styles.editor}>

        {/* ── level settings ── */}
        {maximized === 'settings' && <div className={styles.backdrop} onClick={() => setMaximized(null)} />}
        <div className={maximized === 'settings' ? styles.sectionFull : styles.section}>
          <div className={`${styles.sectionToggleRow} ${maximized === 'settings' ? styles.sectionFullHeader : ''}`}>
            <button className={styles.sectionToggle} onClick={() => maximized !== 'settings' && setShowSettings(v => !v)}>
              <span className={styles.sectionToggleLabel}>Level Settings</span>
              <span className={`${styles.chevron} ${(showSettings || maximized === 'settings') ? styles.chevronUp : ''}`} />
            </button>
            <button className={styles.maximizeBtn} onClick={() => setMaximized(v => v === 'settings' ? null : 'settings')} title={maximized === 'settings' ? 'Minimize' : 'Expand'}>
              {maximized === 'settings' ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </div>

          {(showSettings || maximized === 'settings') && (
            <div className={maximized === 'settings' ? styles.sectionFullBody : styles.sectionBody}>
              <div className={styles.settingsGrid}>
                <FieldRow label="Title">
                  <input className={styles.input} value={level.title} placeholder="Level title" onChange={e => updateLevel({ title: e.target.value })} />
                </FieldRow>
                <FieldRow label="Subtitle">
                  <input className={styles.input} value={level.subtitle} placeholder="Short description" onChange={e => updateLevel({ subtitle: e.target.value })} />
                </FieldRow>
                <FieldRow label="Color">
                  <div className={styles.colorRow}>
                    <input type="color" className={styles.colorPicker} value={level.color} onChange={e => updateLevel({ color: e.target.value })} />
                    <input className={styles.input} value={level.color} style={{ width: 100, fontFamily: 'monospace' }} onChange={e => updateLevel({ color: e.target.value })} />
                  </div>
                </FieldRow>
                <FieldRow label="Icon / Short label" hint="Emoji or 2-4 chars shown on the level card">
                  <input className={styles.input} style={{ width: 90 }} value={level.icon} placeholder="★" maxLength={6} onChange={e => updateLevel({ icon: e.target.value })} />
                </FieldRow>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.notesTabRow}>
                  <label className={styles.fieldLabel}>Notes (Markdown)</label>
                  <div className={styles.tabToggle}>
                    <button className={`${styles.tabBtn} ${notesTab === 'edit' ? styles.tabBtnActive : ''}`} onClick={() => setNotesTab('edit')}>Edit</button>
                    <button className={`${styles.tabBtn} ${notesTab === 'preview' ? styles.tabBtnActive : ''}`} onClick={() => setNotesTab('preview')}>Preview</button>
                  </div>
                </div>
                {notesTab === 'edit' ? (
                  <textarea
                    className={styles.textarea}
                    value={level.notes}
                    rows={10}
                    placeholder={'## Vocabulary\n\n| Bulgarian | English |\n|-----------|--------|\n| Здравей | Hello |\n\n- **Здравей** - informal greeting'}
                    onChange={e => updateLevel({ notes: e.target.value })}
                  />
                ) : (
                  <div className={styles.notesPreview}>
                    {level.notes?.trim() ? renderMd(level.notes) : <p className={styles.notesEmpty}>Nothing to preview yet.</p>}
                  </div>
                )}
                <div className={styles.fieldHint}>Shown in the level Notes page. Supports ## headings, | tables |, - lists, **bold**</div>
              </div>
            </div>
          )}
        </div>

        {/* ── lessons ── */}
        {maximized === 'lessons' && <div className={styles.backdrop} onClick={() => setMaximized(null)} />}
        <div className={maximized === 'lessons' ? styles.sectionFull : styles.section}>
          <div className={`${styles.sectionToggleRow} ${maximized === 'lessons' ? styles.sectionFullHeader : ''}`}>
            <button className={styles.sectionToggle} onClick={() => maximized !== 'lessons' && setShowLessons(v => !v)}>
              <span className={styles.sectionToggleLabel}>Lessons <span className={styles.sectionCount}>({level.lessons.length})</span></span>
              <span className={`${styles.chevron} ${(showLessons || maximized === 'lessons') ? styles.chevronUp : ''}`} />
            </button>
            <button className={`${styles.addBtn} ${styles.addBtnInline}`} onClick={addLesson}>+ Add Lesson</button>
            <button className={styles.maximizeBtn} onClick={() => setMaximized(v => v === 'lessons' ? null : 'lessons')} title={maximized === 'lessons' ? 'Minimize' : 'Expand'}>
              {maximized === 'lessons' ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </div>

          {(showLessons || maximized === 'lessons') && (
          <div className={maximized === 'lessons' ? styles.sectionFullBody : styles.noWrap}>
          {level.lessons.length === 0 && (
            <div className={styles.emptyHint}>No lessons yet. Add one to get started.</div>
          )}

          {level.lessons.map((lesson, li) => {
            const isOpen = expandedLessons.has(li)
            const exSet = expandedEx[li] || new Set()
            return (
              <div key={lesson.id} className={`${styles.lessonCard} ${isOpen ? styles.lessonCardOpen : ''}`}>
                {/* lesson header */}
                <div className={styles.lessonHeader} onClick={() => setExpandedLessons(prev => { const next = new Set(prev); if (next.has(li)) next.delete(li); else next.add(li); return next })}>
                  <div className={styles.lessonHeaderLeft}>
                    <span className={styles.lessonNumBadge}>{li + 1}</span>
                    <span className={styles.lessonTitle}>{lesson.title}</span>
                    <span className={styles.lessonMeta}>{lesson.exercises?.length || 0} ex · {lesson.xp} XP</span>
                  </div>
                  <div className={styles.lessonHeaderRight} onClick={e => e.stopPropagation()}>
                    <button className={styles.iconBtn} onClick={() => moveLesson(li, -1)} disabled={li === 0} title="Move up">↑</button>
                    <button className={styles.iconBtn} onClick={() => moveLesson(li, 1)} disabled={li === level.lessons.length - 1} title="Move down">↓</button>
                    <button className={styles.iconBtnDanger} onClick={() => setConfirmDelete({ li, label: lesson.title })} title="Delete lesson">✕</button>
                    <span className={`${styles.chevron} ${isOpen ? styles.chevronUp : ''}`} />
                  </div>
                </div>

                {/* lesson body */}
                {isOpen && (
                  <div className={styles.lessonBody}>
                    <div className={styles.lessonFieldsRow}>
                      <FieldRow label="Lesson title">
                        <input className={styles.input} value={lesson.title} onChange={e => setLessonField(li, 'title', e.target.value)} />
                      </FieldRow>
                      <FieldRow label="XP reward">
                        <input className={styles.input} type="number" min={1} max={999} value={lesson.xp} style={{ width: 80 }} onChange={e => setLessonField(li, 'xp', parseInt(e.target.value) || 10)} />
                      </FieldRow>
                    </div>

                    <div className={styles.exercisesHeader}>
                      <span className={styles.exercisesLabel}>Exercises ({lesson.exercises?.length || 0})</span>
                    </div>

                    {(lesson.exercises || []).map((ex, ei) => {
                      const typeInfo = EXERCISE_TYPES.find(t => t.type === ex.type)
                      const isExOpen = exSet.has(ei)
                      return (
                        <div key={ex.id || ei} className={`${styles.exCard} ${isExOpen ? styles.exCardOpen : ''}`}>
                          <div className={styles.exHeader} onClick={() => toggleEx(li, ei)}>
                            <div className={styles.exHeaderLeft}>
                              <span className={styles.exTypeBadge}>
                                {typeInfo?.icon} {typeInfo?.label || ex.type}
                              </span>
                              {!isExOpen && (
                                <span className={styles.exSummary}>{exerciseSummary(ex)}</span>
                              )}
                            </div>
                            <div className={styles.exHeaderRight} onClick={e => e.stopPropagation()}>
                              <button className={styles.iconBtnSm} onClick={() => moveExercise(li, ei, -1)} disabled={ei === 0} title="Move up">↑</button>
                              <button className={styles.iconBtnSm} onClick={() => moveExercise(li, ei, 1)} disabled={ei === (lesson.exercises?.length || 0) - 1} title="Move down">↓</button>
                              <button className={styles.iconBtnSmDanger} onClick={() => deleteExercise(li, ei)} title="Delete">✕</button>
                              <span className={`${styles.chevronSm} ${isExOpen ? styles.chevronUp : ''}`} />
                            </div>
                          </div>

                          {isExOpen && (
                            <div className={styles.exBody}>
                              <ExerciseEditor ex={ex} onChange={updated => updateExercise(li, ei, updated)} />
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* add exercise panel */}
                    {addExLesson === li ? (
                      <div className={styles.addExPanel}>
                        <div className={styles.addExPanelTitle}>Choose exercise type:</div>
                        <div className={styles.addExGrid}>
                          {EXERCISE_TYPES.map(t => (
                            <button key={t.type} className={styles.addExCard} onClick={() => addExercise(li, t.type)}>
                              <span className={styles.addExIcon}>{t.icon}</span>
                              <span className={styles.addExLabel}>{t.label}</span>
                              <span className={styles.addExDesc}>{t.desc}</span>
                            </button>
                          ))}
                        </div>
                        <button className={styles.cancelBtn} onClick={() => setAddExLesson(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className={styles.addExBtn} onClick={() => setAddExLesson(li)}>
                        + Add Exercise
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {level.lessons.length > 0 && (
            <button className={styles.addBtnDashed} onClick={addLesson}>+ Add Another Lesson</button>
          )}
          </div>
          )}
        </div>
      </div>
    </div>
    </BuilderGate>
  )
}
