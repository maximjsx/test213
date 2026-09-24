import { BG_VOICES, DEFAULT_VOICE } from '../../lib/voices'
import { AudioField, ImageField } from './MediaControls'
import { uid } from './exerciseTypes'
import styles from './LevelEditor.module.css'

export function FieldRow({ label, children, hint }) {
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


export default function ExerciseEditor({ ex, onChange, courseId }) {
  const set = (field, val) => onChange({ ...ex, [field]: val })
  const ttsField = (
    <div className={styles.fieldRow}>
      <label className={styles.fieldLabel}>Audio (Bulgarian)</label>
      <div className={styles.fieldInput}>
        <input className={styles.input} value={ex.tts || ''} placeholder="Здравей" onChange={e => set('tts', e.target.value)} />
        <AudioField audio={ex.audio || null} onChange={a => set('audio', a)} courseId={courseId} />
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
                  courseId={courseId}
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
                    <ImageField image={opt.image || null} onChange={img => { const o = [...options]; o[i] = { ...o[i], image: img }; set('options', o) }} courseId={courseId} label={`Option ${i + 1}`} />
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
                    <ImageField image={pair.image || null} onChange={img => { const p = [...pairs]; p[i] = { ...p[i], image: img }; set('pairs', p) }} courseId={courseId} label={`Pair ${i + 1}`} />
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
            <ImageField image={ex.image || null} onChange={img => set('image', img)} courseId={courseId} label="Picture" />
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
            <ImageField image={ex.image || null} onChange={img => set('image', img)} courseId={courseId} label="Picture" />
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

