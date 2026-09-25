// Material and keyboard for the typing test.
import { PUBLIC_LEVELS } from './course'
import { shuffle } from './checker'

// Whole Bulgarian sentences from the course: prompts to translate, the
// Bulgarian side of word banks, dialog lines
function courseSentences() {
  const out = new Set()
  for (const level of PUBLIC_LEVELS) {
    for (const lesson of level.lessons) {
      for (const ex of lesson.exercises) {
        if (ex.type === 'translate_to_en' || (ex.type === 'word_bank' && ex.direction === 'to_en')) out.add(ex.prompt)
        if (ex.type === 'dialog') ex.lines?.forEach(l => l.text && out.add(l.text))
      }
    }
  }
  return [...out].filter(s => s.split(/\s+/).length >= 3)
}

export const SENTENCES = courseSentences()
// Everyday words only: the test is about typing, not about meeting rare vocabulary
export const COMMON_WORDS = [...new Set(`
и в на не да се с за от по че е са съм си сме сте ще ли как какво кой коя кое кои
къде кога защо колко тук там сега после днес утре вчера винаги никога често още вече само
много малко повече добре зле да не аз ти той тя то ние вие те мой твой негов неин наш ваш
техен това този тази тези онзи всичко всички нещо някой никой друг друга един една едно
два две три четири пет шест седем осем девет десет сто хиляда първи последен
човек хора мъж жена дете деца майка баща брат сестра приятел приятелка семейство име
ден нощ сутрин вечер седмица месец година час минута време живот свят град село къща дом
улица път стая врата прозорец маса стол легло кухня училище работа магазин пари цена
вода хляб мляко кафе чай вино бира месо риба сирене плод ябълка храна обед закуска вечеря
кола автобус влак самолет море планина река слънце дъжд сняг вятър небе земя цвете дърво
куче котка книга писмо телефон компютър филм музика песен език дума въпрос отговор
голям малък нов стар млад хубав лош добър красив бърз бавен топъл студен горещ висок нисък
бял черен червен зелен син жълт лесен труден важен интересен весел тъжен гладен жаден
съм имам нямам искам мога трябва знам мисля казвам говоря питам отговарям виждам гледам
слушам чувам чета пиша уча работя живея обичам харесвам ям пия спя ставам ходя отивам
идвам тръгвам връщам купувам плащам давам вземам правя чакам помагам играя пея танцувам
готвя почивам отварям затварям започвам свършвам търся намирам разбирам помня забравям
здравей благодаря моля извинете довиждане наздраве браво добро утро лека нощ
`.split(/\s+/).filter(Boolean))]

// A long enough stream of words for one run
export function buildText(source) {
  if (source === 'sentences') return shuffle(SENTENCES).join(' ').split(/\s+/)
  return Array.from({ length: 2 }, () => shuffle(COMMON_WORDS)).flat()
}

// Bulgarian Phonetic (traditional) layout by physical key, so learners can
// type Cyrillic on a Latin keyboard without installing anything
export const PHONETIC = {
  Backquote: 'ч', KeyQ: 'я', KeyW: 'в', KeyE: 'е', KeyR: 'р', KeyT: 'т', KeyY: 'ъ', KeyU: 'у', KeyI: 'и', KeyO: 'о', KeyP: 'п',
  BracketLeft: 'ш', BracketRight: 'щ', Backslash: 'ю',
  KeyA: 'а', KeyS: 'с', KeyD: 'д', KeyF: 'ф', KeyG: 'г', KeyH: 'х', KeyJ: 'й', KeyK: 'к', KeyL: 'л',
  KeyZ: 'з', KeyX: 'ь', KeyC: 'ц', KeyV: 'ж', KeyB: 'б', KeyN: 'н', KeyM: 'м',
}

export const KEY_ROWS = [
  ['Backquote', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'],
]

export const LATIN_LABEL = code => ({ Backquote: '`', BracketLeft: '[', BracketRight: ']', Backslash: '\\' }[code] ?? code.replace('Key', ''))

export const keyFor = letter => Object.keys(PHONETIC).find(code => PHONETIC[code] === letter?.toLowerCase()) || null
