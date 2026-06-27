// Structure: Level -> Lessons -> Exercises
// Types: introduce | multiple_choice | translate_to_en | translate_to_bg | fill_blank | match_pairs | word_bank | speak_sentence | listen_and_type | listen_translate

export const COURSE = {
  id: 'bulgarian',
  name: 'Bulgarian',
  flag: '🇧🇬',
  levels: [

    // ══════════════════════════════════════════════════════════
    {
      id: 'alphabet',
      title: 'The Alphabet',
      subtitle: 'All 30 Cyrillic letters',
      color: '#1cb0f6',
      icon: 'Аа',
      notes: `## The Bulgarian Cyrillic Alphabet

Bulgarian uses the Cyrillic alphabet with 30 letters. Each letter always makes the same sound.

| Letter | Sound | Example |
|--------|-------|---------|
| А а | "a" as in bath | Аз (I) |
| Б б | "b" as in bug | Баща (father) |
| В в | "v" as in vet | Вода (water) |
| Г г | "g" as in good | Град (city) |
| Д д | "d" as in dog | Добре (fine) |
| Е е | "e" as in best | Един (one) |
| Ж ж | "zh" as in treasure | Жена (woman) |
| З з | "z" as in zoo | Здравей (hello) |
| И и | "ee" as in machine | Играя (I play) |
| Й й | "y" as in yes (short) | Майка (mother) |
| К к | "k" as in make | Котка (cat) |
| Л л | "l" as in lend | Лимон (lemon) |
| М м | "m" as in man | Майка (mother) |
| Н н | "n" as in no | Нощ (night) |
| О о | "o" as in order | Огън (fire) |
| П п | "p" as in pet | Писмо (letter) |
| Р р | trilled r | Риба (fish) |
| С с | "s" as in sound | Супа (soup) |
| Т т | "t" as in top | Такси (taxi) |
| У у | "oo" as in tool | Учител (teacher) |
| Ф ф | "f" as in food | Фен (fan) |
| Х х | "kh" as in loch | Хляб (bread) |
| Ц ц | "ts" as in fits | Цвете (flower) |
| Ч ч | "ch" as in chip | Чай (tea) |
| Ш ш | "sh" as in shot | Шоколад (chocolate) |
| Щ щ | "sht" as in shtick | Щастие (happiness) |
| Ъ ъ | "u" as in turn | Ъгъл (corner) |
| Ь ь | soft sign (softens prev. consonant) | |
| Ю ю | "yu" as in youth | Юли (July) |
| Я я | "ya" as in yard | Яйце (egg) |

## Tips
- No silent letters - every letter is always pronounced
- Cyrillic looks new but many sounds match English
- А, Е, К, М, О, Т look like Latin letters but some have different sounds (В = v, Н = n, Р = r, С = s, У = oo, Х = kh)`,

      lessons: [
        {
          id: 'alph-1',
          title: 'А to Д',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'alph-1-i1', label: 'NEW LETTER', display: 'А', sublabel: '"a" as in "bath"', tts: 'А' },
            { type: 'multiple_choice', id: 'alph-1-mc1', question: 'What sound does А make?', choices: ['"a" as in bath', '"b" as in bug', '"g" as in good'], answer: '"a" as in bath', tts: 'А' },
            { type: 'introduce', id: 'alph-1-i2', label: 'NEW LETTER', display: 'Б', sublabel: '"b" as in "bug"', tts: 'Б' },
            { type: 'multiple_choice', id: 'alph-1-mc2', question: 'Which letter makes the "b" sound?', choices: ['Б', 'А', 'Г'], answer: 'Б', tts: 'Б' },
            { type: 'introduce', id: 'alph-1-i3', label: 'NEW LETTER', display: 'В', sublabel: '"v" as in "vet"', tts: 'В' },
            { type: 'multiple_choice', id: 'alph-1-mc3', question: 'What sound does В make?', choices: ['"v" as in vet', '"b" as in bug', '"d" as in dog'], answer: '"v" as in vet', tts: 'В' },
            { type: 'match_pairs', id: 'alph-1-mp0', instruction: 'Quick check — match the letters you just learned:', pairs: [{ left: 'А', right: 'a' }, { left: 'Б', right: 'b' }, { left: 'В', right: 'v' }] },
            { type: 'introduce', id: 'alph-1-i4', label: 'NEW LETTER', display: 'Г', sublabel: '"g" as in "good"', tts: 'Г' },
            { type: 'multiple_choice', id: 'alph-1-mc4', question: 'Which letter makes the "g" sound?', choices: ['Г', 'В', 'Б'], answer: 'Г', tts: 'Г' },
            { type: 'introduce', id: 'alph-1-i5', label: 'NEW LETTER', display: 'Д', sublabel: '"d" as in "dog"', tts: 'Д' },
            { type: 'multiple_choice', id: 'alph-1-mc5', question: 'What sound does Д make?', choices: ['"d" as in dog', '"g" as in good', '"v" as in vet'], answer: '"d" as in dog', tts: 'Д' },
            { type: 'match_pairs', id: 'alph-1-mp1', instruction: 'Match each letter to its sound:', pairs: [{ left: 'А', right: 'a' }, { left: 'Б', right: 'b' }, { left: 'В', right: 'v' }, { left: 'Г', right: 'g' }] },
            { type: 'listen_and_type', id: 'alph-1-lat1', tts: 'Аз', answer: 'Аз' },
            { type: 'speak_sentence', id: 'alph-1-sp1', tts: 'Баща' },
          ],
        },
        {
          id: 'alph-2',
          title: 'Е to Й',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'alph-2-i1', label: 'NEW LETTER', display: 'Е', sublabel: '"e" as in "best"', tts: 'Е' },
            { type: 'multiple_choice', id: 'alph-2-mc1', question: 'What sound does Е make?', choices: ['"e" as in best', '"ee" as in machine', '"a" as in bath'], answer: '"e" as in best', tts: 'Е' },
            { type: 'introduce', id: 'alph-2-i2', label: 'NEW LETTER', display: 'Ж', sublabel: '"zh" like the "s" in "treasure"', tts: 'Ж' },
            { type: 'multiple_choice', id: 'alph-2-mc2', question: 'Which letter makes the "zh" sound (like "s" in "treasure")?', choices: ['Ж', 'З', 'Е'], answer: 'Ж', tts: 'Ж' },
            { type: 'introduce', id: 'alph-2-i3', label: 'NEW LETTER', display: 'З', sublabel: '"z" as in "zoo"', tts: 'З' },
            { type: 'multiple_choice', id: 'alph-2-mc3', question: 'What sound does З make?', choices: ['"z" as in zoo', '"zh" as in treasure', '"s" as in sound'], answer: '"z" as in zoo', tts: 'З' },
            { type: 'match_pairs', id: 'alph-2-mp0', instruction: 'Quick check — match the letters you just learned:', pairs: [{ left: 'Е', right: 'e' }, { left: 'Ж', right: 'zh' }, { left: 'З', right: 'z' }] },
            { type: 'introduce', id: 'alph-2-i4', label: 'NEW LETTER', display: 'И', sublabel: '"ee" as in "machine"', tts: 'И' },
            { type: 'multiple_choice', id: 'alph-2-mc4', question: 'Which letter makes the "ee" sound?', choices: ['И', 'Е', 'Й'], answer: 'И', tts: 'И' },
            { type: 'introduce', id: 'alph-2-i5', label: 'NEW LETTER', display: 'Й', sublabel: '"y" as in "yes" (a short glide)', tts: 'Й' },
            { type: 'multiple_choice', id: 'alph-2-mc5', question: 'What sound does Й make?', choices: ['"y" as in yes', '"ee" as in machine', '"e" as in best'], answer: '"y" as in yes', tts: 'Й' },
            { type: 'match_pairs', id: 'alph-2-mp1', instruction: 'Match each letter to its sound:', pairs: [{ left: 'Е', right: 'e' }, { left: 'Ж', right: 'zh' }, { left: 'З', right: 'z' }, { left: 'И', right: 'ee' }] },
            { type: 'listen_and_type', id: 'alph-2-lat1', tts: 'Жена', answer: 'Жена' },
            { type: 'speak_sentence', id: 'alph-2-sp1', tts: 'Здравей' },
          ],
        },
        {
          id: 'alph-3',
          title: 'К to О',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'alph-3-i1', label: 'NEW LETTER', display: 'К', sublabel: '"k" as in "make"', tts: 'К' },
            { type: 'multiple_choice', id: 'alph-3-mc1', question: 'Which letter makes the "k" sound?', choices: ['К', 'Г', 'Д'], answer: 'К', tts: 'К' },
            { type: 'introduce', id: 'alph-3-i2', label: 'NEW LETTER', display: 'Л', sublabel: '"l" as in "lend"', tts: 'Л' },
            { type: 'multiple_choice', id: 'alph-3-mc2', question: 'What sound does Л make?', choices: ['"l" as in lend', '"n" as in no', '"m" as in man'], answer: '"l" as in lend', tts: 'Л' },
            { type: 'introduce', id: 'alph-3-i3', label: 'NEW LETTER', display: 'М', sublabel: '"m" as in "man"', tts: 'М' },
            { type: 'multiple_choice', id: 'alph-3-mc3', question: 'Which letter makes the "m" sound?', choices: ['М', 'Н', 'Л'], answer: 'М', tts: 'М' },
            { type: 'match_pairs', id: 'alph-3-mp0', instruction: 'Quick check — match the letters you just learned:', pairs: [{ left: 'К', right: 'k' }, { left: 'Л', right: 'l' }, { left: 'М', right: 'm' }] },
            { type: 'introduce', id: 'alph-3-i4', label: 'NEW LETTER', display: 'Н', sublabel: '"n" as in "no"', tts: 'Н' },
            { type: 'multiple_choice', id: 'alph-3-mc4', question: 'What sound does Н make?', choices: ['"n" as in no', '"m" as in man', '"l" as in lend'], answer: '"n" as in no', tts: 'Н' },
            { type: 'introduce', id: 'alph-3-i5', label: 'NEW LETTER', display: 'О', sublabel: '"o" as in "order"', tts: 'О' },
            { type: 'multiple_choice', id: 'alph-3-mc5', question: 'Which letter makes the "o" sound (as in "order")?', choices: ['О', 'У', 'А'], answer: 'О', tts: 'О' },
            { type: 'match_pairs', id: 'alph-3-mp1', instruction: 'Match each letter to its sound:', pairs: [{ left: 'К', right: 'k' }, { left: 'Л', right: 'l' }, { left: 'М', right: 'm' }, { left: 'Н', right: 'n' }] },
            { type: 'listen_and_type', id: 'alph-3-lat1', tts: 'Котка', answer: 'Котка' },
            { type: 'speak_sentence', id: 'alph-3-sp1', tts: 'Лимон' },
          ],
        },
        {
          id: 'alph-4',
          title: 'П to У',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'alph-4-i1', label: 'NEW LETTER', display: 'П', sublabel: '"p" as in "pet"', tts: 'П' },
            { type: 'multiple_choice', id: 'alph-4-mc1', question: 'What sound does П make?', choices: ['"p" as in pet', '"b" as in bug', '"t" as in top'], answer: '"p" as in pet', tts: 'П' },
            { type: 'introduce', id: 'alph-4-i2', label: 'NEW LETTER', display: 'Р', sublabel: 'trilled "r" (like in Spanish)', tts: 'Р' },
            { type: 'multiple_choice', id: 'alph-4-mc2', question: 'Р is a trilled "r". Which letter is it?', choices: ['Р', 'П', 'С'], answer: 'Р', tts: 'Р' },
            { type: 'introduce', id: 'alph-4-i3', label: 'NEW LETTER', display: 'С', sublabel: '"s" as in "sound"', tts: 'С' },
            { type: 'multiple_choice', id: 'alph-4-mc3', question: 'What sound does С make?', choices: ['"s" as in sound', '"z" as in zoo', '"sh" as in shot'], answer: '"s" as in sound', tts: 'С' },
            { type: 'match_pairs', id: 'alph-4-mp0', instruction: 'Quick check — match the letters you just learned:', pairs: [{ left: 'П', right: 'p' }, { left: 'Р', right: 'r' }, { left: 'С', right: 's' }] },
            { type: 'introduce', id: 'alph-4-i4', label: 'NEW LETTER', display: 'Т', sublabel: '"t" as in "top"', tts: 'Т' },
            { type: 'multiple_choice', id: 'alph-4-mc4', question: 'Which letter makes the "t" sound?', choices: ['Т', 'Д', 'С'], answer: 'Т', tts: 'Т' },
            { type: 'introduce', id: 'alph-4-i5', label: 'NEW LETTER', display: 'У', sublabel: '"oo" as in "tool"', tts: 'У' },
            { type: 'multiple_choice', id: 'alph-4-mc5', question: 'What sound does У make?', choices: ['"oo" as in tool', '"o" as in order', '"u" as in cup'], answer: '"oo" as in tool', tts: 'У' },
            { type: 'match_pairs', id: 'alph-4-mp1', instruction: 'Match each letter to its sound:', pairs: [{ left: 'П', right: 'p' }, { left: 'Р', right: 'r' }, { left: 'С', right: 's' }, { left: 'Т', right: 't' }] },
            { type: 'listen_and_type', id: 'alph-4-lat1', tts: 'Супа', answer: 'Супа' },
            { type: 'speak_sentence', id: 'alph-4-sp1', tts: 'Риба' },
          ],
        },
        {
          id: 'alph-5',
          title: 'Ф to Ш',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'alph-5-i1', label: 'NEW LETTER', display: 'Ф', sublabel: '"f" as in "food"', tts: 'Ф' },
            { type: 'multiple_choice', id: 'alph-5-mc1', question: 'Which letter makes the "f" sound?', choices: ['Ф', 'В', 'Х'], answer: 'Ф', tts: 'Ф' },
            { type: 'introduce', id: 'alph-5-i2', label: 'NEW LETTER', display: 'Х', sublabel: '"kh" like the "ch" in Scottish "loch"', tts: 'Х' },
            { type: 'multiple_choice', id: 'alph-5-mc2', question: 'What sound does Х make?', choices: ['"kh" as in loch', '"f" as in food', '"h" as in hat'], answer: '"kh" as in loch', tts: 'Х' },
            { type: 'introduce', id: 'alph-5-i3', label: 'NEW LETTER', display: 'Ц', sublabel: '"ts" as in "fits"', tts: 'Ц' },
            { type: 'multiple_choice', id: 'alph-5-mc3', question: 'Which letter makes the "ts" sound (as in "fits")?', choices: ['Ц', 'Ч', 'С'], answer: 'Ц', tts: 'Ц' },
            { type: 'match_pairs', id: 'alph-5-mp0', instruction: 'Quick check — match the letters you just learned:', pairs: [{ left: 'Ф', right: 'f' }, { left: 'Х', right: 'kh' }, { left: 'Ц', right: 'ts' }] },
            { type: 'introduce', id: 'alph-5-i4', label: 'NEW LETTER', display: 'Ч', sublabel: '"ch" as in "chip"', tts: 'Ч' },
            { type: 'multiple_choice', id: 'alph-5-mc4', question: 'What sound does Ч make?', choices: ['"ch" as in chip', '"ts" as in fits', '"sh" as in shot'], answer: '"ch" as in chip', tts: 'Ч' },
            { type: 'introduce', id: 'alph-5-i5', label: 'NEW LETTER', display: 'Ш', sublabel: '"sh" as in "shot"', tts: 'Ш' },
            { type: 'multiple_choice', id: 'alph-5-mc5', question: 'Which letter makes the "sh" sound?', choices: ['Ш', 'Щ', 'Ж'], answer: 'Ш', tts: 'Ш' },
            { type: 'match_pairs', id: 'alph-5-mp1', instruction: 'Match each letter to its sound:', pairs: [{ left: 'Ф', right: 'f' }, { left: 'Х', right: 'kh' }, { left: 'Ц', right: 'ts' }, { left: 'Ч', right: 'ch' }] },
            { type: 'listen_and_type', id: 'alph-5-lat1', tts: 'Чай', answer: 'Чай' },
            { type: 'speak_sentence', id: 'alph-5-sp1', tts: 'Хляб' },
          ],
        },
        {
          id: 'alph-6',
          title: 'Щ to Я',
          xp: 15,
          exercises: [
            { type: 'introduce', id: 'alph-6-i1', label: 'NEW LETTER', display: 'Щ', sublabel: '"sht" as in "shtick"', tts: 'Щ' },
            { type: 'multiple_choice', id: 'alph-6-mc1', question: 'What sound does Щ make?', choices: ['"sht" as in shtick', '"sh" as in shot', '"ch" as in chip'], answer: '"sht" as in shtick', tts: 'Щ' },
            { type: 'introduce', id: 'alph-6-i2', label: 'NEW LETTER', display: 'Ъ', sublabel: '"u" as in "turn" - short unstressed vowel', tts: 'Ъ' },
            { type: 'multiple_choice', id: 'alph-6-mc2', question: 'Which letter makes the "u as in turn" sound?', choices: ['Ъ', 'У', 'А'], answer: 'Ъ', tts: 'Ъ' },
            { type: 'introduce', id: 'alph-6-i3', label: 'NEW LETTER', display: 'Ь', sublabel: 'soft sign - makes the consonant before it softer, no sound of its own', tts: 'Ь' },
            { type: 'multiple_choice', id: 'alph-6-mc-soft', question: 'What does the soft sign Ь do?', choices: ['Softens the consonant before it', 'Makes a "y" sound', 'Acts like a vowel'], answer: 'Softens the consonant before it' },
            { type: 'match_pairs', id: 'alph-6-mp0', instruction: 'Quick check — these tricky letters all look similar. Match them:', pairs: [{ left: 'Щ', right: 'sht' }, { left: 'Ш', right: 'sh' }, { left: 'Ж', right: 'zh' }, { left: 'Ъ', right: 'u (turn)' }] },
            { type: 'introduce', id: 'alph-6-i4', label: 'NEW LETTER', display: 'Ю', sublabel: '"yu" as in "youth"', tts: 'Ю' },
            { type: 'multiple_choice', id: 'alph-6-mc3', question: 'What sound does Ю make?', choices: ['"yu" as in youth', '"ya" as in yard', '"y" as in yes'], answer: '"yu" as in youth', tts: 'Ю' },
            { type: 'introduce', id: 'alph-6-i5', label: 'NEW LETTER', display: 'Я', sublabel: '"ya" as in "yard"', tts: 'Я' },
            { type: 'multiple_choice', id: 'alph-6-mc4', question: 'Which letter makes the "ya" sound?', choices: ['Я', 'Ю', 'Й'], answer: 'Я', tts: 'Я' },
            { type: 'match_pairs', id: 'alph-6-mp1', instruction: 'Match each letter to its sound:', pairs: [{ left: 'Щ', right: 'sht' }, { left: 'Ъ', right: 'u (turn)' }, { left: 'Ю', right: 'yu' }, { left: 'Я', right: 'ya' }] },
            { type: 'listen_and_type', id: 'alph-6-lat1', tts: 'Яйце', answer: 'Яйце' },
            { type: 'speak_sentence', id: 'alph-6-sp1', tts: 'Щастие' },
            { type: 'match_pairs', id: 'alph-6-mp2', instruction: 'Grand review - tricky letters:', pairs: [{ left: 'Ж', right: 'zh' }, { left: 'Ц', right: 'ts' }, { left: 'Щ', right: 'sht' }, { left: 'Й', right: 'y' }] },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    {
      id: 'greetings',
      title: 'Hello!',
      subtitle: 'Greet people and introduce yourself',
      color: '#58cc02',
      icon: 'Здр!',
      notes: `## Greetings

| Bulgarian | English | When to use |
|-----------|---------|-------------|
| Здравей! | Hello! | informal, one person |
| Здравейте! | Hello! | formal or plural |
| Как си? | How are you? | informal |
| Как сте? | How are you? | formal/plural |
| Добре съм | I am fine | reply to "how are you?" |
| Добро утро | Good morning | until about noon |
| Добър ден | Good afternoon | midday onwards |
| Добър вечер | Good evening | in the evening |
| Лека нощ | Good night | before sleeping |
| Довиждане | Goodbye | formal |
| Чао | Bye | informal |

## Introductions

- **Как се казваш?** - What is your name? (informal)
- **Казвам се...** - My name is...
- **Приятно ми е** - Nice to meet you

## Politeness

- **Моля** - Please / You're welcome
- **Благодаря** - Thank you
- **Извинете** - Excuse me (formal)
- **Съжалявам** - I'm sorry`,

      lessons: [
        {
          id: 'greet-1',
          title: 'First Hellos',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'greet-1-i1', label: 'NEW WORD', display: 'Здравей!', sublabel: 'informal hello to one person', translation: 'Hello!', tts: 'Здравей' },
            { type: 'introduce', id: 'greet-1-i2', label: 'NEW WORD', display: 'Здравейте!', sublabel: 'formal hello, or to a group', translation: 'Hello!', tts: 'Здравейте' },
            { type: 'multiple_choice', id: 'greet-1-mc1', question: 'Which is the informal hello to one person?', choices: ['Здравей', 'Здравейте', 'Довиждане'], answer: 'Здравей', tts: 'Здравей' },
            { type: 'listen_and_type', id: 'greet-1-lat0', tts: 'Здравей', answer: 'Здравей' },
            { type: 'introduce', id: 'greet-1-i3', label: 'NEW PHRASE', display: 'Как си?', sublabel: 'informal - ask one friend', translation: 'How are you?', tts: 'Как си' },
            { type: 'introduce', id: 'greet-1-i4', label: 'NEW WORD', display: 'Добре', sublabel: 'used alone or as "Добре съм"', translation: 'Fine / Well', tts: 'Добре' },
            { type: 'multiple_choice', id: 'greet-1-mc2', question: 'What does "Добре" mean?', choices: ['Fine / Well', 'Hello', 'Goodbye', 'Thank you'], answer: 'Fine / Well' },
            { type: 'translate_to_en', id: 'greet-1-tr1', prompt: 'Добре съм', answer: 'I am fine', hint: 'добре = fine, съм = I am', tts: 'Добре съм' },
            { type: 'multiple_choice', id: 'greet-1-mc3', question: 'How do you reply to "Как си?"', choices: ['Добре съм', 'Лека нощ', 'Довиждане', 'Моля'], answer: 'Добре съм', tts: 'Добре съм' },
            { type: 'word_bank', id: 'greet-1-wb1', direction: 'to_en', prompt: 'Добре съм', tts: 'Добре съм', words: ['I', 'am', 'fine', 'hello', 'she', 'good', 'not'], answer: 'I am fine' },
            { type: 'listen_and_type', id: 'greet-1-lat1', tts: 'Здравей', answer: 'Здравей' },
            { type: 'speak_sentence', id: 'greet-1-sp1', tts: 'Добре съм' },
          ],
        },
        {
          id: 'greet-2',
          title: 'Times of Day',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'greet-2-i1', label: 'NEW PHRASE', display: 'Добро утро', sublabel: 'said in the morning', translation: 'Good morning', tts: 'Добро утро' },
            { type: 'introduce', id: 'greet-2-i2', label: 'NEW PHRASE', display: 'Добър ден', sublabel: 'said during the day', translation: 'Good day / Good afternoon', tts: 'Добър ден' },
            { type: 'multiple_choice', id: 'greet-2-mc1', question: 'When would you say "Добро утро"?', choices: ['In the morning', 'At night', 'In the evening', 'At noon'], answer: 'In the morning' },
            { type: 'introduce', id: 'greet-2-i3', label: 'NEW PHRASE', display: 'Добър вечер', sublabel: 'said in the evening', translation: 'Good evening', tts: 'Добър вечер' },
            { type: 'introduce', id: 'greet-2-i4', label: 'NEW PHRASE', display: 'Лека нощ', sublabel: 'said before going to sleep', translation: 'Good night', tts: 'Лека нощ' },
            { type: 'translate_to_en', id: 'greet-2-tr1', prompt: 'Добър вечер', answer: 'Good evening', tts: 'Добър вечер' },
            { type: 'translate_to_en', id: 'greet-2-tr2', prompt: 'Лека нощ', answer: 'Good night', tts: 'Лека нощ' },
            { type: 'match_pairs', id: 'greet-2-mp1', instruction: 'Match each greeting to its meaning:', pairs: [{ left: 'Добро утро', right: 'Good morning' }, { left: 'Добър ден', right: 'Good afternoon' }, { left: 'Добър вечер', right: 'Good evening' }, { left: 'Лека нощ', right: 'Good night' }] },
            { type: 'word_bank', id: 'greet-2-wb1', direction: 'to_bg', prompt: 'Good morning', words: ['Добро', 'утро', 'Добър', 'ден', 'вечер', 'нощ', 'Лека'], answer: 'Добро утро' },
            { type: 'listen_and_type', id: 'greet-2-lat1', tts: 'Добър вечер', answer: 'Добър вечер' },
            { type: 'speak_sentence', id: 'greet-2-sp1', tts: 'Лека нощ' },
          ],
        },
        {
          id: 'greet-3',
          title: 'What Is Your Name?',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'greet-3-i1', label: 'NEW WORD', display: 'Довиждане', sublabel: 'formal goodbye', translation: 'Goodbye', tts: 'Довиждане' },
            { type: 'introduce', id: 'greet-3-i2', label: 'NEW WORD', display: 'Чао', sublabel: 'informal bye (borrowed from Italian)', translation: 'Bye!', tts: 'Чао' },
            { type: 'multiple_choice', id: 'greet-3-mc0', question: 'How do you say "Goodbye" formally?', choices: ['Довиждане', 'Чао', 'Здравей', 'Здравейте'], answer: 'Довиждане' },
            { type: 'introduce', id: 'greet-3-i3', label: 'NEW PHRASE', display: 'Как се казваш?', sublabel: 'informal - ask one person', translation: 'What is your name?', tts: 'Как се казваш' },
            { type: 'multiple_choice', id: 'greet-3-mc1', question: 'How do you ask someone\'s name informally?', choices: ['Как се казваш?', 'Как си?', 'Имате ли?'], answer: 'Как се казваш?' },
            { type: 'introduce', id: 'greet-3-i4', label: 'NEW PHRASE', display: 'Казвам се...', sublabel: 'complete with your name', translation: 'My name is...', tts: 'Казвам се' },
            { type: 'introduce', id: 'greet-3-i5', label: 'NEW PHRASE', display: 'Приятно ми е', sublabel: 'said when meeting someone', translation: 'Nice to meet you', tts: 'Приятно ми е' },
            { type: 'translate_to_en', id: 'greet-3-tr1', prompt: 'Казвам се Мария', answer: 'My name is Maria', tts: 'Казвам се Мария' },
            { type: 'fill_blank', id: 'greet-3-fb1', sentence: 'Казвам ___ Петър.', answer: 'се', hint: '"Казвам се" = My name is' },
            { type: 'word_bank', id: 'greet-3-wb1', direction: 'to_en', prompt: 'Казвам се Иван', tts: 'Казвам се Иван', words: ['My', 'name', 'is', 'Ivan', 'I', 'am', 'called', 'she'], answer: 'My name is Ivan' },
            { type: 'translate_to_en', id: 'greet-3-tr2', prompt: 'Приятно ми е', answer: 'Nice to meet you', tts: 'Приятно ми е' },
            { type: 'speak_sentence', id: 'greet-3-sp1', tts: 'Приятно ми е' },
            { type: 'listen_and_type', id: 'greet-3-lat1', tts: 'Довиждане', answer: 'Довиждане' },
          ],
        },
        {
          id: 'greet-4',
          title: 'Please and Thank You',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'greet-4-i1', label: 'NEW WORD', display: 'Моля', sublabel: '"Please" when asking, "You\'re welcome" when replying', translation: 'Please / You\'re welcome', tts: 'Моля' },
            { type: 'introduce', id: 'greet-4-i2', label: 'NEW WORD', display: 'Благодаря', sublabel: 'the standard "thank you"', translation: 'Thank you', tts: 'Благодаря' },
            { type: 'multiple_choice', id: 'greet-4-mc1', question: 'What does "Благодаря" mean?', choices: ['Thank you', 'Sorry', 'Please', 'Goodbye'], answer: 'Thank you' },
            { type: 'introduce', id: 'greet-4-i3', label: 'NEW WORD', display: 'Извинете', sublabel: 'formal - use with strangers', translation: 'Excuse me', tts: 'Извинете' },
            { type: 'introduce', id: 'greet-4-i4', label: 'NEW WORD', display: 'Съжалявам', sublabel: 'when you did something wrong', translation: 'I\'m sorry', tts: 'Съжалявам' },
            { type: 'multiple_choice', id: 'greet-4-mc2', question: 'How do you say "Excuse me" formally?', choices: ['Извинете', 'Съжалявам', 'Моля', 'Благодаря'], answer: 'Извинете' },
            { type: 'translate_to_en', id: 'greet-4-tr1', prompt: 'Благодаря много', answer: 'Thank you very much', hint: 'много = very much / a lot', tts: 'Благодаря много' },
            { type: 'match_pairs', id: 'greet-4-mp1', instruction: 'Match each word to its meaning:', pairs: [{ left: 'Моля', right: 'Please' }, { left: 'Благодаря', right: 'Thank you' }, { left: 'Извинете', right: 'Excuse me' }, { left: 'Съжалявам', right: 'I\'m sorry' }] },
            { type: 'word_bank', id: 'greet-4-wb1', direction: 'to_bg', prompt: 'Thank you', words: ['Благодаря', 'Моля', 'Съжалявам', 'Извинете', 'Здравей', 'Добре'], answer: 'Благодаря' },
            { type: 'listen_translate', id: 'greet-4-lt1', tts: 'Съжалявам', answer: 'I am sorry' },
            { type: 'speak_sentence', id: 'greet-4-sp1', tts: 'Благодаря' },
          ],
        },
        {
          id: 'greet-5',
          title: 'Putting It Together',
          xp: 15,
          exercises: [
            { type: 'multiple_choice', id: 'greet-5-mc1', question: 'How do you say "Good evening"?', choices: ['Добър вечер', 'Добро утро', 'Лека нощ', 'Добър ден'], answer: 'Добър вечер', tts: 'Добър вечер' },
            { type: 'translate_to_en', id: 'greet-5-tr1', prompt: 'Здравей, как си?', answer: 'Hello, how are you?', tts: 'Здравей, как си' },
            { type: 'translate_to_en', id: 'greet-5-tr2', prompt: 'Приятно ми е', answer: 'Nice to meet you', tts: 'Приятно ми е' },
            { type: 'match_pairs', id: 'greet-5-mp1', instruction: 'Match each phrase to its meaning:', pairs: [{ left: 'Здравей', right: 'Hello (informal)' }, { left: 'Довиждане', right: 'Goodbye' }, { left: 'Моля', right: 'Please' }, { left: 'Благодаря', right: 'Thank you' }] },
            { type: 'word_bank', id: 'greet-5-wb1', direction: 'to_en', prompt: 'Казвам се Анна', tts: 'Казвам се Анна', words: ['My', 'name', 'is', 'Anna', 'I', 'am', 'hello', 'she'], answer: 'My name is Anna' },
            { type: 'translate_to_bg', id: 'greet-5-tb1', prompt: 'Good morning', answer: 'Добро утро' },
            { type: 'translate_to_bg', id: 'greet-5-tb2', prompt: 'I am sorry', answer: 'Съжалявам' },
            { type: 'fill_blank', id: 'greet-5-fb1', sentence: 'Казвам ___ Иван.', answer: 'се', hint: '"Казвам се" = My name is' },
            { type: 'listen_translate', id: 'greet-5-lt1', tts: 'Благодаря', answer: 'Thank you' },
            { type: 'listen_translate', id: 'greet-5-lt2', tts: 'Добро утро', answer: 'Good morning' },
            { type: 'speak_sentence', id: 'greet-5-sp1', tts: 'Здравейте' },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    {
      id: 'town',
      title: 'Around Town',
      subtitle: 'Places, transport and directions',
      color: '#ff9600',
      icon: '🏙',
      notes: `## Places in the City

| Bulgarian | English |
|-----------|---------|
| хотел | hotel |
| ресторант | restaurant |
| магазин | shop / store |
| аптека | pharmacy |
| болница | hospital |
| банка | bank |
| гара | train station |

## Transport

| Bulgarian | English |
|-----------|---------|
| автобус | bus |
| метро | metro / subway |
| такси | taxi |
| спирка | stop (bus/tram) |
| билет | ticket |

## Directions

- **вляво** - to the left
- **вдясно** - to the right
- **направо** - straight ahead
- **близо** - near / close
- **далеч** - far

## Useful Phrases

- **Извинете, къде е...?** - Excuse me, where is...?
- **Как да стигна до...?** - How do I get to...?
- **Колко струва?** - How much does it cost?
- **Имате ли...?** - Do you have...?`,

      lessons: [
        {
          id: 'town-1',
          title: 'Places in the City',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'town-1-i1', label: 'NEW WORD', display: 'хотел', sublabel: 'masculine noun', translation: 'hotel', tts: 'хотел' },
            { type: 'introduce', id: 'town-1-i2', label: 'NEW WORD', display: 'ресторант', sublabel: 'masculine noun', translation: 'restaurant', tts: 'ресторант' },
            { type: 'multiple_choice', id: 'town-1-mc1', question: 'What does "ресторант" mean?', choices: ['restaurant', 'hotel', 'pharmacy', 'shop'], answer: 'restaurant' },
            { type: 'listen_and_type', id: 'town-1-lat0', tts: 'хотел', answer: 'хотел' },
            { type: 'introduce', id: 'town-1-i3', label: 'NEW WORD', display: 'магазин', sublabel: 'masculine noun', translation: 'shop / store', tts: 'магазин' },
            { type: 'introduce', id: 'town-1-i4', label: 'NEW WORD', display: 'аптека', sublabel: 'feminine noun (ends in -а)', translation: 'pharmacy', tts: 'аптека' },
            { type: 'multiple_choice', id: 'town-1-mc2', question: 'You need medicine. Where do you go?', choices: ['аптека', 'болница', 'хотел', 'ресторант'], answer: 'аптека' },
            { type: 'introduce', id: 'town-1-i5', label: 'NEW WORD', display: 'болница', sublabel: 'feminine noun (ends in -а)', translation: 'hospital', tts: 'болница' },
            { type: 'translate_to_en', id: 'town-1-tr1', prompt: 'Това е болница', answer: 'This is a hospital', hint: 'това = this, е = is', tts: 'Това е болница' },
            { type: 'translate_to_en', id: 'town-1-tr2', prompt: 'Има ли хотел тук?', answer: 'Is there a hotel here?', hint: 'Има ли = Is there, тук = here', tts: 'Има ли хотел тук' },
            { type: 'match_pairs', id: 'town-1-mp1', instruction: 'Match the word to its meaning:', pairs: [{ left: 'хотел', right: 'hotel' }, { left: 'магазин', right: 'shop' }, { left: 'аптека', right: 'pharmacy' }, { left: 'болница', right: 'hospital' }] },
            { type: 'speak_sentence', id: 'town-1-sp1', tts: 'Има ли аптека тук' },
            { type: 'listen_and_type', id: 'town-1-lat1', tts: 'ресторант', answer: 'ресторант' },
          ],
        },
        {
          id: 'town-2',
          title: 'Getting Around',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'town-2-i1', label: 'NEW WORD', display: 'автобус', sublabel: 'masculine noun', translation: 'bus', tts: 'автобус' },
            { type: 'introduce', id: 'town-2-i2', label: 'NEW WORD', display: 'метро', sublabel: 'neuter noun (ends in -о)', translation: 'metro / subway', tts: 'метро' },
            { type: 'multiple_choice', id: 'town-2-mc0', question: 'What does "автобус" mean?', choices: ['bus', 'metro', 'taxi', 'stop'], answer: 'bus', tts: 'автобус' },
            { type: 'introduce', id: 'town-2-i3', label: 'NEW WORD', display: 'спирка', sublabel: 'feminine noun - where you wait for the bus', translation: 'stop (bus/tram)', tts: 'спирка' },
            { type: 'multiple_choice', id: 'town-2-mc1', question: 'What does "спирка" mean?', choices: ['stop / bus stop', 'ticket', 'bus', 'metro'], answer: 'stop / bus stop' },
            { type: 'introduce', id: 'town-2-i4', label: 'NEW WORD', display: 'билет', sublabel: 'masculine noun', translation: 'ticket', tts: 'билет' },
            { type: 'translate_to_en', id: 'town-2-tr1', prompt: 'Искам билет за автобус', answer: 'I want a bus ticket', hint: 'Искам = I want, за = for', tts: 'Искам билет за автобус' },
            { type: 'multiple_choice', id: 'town-2-mc2', question: 'How do you say "ticket"?', choices: ['билет', 'спирка', 'метро', 'автобус'], answer: 'билет' },
            { type: 'match_pairs', id: 'town-2-mp1', instruction: 'Match the transport word:', pairs: [{ left: 'автобус', right: 'bus' }, { left: 'метро', right: 'metro' }, { left: 'такси', right: 'taxi' }, { left: 'билет', right: 'ticket' }] },
            { type: 'word_bank', id: 'town-2-wb1', direction: 'to_en', prompt: 'Искам билет за метро', tts: 'Искам билет за метро', words: ['I', 'want', 'a', 'metro', 'ticket', 'bus', 'taxi', 'for'], answer: 'I want a metro ticket' },
            { type: 'listen_and_type', id: 'town-2-lat1', tts: 'автобус', answer: 'автобус' },
            { type: 'speak_sentence', id: 'town-2-sp1', tts: 'Искам билет за метро' },
          ],
        },
        {
          id: 'town-3',
          title: 'Directions',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'town-3-i1', label: 'NEW WORD', display: 'вляво', sublabel: 'turn or go this way', translation: 'to the left', tts: 'вляво' },
            { type: 'introduce', id: 'town-3-i2', label: 'NEW WORD', display: 'вдясно', sublabel: 'opposite of вляво', translation: 'to the right', tts: 'вдясно' },
            { type: 'multiple_choice', id: 'town-3-mc1', question: 'What does "вдясно" mean?', choices: ['to the right', 'to the left', 'straight ahead', 'near'], answer: 'to the right' },
            { type: 'introduce', id: 'town-3-i3', label: 'NEW WORD', display: 'направо', sublabel: 'keep going without turning', translation: 'straight ahead', tts: 'направо' },
            { type: 'multiple_choice', id: 'town-3-mc2', question: 'Which word means "straight ahead"?', choices: ['направо', 'вляво', 'вдясно', 'близо'], answer: 'направо' },
            { type: 'introduce', id: 'town-3-i4', label: 'NEW WORD', display: 'близо', sublabel: 'not far away', translation: 'near / close', tts: 'близо' },
            { type: 'introduce', id: 'town-3-i5', label: 'NEW WORD', display: 'далеч', sublabel: 'opposite of близо', translation: 'far', tts: 'далеч' },
            { type: 'translate_to_en', id: 'town-3-tr1', prompt: 'Хотелът е близо', answer: 'The hotel is near', hint: 'Хотелът = the hotel, е = is', tts: 'Хотелът е близо' },
            { type: 'match_pairs', id: 'town-3-mp1', instruction: 'Match the direction word:', pairs: [{ left: 'вляво', right: 'left' }, { left: 'вдясно', right: 'right' }, { left: 'направо', right: 'straight' }, { left: 'близо', right: 'near' }] },
            { type: 'word_bank', id: 'town-3-wb1', direction: 'to_bg', prompt: 'The pharmacy is to the right', words: ['Аптеката', 'е', 'вдясно', 'вляво', 'далеч', 'болница', 'близо'], answer: 'Аптеката е вдясно' },
            { type: 'speak_sentence', id: 'town-3-sp1', tts: 'Направо, след това вляво' },
          ],
        },
        {
          id: 'town-4',
          title: 'Asking for Help',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'town-4-i1', label: 'NEW PHRASE', display: 'Извинете, къде е...?', sublabel: 'start with "Извинете" to be polite', translation: 'Excuse me, where is...?', tts: 'Извинете, къде е ресторантът' },
            { type: 'introduce', id: 'town-4-i2', label: 'NEW PHRASE', display: 'Как да стигна до...?', sublabel: 'ask for step-by-step directions', translation: 'How do I get to...?', tts: 'Как да стигна до хотела' },
            { type: 'multiple_choice', id: 'town-4-mc1', question: 'What does "Как да стигна до...?" mean?', choices: ['How do I get to...?', 'Where is...?', 'How much does it cost?', 'Do you have...?'], answer: 'How do I get to...?' },
            { type: 'introduce', id: 'town-4-i3', label: 'NEW PHRASE', display: 'Колко струва?', sublabel: 'ask about price', translation: 'How much does it cost?', tts: 'Колко струва' },
            { type: 'introduce', id: 'town-4-i4', label: 'NEW PHRASE', display: 'Имате ли...?', sublabel: 'ask if something is available', translation: 'Do you have...?', tts: 'Имате ли билети' },
            { type: 'translate_to_en', id: 'town-4-tr1', prompt: 'Колко струва билетът?', answer: 'How much does the ticket cost?', hint: 'Колко = how much, струва = costs, билетът = the ticket', tts: 'Колко струва билетът' },
            { type: 'multiple_choice', id: 'town-4-mc2', question: 'You want to know the price. What do you ask?', choices: ['Колко струва?', 'Извинете, къде е?', 'Имате ли?', 'Как да стигна?'], answer: 'Колко струва?' },
            { type: 'translate_to_en', id: 'town-4-tr2', prompt: 'Извинете, къде е аптеката?', answer: 'Excuse me, where is the pharmacy?', hint: 'аптеката = the pharmacy', tts: 'Извинете, къде е аптеката' },
            { type: 'word_bank', id: 'town-4-wb1', direction: 'to_en', prompt: 'Имате ли билети?', tts: 'Имате ли билети', words: ['Do', 'you', 'have', 'tickets', 'a', 'ticket', 'the', 'where'], answer: 'Do you have tickets' },
            { type: 'listen_translate', id: 'town-4-lt1', tts: 'Колко струва', answer: 'How much does it cost' },
            { type: 'speak_sentence', id: 'town-4-sp1', tts: 'Извинете, къде е хотелът' },
          ],
        },
        {
          id: 'town-5',
          title: 'City Review',
          xp: 15,
          exercises: [
            { type: 'multiple_choice', id: 'town-5-mc1', question: 'Where do you buy medicine?', choices: ['аптека', 'болница', 'хотел', 'магазин'], answer: 'аптека' },
            { type: 'translate_to_en', id: 'town-5-tr1', prompt: 'Автобусът е далеч', answer: 'The bus is far', hint: 'Автобусът = the bus', tts: 'Автобусът е далеч' },
            { type: 'translate_to_bg', id: 'town-5-tb1', prompt: 'The restaurant is straight ahead', answer: 'Ресторантът е направо' },
            { type: 'match_pairs', id: 'town-5-mp1', instruction: 'Match the place to its meaning:', pairs: [{ left: 'хотел', right: 'hotel' }, { left: 'болница', right: 'hospital' }, { left: 'гара', right: 'station' }, { left: 'магазин', right: 'shop' }] },
            { type: 'word_bank', id: 'town-5-wb1', direction: 'to_en', prompt: 'Извинете, къде е метрото?', tts: 'Извинете, къде е метрото', words: ['Excuse', 'me', 'where', 'is', 'the', 'metro', 'bus', 'taxi'], answer: 'Excuse me where is the metro' },
            { type: 'fill_blank', id: 'town-5-fb1', sentence: 'Хотелът е ___, не далеч.', answer: 'близо', hint: 'near = ??' },
            { type: 'listen_translate', id: 'town-5-lt1', tts: 'Как да стигна до болницата', answer: 'How do I get to the hospital' },
            { type: 'translate_to_en', id: 'town-5-tr2', prompt: 'Вземете автобус вдясно', answer: 'Take the bus to the right', hint: 'Вземете = take', tts: 'Вземете автобус вдясно' },
            { type: 'listen_translate', id: 'town-5-lt2', tts: 'Имате ли билети', answer: 'Do you have tickets' },
            { type: 'speak_sentence', id: 'town-5-sp1', tts: 'Колко струва билетът' },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    {
      id: 'food',
      title: 'At the Table',
      subtitle: 'Order food and drinks',
      color: '#ff4b4b',
      icon: '🍽',
      notes: `## Drinks

| Bulgarian | English |
|-----------|---------|
| вода | water |
| кафе | coffee |
| чай | tea |
| бира | beer |
| вино | wine |
| сок | juice |

## Food

| Bulgarian | English |
|-----------|---------|
| хляб | bread |
| месо | meat |
| риба | fish |
| салата | salad |
| супа | soup |
| десерт | dessert |

## Numbers 1-10

едно, две, три, четири, пет, шест, седем, осем, девет, десет

## Ordering Phrases

- **Искам...** - I want...
- **Бих искал/а...** - I would like... (m/f)
- **Сметката, моля** - The bill, please
- **Вкусно е!** - It is delicious!
- **Още едно, моля** - One more, please`,

      lessons: [
        {
          id: 'food-1',
          title: 'Drinks',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'food-1-i1', label: 'NEW WORD', display: 'вода', sublabel: 'feminine noun (ends in -а)', translation: 'water', tts: 'вода' },
            { type: 'introduce', id: 'food-1-i2', label: 'NEW WORD', display: 'кафе', sublabel: 'neuter noun (ends in -е)', translation: 'coffee', tts: 'кафе' },
            { type: 'multiple_choice', id: 'food-1-mc1', question: 'What does "вода" mean?', choices: ['water', 'wine', 'coffee', 'juice'], answer: 'water' },
            { type: 'listen_and_type', id: 'food-1-lat0', tts: 'кафе', answer: 'кафе' },
            { type: 'introduce', id: 'food-1-i3', label: 'NEW WORD', display: 'чай', sublabel: 'masculine noun', translation: 'tea', tts: 'чай' },
            { type: 'multiple_choice', id: 'food-1-mc2', question: 'How do you say "tea"?', choices: ['чай', 'кафе', 'бира', 'сок'], answer: 'чай' },
            { type: 'introduce', id: 'food-1-i4', label: 'NEW WORD', display: 'бира', sublabel: 'feminine noun (ends in -а)', translation: 'beer', tts: 'бира' },
            { type: 'introduce', id: 'food-1-i5', label: 'NEW WORD', display: 'вино', sublabel: 'neuter noun (ends in -о)', translation: 'wine', tts: 'вино' },
            { type: 'translate_to_en', id: 'food-1-tr1', prompt: 'Искам вода, моля', answer: 'I want water, please', hint: 'Искам = I want, моля = please', tts: 'Искам вода, моля' },
            { type: 'match_pairs', id: 'food-1-mp1', instruction: 'Match the drink to its meaning:', pairs: [{ left: 'вода', right: 'water' }, { left: 'кафе', right: 'coffee' }, { left: 'бира', right: 'beer' }, { left: 'вино', right: 'wine' }] },
            { type: 'word_bank', id: 'food-1-wb1', direction: 'to_bg', prompt: 'I want tea, please', words: ['Искам', 'чай', 'моля', 'вода', 'кафе', 'бира', 'вино'], answer: 'Искам чай моля' },
            { type: 'listen_and_type', id: 'food-1-lat1', tts: 'кафе', answer: 'кафе' },
            { type: 'speak_sentence', id: 'food-1-sp1', tts: 'Искам вода моля' },
          ],
        },
        {
          id: 'food-2',
          title: 'Food',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'food-2-i1', label: 'NEW WORD', display: 'хляб', sublabel: 'masculine noun', translation: 'bread', tts: 'хляб' },
            { type: 'introduce', id: 'food-2-i2', label: 'NEW WORD', display: 'месо', sublabel: 'neuter noun (ends in -о)', translation: 'meat', tts: 'месо' },
            { type: 'multiple_choice', id: 'food-2-mc1', question: 'What does "хляб" mean?', choices: ['bread', 'meat', 'fish', 'soup'], answer: 'bread' },
            { type: 'introduce', id: 'food-2-i3', label: 'NEW WORD', display: 'риба', sublabel: 'feminine noun (ends in -а)', translation: 'fish', tts: 'риба' },
            { type: 'multiple_choice', id: 'food-2-mc2', question: 'How do you say "fish"?', choices: ['риба', 'месо', 'хляб', 'салата'], answer: 'риба' },
            { type: 'introduce', id: 'food-2-i4', label: 'NEW WORD', display: 'салата', sublabel: 'feminine noun (ends in -а)', translation: 'salad', tts: 'салата' },
            { type: 'introduce', id: 'food-2-i5', label: 'NEW WORD', display: 'супа', sublabel: 'feminine noun (ends in -а)', translation: 'soup', tts: 'супа' },
            { type: 'translate_to_en', id: 'food-2-tr1', prompt: 'Искам супа и салата', answer: 'I want soup and salad', hint: 'и = and', tts: 'Искам супа и салата' },
            { type: 'match_pairs', id: 'food-2-mp1', instruction: 'Match the food to its meaning:', pairs: [{ left: 'хляб', right: 'bread' }, { left: 'месо', right: 'meat' }, { left: 'риба', right: 'fish' }, { left: 'супа', right: 'soup' }] },
            { type: 'word_bank', id: 'food-2-wb1', direction: 'to_en', prompt: 'Искам месо и хляб', tts: 'Искам месо и хляб', words: ['I', 'want', 'meat', 'and', 'bread', 'fish', 'salad', 'soup'], answer: 'I want meat and bread' },
            { type: 'listen_and_type', id: 'food-2-lat1', tts: 'салата', answer: 'салата' },
            { type: 'speak_sentence', id: 'food-2-sp1', tts: 'Искам риба и салата' },
          ],
        },
        {
          id: 'food-3',
          title: 'Numbers 1-10',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'food-3-i1', label: 'NEW NUMBERS', display: 'едно, две, три', sublabel: '1, 2, 3', tts: 'едно две три' },
            { type: 'introduce', id: 'food-3-i2', label: 'NEW NUMBERS', display: 'четири, пет, шест', sublabel: '4, 5, 6', tts: 'четири пет шест' },
            { type: 'multiple_choice', id: 'food-3-mc1', question: 'Which word means "3"?', choices: ['три', 'две', 'пет', 'едно'], answer: 'три' },
            { type: 'introduce', id: 'food-3-i3', label: 'NEW NUMBERS', display: 'седем, осем, девет, десет', sublabel: '7, 8, 9, 10', tts: 'седем осем девет десет' },
            { type: 'multiple_choice', id: 'food-3-mc2', question: 'Which word means "10"?', choices: ['десет', 'девет', 'осем', 'шест'], answer: 'десет' },
            { type: 'multiple_choice', id: 'food-3-mc3', question: 'What number is "пет"?', choices: ['5', '4', '6', '3'], answer: '5' },
            { type: 'multiple_choice', id: 'food-3-mc4', question: 'What number is "осем"?', choices: ['8', '7', '9', '6'], answer: '8' },
            { type: 'match_pairs', id: 'food-3-mp1', instruction: 'Match number to word:', pairs: [{ left: 'едно', right: '1' }, { left: 'три', right: '3' }, { left: 'пет', right: '5' }, { left: 'десет', right: '10' }] },
            { type: 'translate_to_en', id: 'food-3-tr1', prompt: 'Три кафета, моля', answer: 'Three coffees, please', hint: 'кафета = coffees (plural)', tts: 'Три кафета моля' },
            { type: 'listen_and_type', id: 'food-3-lat1', tts: 'седем', answer: 'седем' },
            { type: 'fill_blank', id: 'food-3-fb1', sentence: 'едно, две, ___, четири, пет', answer: 'три', hint: 'Count in order' },
            { type: 'speak_sentence', id: 'food-3-sp1', tts: 'едно две три четири пет' },
          ],
        },
        {
          id: 'food-4',
          title: 'Ordering',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'food-4-i1', label: 'NEW PHRASE', display: 'Искам...', sublabel: 'direct way to order', translation: 'I want...', tts: 'Искам' },
            { type: 'introduce', id: 'food-4-i2', label: 'NEW PHRASE', display: 'Бих искал...', sublabel: 'more polite (used by men)', translation: 'I would like...', tts: 'Бих искал' },
            { type: 'multiple_choice', id: 'food-4-mc0', question: 'What does "Искам" mean?', choices: ['I want', 'I would like', 'The bill, please', 'It is delicious'], answer: 'I want' },
            { type: 'introduce', id: 'food-4-i3', label: 'NEW PHRASE', display: 'Сметката, моля', sublabel: 'say this to pay and leave', translation: 'The bill, please', tts: 'Сметката моля' },
            { type: 'introduce', id: 'food-4-i4', label: 'NEW PHRASE', display: 'Вкусно е!', sublabel: 'compliment the food', translation: 'It is delicious!', tts: 'Вкусно е' },
            { type: 'multiple_choice', id: 'food-4-mc1', question: 'What does "Сметката, моля" mean?', choices: ['The bill, please', 'One more, please', 'I want coffee', 'It is delicious'], answer: 'The bill, please' },
            { type: 'translate_to_en', id: 'food-4-tr1', prompt: 'Бих искал супа, моля', answer: 'I would like soup, please', tts: 'Бих искал супа моля' },
            { type: 'translate_to_en', id: 'food-4-tr2', prompt: 'Вкусно е!', answer: 'It is delicious', tts: 'Вкусно е' },
            { type: 'word_bank', id: 'food-4-wb1', direction: 'to_bg', prompt: 'The bill, please', words: ['Сметката', 'моля', 'Искам', 'вода', 'Вкусно', 'е', 'Бих', 'искал'], answer: 'Сметката моля' },
            { type: 'fill_blank', id: 'food-4-fb1', sentence: '___ е! (The food is delicious)', answer: 'Вкусно', hint: 'delicious = ??' },
            { type: 'listen_translate', id: 'food-4-lt1', tts: 'Вкусно е', answer: 'It is delicious' },
            { type: 'speak_sentence', id: 'food-4-sp1', tts: 'Сметката моля' },
          ],
        },
        {
          id: 'food-5',
          title: 'Bon Appetit Review',
          xp: 15,
          exercises: [
            { type: 'multiple_choice', id: 'food-5-mc1', question: 'How do you ask for the bill?', choices: ['Сметката, моля', 'Искам вода', 'Вкусно е', 'Три кафета'], answer: 'Сметката, моля' },
            { type: 'translate_to_en', id: 'food-5-tr1', prompt: 'Искам риба, хляб и вино', answer: 'I want fish, bread and wine', tts: 'Искам риба хляб и вино' },
            { type: 'translate_to_bg', id: 'food-5-tb1', prompt: 'Two teas, please', answer: 'Две чайа моля' },
            { type: 'match_pairs', id: 'food-5-mp1', instruction: 'Match the food and drink:', pairs: [{ left: 'вода', right: 'water' }, { left: 'хляб', right: 'bread' }, { left: 'риба', right: 'fish' }, { left: 'вино', right: 'wine' }] },
            { type: 'multiple_choice', id: 'food-5-mc2', question: 'What number is "седем"?', choices: ['7', '6', '8', '9'], answer: '7' },
            { type: 'word_bank', id: 'food-5-wb1', direction: 'to_en', prompt: 'Бих искал салата и вода', tts: 'Бих искал салата и вода', words: ['I', 'would', 'like', 'salad', 'and', 'water', 'soup', 'fish'], answer: 'I would like salad and water' },
            { type: 'fill_blank', id: 'food-5-fb1', sentence: 'Три, четири, ___, шест', answer: 'пет', hint: 'Count in order' },
            { type: 'listen_translate', id: 'food-5-lt1', tts: 'Искам кафе и хляб', answer: 'I want coffee and bread' },
            { type: 'listen_translate', id: 'food-5-lt2', tts: 'Сметката моля', answer: 'The bill please' },
            { type: 'speak_sentence', id: 'food-5-sp1', tts: 'Бих искал риба и вино моля' },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    {
      id: 'family',
      title: 'My Family',
      subtitle: 'Family members and descriptions',
      color: '#ce82ff',
      icon: 'Сем',
      notes: `## Family Members

| Bulgarian | English | Gender |
|-----------|---------|--------|
| майка | mother | Fem |
| баща | father | Masc |
| брат | brother | Masc |
| сестра | sister | Fem |
| дете / деца | child / children | Neut |
| дядо | grandfather | Masc |
| баба | grandmother | Fem |
| съпруг | husband | Masc |
| съпруга | wife | Fem |
| семейство | family | Neut |

## Adjectives

Adjectives agree with the noun's gender:

| Masculine | Feminine | Neuter | English |
|-----------|----------|--------|---------|
| голям | голяма | голямо | big |
| малък | малка | малко | small |
| стар | стара | старо | old |
| млад | млада | младо | young |
| хубав | хубава | хубаво | nice / beautiful |

## Talking About Family

- **Имам...** - I have...
- **Нямам...** - I don't have...
- **Моят баща** - my father (masculine)
- **Моята майка** - my mother (feminine)`,

      lessons: [
        {
          id: 'fam-1',
          title: 'Close Family',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'fam-1-i1', label: 'NEW WORD', display: 'майка', sublabel: 'feminine noun (ends in -а)', translation: 'mother', tts: 'майка' },
            { type: 'introduce', id: 'fam-1-i2', label: 'NEW WORD', display: 'баща', sublabel: 'masculine noun (ends in -а, exception)', translation: 'father', tts: 'баща' },
            { type: 'multiple_choice', id: 'fam-1-mc1', question: 'What does "майка" mean?', choices: ['mother', 'father', 'sister', 'grandmother'], answer: 'mother' },
            { type: 'listen_and_type', id: 'fam-1-lat0', tts: 'баща', answer: 'баща' },
            { type: 'introduce', id: 'fam-1-i3', label: 'NEW WORD', display: 'брат', sublabel: 'masculine noun', translation: 'brother', tts: 'брат' },
            { type: 'introduce', id: 'fam-1-i4', label: 'NEW WORD', display: 'сестра', sublabel: 'feminine noun (ends in -а)', translation: 'sister', tts: 'сестра' },
            { type: 'multiple_choice', id: 'fam-1-mc2', question: 'How do you say "brother"?', choices: ['брат', 'баща', 'дядо', 'съпруг'], answer: 'брат' },
            { type: 'translate_to_en', id: 'fam-1-tr1', prompt: 'Имам брат и сестра', answer: 'I have a brother and a sister', hint: 'Имам = I have, и = and', tts: 'Имам брат и сестра' },
            { type: 'match_pairs', id: 'fam-1-mp1', instruction: 'Match the family word:', pairs: [{ left: 'майка', right: 'mother' }, { left: 'баща', right: 'father' }, { left: 'брат', right: 'brother' }, { left: 'сестра', right: 'sister' }] },
            { type: 'word_bank', id: 'fam-1-wb1', direction: 'to_en', prompt: 'Имам майка и баща', tts: 'Имам майка и баща', words: ['I', 'have', 'a', 'mother', 'and', 'father', 'sister', 'brother'], answer: 'I have a mother and a father' },
            { type: 'listen_and_type', id: 'fam-1-lat1', tts: 'майка', answer: 'майка' },
            { type: 'speak_sentence', id: 'fam-1-sp1', tts: 'Имам брат и сестра' },
          ],
        },
        {
          id: 'fam-2',
          title: 'Extended Family',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'fam-2-i1', label: 'NEW WORD', display: 'дядо', sublabel: 'masculine noun', translation: 'grandfather', tts: 'дядо' },
            { type: 'introduce', id: 'fam-2-i2', label: 'NEW WORD', display: 'баба', sublabel: 'feminine noun (ends in -а)', translation: 'grandmother', tts: 'баба' },
            { type: 'multiple_choice', id: 'fam-2-mc1', question: 'What does "баба" mean?', choices: ['grandmother', 'grandfather', 'mother', 'aunt'], answer: 'grandmother' },
            { type: 'introduce', id: 'fam-2-i3', label: 'NEW WORD', display: 'съпруг', sublabel: 'masculine noun', translation: 'husband', tts: 'съпруг' },
            { type: 'introduce', id: 'fam-2-i4', label: 'NEW WORD', display: 'съпруга', sublabel: 'feminine noun (ends in -а)', translation: 'wife', tts: 'съпруга' },
            { type: 'multiple_choice', id: 'fam-2-mc2', question: 'How do you say "husband"?', choices: ['съпруг', 'съпруга', 'дядо', 'баща'], answer: 'съпруг' },
            { type: 'introduce', id: 'fam-2-i5', label: 'NEW WORD', display: 'семейство', sublabel: 'neuter noun (ends in -о)', translation: 'family', tts: 'семейство' },
            { type: 'translate_to_en', id: 'fam-2-tr1', prompt: 'Имам голямо семейство', answer: 'I have a big family', hint: 'голямо = big (neuter)', tts: 'Имам голямо семейство' },
            { type: 'match_pairs', id: 'fam-2-mp1', instruction: 'Match the family word:', pairs: [{ left: 'дядо', right: 'grandfather' }, { left: 'баба', right: 'grandmother' }, { left: 'съпруг', right: 'husband' }, { left: 'съпруга', right: 'wife' }] },
            { type: 'word_bank', id: 'fam-2-wb1', direction: 'to_bg', prompt: 'I have a grandmother and a grandfather', words: ['Имам', 'баба', 'и', 'дядо', 'семейство', 'майка', 'баща', 'нямам'], answer: 'Имам баба и дядо' },
            { type: 'listen_translate', id: 'fam-2-lt1', tts: 'Имам голямо семейство', answer: 'I have a big family' },
            { type: 'speak_sentence', id: 'fam-2-sp1', tts: 'Моята баба е хубава' },
          ],
        },
        {
          id: 'fam-3',
          title: 'Describing People',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'fam-3-i1', label: 'NEW WORD', display: 'голям / голяма', sublabel: 'masc / fem forms', translation: 'big / large', tts: 'голям' },
            { type: 'introduce', id: 'fam-3-i2', label: 'NEW WORD', display: 'малък / малка', sublabel: 'masc / fem forms', translation: 'small / little', tts: 'малък' },
            { type: 'multiple_choice', id: 'fam-3-mc1', question: 'What does "голяма" mean (feminine form)?', choices: ['big', 'small', 'old', 'young'], answer: 'big' },
            { type: 'introduce', id: 'fam-3-i3', label: 'NEW WORD', display: 'стар / стара', sublabel: 'masc / fem forms', translation: 'old', tts: 'стар' },
            { type: 'introduce', id: 'fam-3-i4', label: 'NEW WORD', display: 'млад / млада', sublabel: 'masc / fem forms', translation: 'young', tts: 'млад' },
            { type: 'multiple_choice', id: 'fam-3-mc2', question: 'What is the opposite of "стар" (old)?', choices: ['млад', 'хубав', 'голям', 'малък'], answer: 'млад' },
            { type: 'introduce', id: 'fam-3-i5', label: 'NEW WORD', display: 'хубав / хубава', sublabel: 'masc / fem forms', translation: 'nice / beautiful', tts: 'хубав' },
            { type: 'translate_to_en', id: 'fam-3-tr1', prompt: 'Моята сестра е млада и хубава', answer: 'My sister is young and beautiful', hint: 'Моята = my (fem), млада/хубава = fem forms', tts: 'Моята сестра е млада и хубава' },
            { type: 'translate_to_en', id: 'fam-3-tr2', prompt: 'Моят баща е стар', answer: 'My father is old', hint: 'Моят = my (masc)', tts: 'Моят баща е стар' },
            { type: 'match_pairs', id: 'fam-3-mp1', instruction: 'Match the adjective to its meaning:', pairs: [{ left: 'голям', right: 'big' }, { left: 'малък', right: 'small' }, { left: 'стар', right: 'old' }, { left: 'млад', right: 'young' }] },
            { type: 'word_bank', id: 'fam-3-wb1', direction: 'to_en', prompt: 'Моят брат е млад и голям', tts: 'Моят брат е млад и голям', words: ['My', 'brother', 'is', 'young', 'and', 'big', 'old', 'small'], answer: 'My brother is young and big' },
            { type: 'speak_sentence', id: 'fam-3-sp1', tts: 'Моята майка е хубава' },
          ],
        },
        {
          id: 'fam-4',
          title: 'I Have / I Don\'t Have',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'fam-4-i1', label: 'NEW PHRASE', display: 'Имам...', sublabel: 'I have (something)', translation: 'I have...', tts: 'Имам' },
            { type: 'introduce', id: 'fam-4-i2', label: 'NEW PHRASE', display: 'Нямам...', sublabel: '"не + имам" = the opposite', translation: 'I don\'t have...', tts: 'Нямам' },
            { type: 'multiple_choice', id: 'fam-4-mc1', question: 'What does "Нямам брат" mean?', choices: ['I don\'t have a brother', 'I have a brother', 'My brother is here', 'I want a brother'], answer: 'I don\'t have a brother' },
            { type: 'translate_to_en', id: 'fam-4-tr1', prompt: 'Имам две сестри', answer: 'I have two sisters', hint: 'две = two, сестри = sisters (plural)', tts: 'Имам две сестри' },
            { type: 'translate_to_en', id: 'fam-4-tr2', prompt: 'Нямам деца', answer: 'I don\'t have children', hint: 'деца = children', tts: 'Нямам деца' },
            { type: 'multiple_choice', id: 'fam-4-mc2', question: 'How do you say "I have a young sister"?', choices: ['Имам млада сестра', 'Нямам млада сестра', 'Сестра ми е стара', 'Имам малък брат'], answer: 'Имам млада сестра' },
            { type: 'word_bank', id: 'fam-4-wb1', direction: 'to_en', prompt: 'Нямам брат, но имам сестра', tts: 'Нямам брат но имам сестра', words: ['I', 'don\'t', 'have', 'a', 'brother', 'but', 'I', 'have', 'sister'], answer: 'I don\'t have a brother but I have a sister' },
            { type: 'fill_blank', id: 'fam-4-fb1', sentence: '___ брат, но имам сестра.', answer: 'Нямам', hint: 'I don\'t have = ??' },
            { type: 'translate_to_bg', id: 'fam-4-tb1', prompt: 'I have a big family', answer: 'Имам голямо семейство' },
            { type: 'listen_translate', id: 'fam-4-lt1', tts: 'Нямам деца', answer: 'I don\'t have children' },
            { type: 'speak_sentence', id: 'fam-4-sp1', tts: 'Имам голямо семейство' },
          ],
        },
        {
          id: 'fam-5',
          title: 'Family Review',
          xp: 15,
          exercises: [
            { type: 'multiple_choice', id: 'fam-5-mc1', question: 'Which word means "grandmother"?', choices: ['баба', 'майка', 'сестра', 'съпруга'], answer: 'баба' },
            { type: 'translate_to_en', id: 'fam-5-tr1', prompt: 'Моят дядо е стар, но хубав', answer: 'My grandfather is old but nice', hint: 'но = but', tts: 'Моят дядо е стар но хубав' },
            { type: 'translate_to_bg', id: 'fam-5-tb1', prompt: 'I have a young wife', answer: 'Имам млада съпруга' },
            { type: 'match_pairs', id: 'fam-5-mp1', instruction: 'Match the family member:', pairs: [{ left: 'дядо', right: 'grandfather' }, { left: 'съпруг', right: 'husband' }, { left: 'сестра', right: 'sister' }, { left: 'баща', right: 'father' }] },
            { type: 'fill_blank', id: 'fam-5-fb1', sentence: 'Моята сестра е ___ и хубава.', answer: 'млада', hint: 'young (feminine) = ??' },
            { type: 'word_bank', id: 'fam-5-wb1', direction: 'to_en', prompt: 'Имам малко семейство', tts: 'Имам малко семейство', words: ['I', 'have', 'a', 'small', 'big', 'family', 'old', 'young'], answer: 'I have a small family' },
            { type: 'translate_to_en', id: 'fam-5-tr2', prompt: 'Нямам брат, само сестра', answer: 'I don\'t have a brother, only a sister', hint: 'само = only', tts: 'Нямам брат само сестра' },
            { type: 'listen_translate', id: 'fam-5-lt1', tts: 'Моята майка е хубава и млада', answer: 'My mother is beautiful and young' },
            { type: 'listen_translate', id: 'fam-5-lt2', tts: 'Имам брат и две сестри', answer: 'I have a brother and two sisters' },
            { type: 'speak_sentence', id: 'fam-5-sp1', tts: 'Нямам брат но имам сестра' },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    {
      id: 'school',
      title: 'School Days',
      subtitle: 'School, supplies and the week',
      color: '#ffa500',
      icon: 'Учи',
      notes: `## People at School

| Bulgarian | English |
|-----------|---------|
| училище | school |
| клас | class / classroom |
| учител | teacher (male) |
| учителка | teacher (female) |
| ученик | student (male) |
| ученичка | student (female) |

## School Supplies

| Bulgarian | English |
|-----------|---------|
| книга | book |
| тетрадка | notebook |
| молив | pencil |
| химикал | pen |
| раница | backpack |
| дъска | blackboard |

## Classroom Phrases

- **Разбирам** - I understand
- **Не разбирам** - I don't understand
- **Повторете, моля** - Please repeat
- **Помощ!** - Help!
- **Мога ли да попитам?** - May I ask a question?

## Days of the Week

| Bulgarian | English |
|-----------|---------|
| понеделник | Monday |
| вторник | Tuesday |
| сряда | Wednesday |
| четвъртък | Thursday |
| петък | Friday |
| събота | Saturday |
| неделя | Sunday |`,

      lessons: [
        {
          id: 'sch-1',
          title: 'People at School',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'sch-1-i1', label: 'NEW WORD', display: 'училище', sublabel: 'neuter noun (ends in -е)', translation: 'school', tts: 'училище' },
            { type: 'introduce', id: 'sch-1-i2', label: 'NEW WORD', display: 'учител', sublabel: 'masculine noun', translation: 'teacher (male)', tts: 'учител' },
            { type: 'multiple_choice', id: 'sch-1-mc2', question: 'How do you say "school"?', choices: ['училище', 'учител', 'ученик', 'клас'], answer: 'училище' },
            { type: 'introduce', id: 'sch-1-i3', label: 'NEW WORD', display: 'учителка', sublabel: 'feminine noun (ends in -а)', translation: 'teacher (female)', tts: 'учителка' },
            { type: 'multiple_choice', id: 'sch-1-mc1', question: 'What does "учителка" mean?', choices: ['female teacher', 'male teacher', 'student', 'school'], answer: 'female teacher' },
            { type: 'introduce', id: 'sch-1-i4', label: 'NEW WORD', display: 'ученик', sublabel: 'masculine noun', translation: 'student (male)', tts: 'ученик' },
            { type: 'introduce', id: 'sch-1-i5', label: 'NEW WORD', display: 'ученичка', sublabel: 'feminine noun (ends in -а)', translation: 'student (female)', tts: 'ученичка' },
            { type: 'translate_to_en', id: 'sch-1-tr1', prompt: 'Учителката е в клас', answer: 'The teacher is in class', hint: 'в = in, клас = class', tts: 'Учителката е в клас' },
            { type: 'match_pairs', id: 'sch-1-mp1', instruction: 'Match the school word:', pairs: [{ left: 'училище', right: 'school' }, { left: 'учител', right: 'teacher (m)' }, { left: 'ученик', right: 'student (m)' }, { left: 'учителка', right: 'teacher (f)' }] },
            { type: 'word_bank', id: 'sch-1-wb1', direction: 'to_en', prompt: 'Аз съм ученик в училище', tts: 'Аз съм ученик в училище', words: ['I', 'am', 'a', 'student', 'teacher', 'in', 'school', 'class'], answer: 'I am a student in school' },
            { type: 'listen_and_type', id: 'sch-1-lat1', tts: 'учител', answer: 'учител' },
            { type: 'speak_sentence', id: 'sch-1-sp1', tts: 'Аз съм ученичка' },
          ],
        },
        {
          id: 'sch-2',
          title: 'School Supplies',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'sch-2-i1', label: 'NEW WORD', display: 'книга', sublabel: 'feminine noun (ends in -а)', translation: 'book', tts: 'книга' },
            { type: 'introduce', id: 'sch-2-i2', label: 'NEW WORD', display: 'тетрадка', sublabel: 'feminine noun (ends in -а)', translation: 'notebook', tts: 'тетрадка' },
            { type: 'multiple_choice', id: 'sch-2-mc0', question: 'What does "книга" mean?', choices: ['book', 'notebook', 'pencil', 'backpack'], answer: 'book' },
            { type: 'introduce', id: 'sch-2-i3', label: 'NEW WORD', display: 'молив', sublabel: 'masculine noun', translation: 'pencil', tts: 'молив' },
            { type: 'multiple_choice', id: 'sch-2-mc1', question: 'What does "молив" mean?', choices: ['pencil', 'pen', 'book', 'notebook'], answer: 'pencil' },
            { type: 'introduce', id: 'sch-2-i4', label: 'NEW WORD', display: 'химикал', sublabel: 'masculine noun', translation: 'pen', tts: 'химикал' },
            { type: 'introduce', id: 'sch-2-i5', label: 'NEW WORD', display: 'раница', sublabel: 'feminine noun (ends in -а)', translation: 'backpack', tts: 'раница' },
            { type: 'multiple_choice', id: 'sch-2-mc2', question: 'You write with ink. Which tool do you use?', choices: ['химикал', 'молив', 'книга', 'тетрадка'], answer: 'химикал' },
            { type: 'translate_to_en', id: 'sch-2-tr1', prompt: 'Имам книга и тетрадка в раницата', answer: 'I have a book and a notebook in the backpack', hint: 'в раницата = in the backpack', tts: 'Имам книга и тетрадка в раницата' },
            { type: 'match_pairs', id: 'sch-2-mp1', instruction: 'Match the school supply:', pairs: [{ left: 'книга', right: 'book' }, { left: 'тетрадка', right: 'notebook' }, { left: 'молив', right: 'pencil' }, { left: 'раница', right: 'backpack' }] },
            { type: 'word_bank', id: 'sch-2-wb1', direction: 'to_bg', prompt: 'I have a pencil and a pen', words: ['Имам', 'молив', 'и', 'химикал', 'книга', 'раница', 'тетрадка', 'нямам'], answer: 'Имам молив и химикал' },
            { type: 'listen_and_type', id: 'sch-2-lat1', tts: 'тетрадка', answer: 'тетрадка' },
            { type: 'speak_sentence', id: 'sch-2-sp1', tts: 'Имам раница с книги' },
          ],
        },
        {
          id: 'sch-3',
          title: 'In the Classroom',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'sch-3-i1', label: 'NEW PHRASE', display: 'Разбирам', sublabel: 'use when you follow the lesson', translation: 'I understand', tts: 'Разбирам' },
            { type: 'introduce', id: 'sch-3-i2', label: 'NEW PHRASE', display: 'Не разбирам', sublabel: 'не = not, so "I not understand"', translation: 'I don\'t understand', tts: 'Не разбирам' },
            { type: 'multiple_choice', id: 'sch-3-mc1', question: 'What does "Не разбирам" mean?', choices: ['I don\'t understand', 'I understand', 'I don\'t know', 'Please repeat'], answer: 'I don\'t understand' },
            { type: 'introduce', id: 'sch-3-i3', label: 'NEW PHRASE', display: 'Повторете, моля', sublabel: 'ask the teacher to say it again', translation: 'Please repeat', tts: 'Повторете моля' },
            { type: 'introduce', id: 'sch-3-i4', label: 'NEW WORD', display: 'Помощ!', sublabel: 'shout this when you are stuck', translation: 'Help!', tts: 'Помощ' },
            { type: 'multiple_choice', id: 'sch-3-mc2', question: 'You didn\'t catch what the teacher said. What do you say?', choices: ['Повторете, моля', 'Помощ', 'Разбирам', 'Нямам'], answer: 'Повторете, моля' },
            { type: 'translate_to_en', id: 'sch-3-tr1', prompt: 'Не разбирам урока', answer: 'I don\'t understand the lesson', hint: 'урока = the lesson', tts: 'Не разбирам урока' },
            { type: 'match_pairs', id: 'sch-3-mp1', instruction: 'Match the phrase:', pairs: [{ left: 'Разбирам', right: 'I understand' }, { left: 'Не разбирам', right: 'I don\'t understand' }, { left: 'Повторете', right: 'Please repeat' }, { left: 'Помощ!', right: 'Help!' }] },
            { type: 'fill_blank', id: 'sch-3-fb1', sentence: 'Не ___. Повторете, моля.', answer: 'разбирам', hint: 'I don\'t understand = Не ???' },
            { type: 'listen_translate', id: 'sch-3-lt1', tts: 'Повторете моля', answer: 'Please repeat' },
            { type: 'speak_sentence', id: 'sch-3-sp1', tts: 'Не разбирам моля повторете' },
          ],
        },
        {
          id: 'sch-4',
          title: 'Days of the Week',
          xp: 10,
          exercises: [
            { type: 'introduce', id: 'sch-4-i1', label: 'NEW WORDS', display: 'понеделник, вторник', sublabel: 'the week begins with Monday', translation: 'Monday, Tuesday', tts: 'понеделник вторник' },
            { type: 'introduce', id: 'sch-4-i2', label: 'NEW WORDS', display: 'сряда, четвъртък', sublabel: 'middle of the week', translation: 'Wednesday, Thursday', tts: 'сряда четвъртък' },
            { type: 'multiple_choice', id: 'sch-4-mc1', question: 'Which day comes after "вторник" (Tuesday)?', choices: ['сряда', 'четвъртък', 'петък', 'понеделник'], answer: 'сряда' },
            { type: 'introduce', id: 'sch-4-i3', label: 'NEW WORDS', display: 'петък, събота, неделя', sublabel: 'end of the week', translation: 'Friday, Saturday, Sunday', tts: 'петък събота неделя' },
            { type: 'multiple_choice', id: 'sch-4-mc2', question: 'What is "Saturday" in Bulgarian?', choices: ['събота', 'неделя', 'петък', 'сряда'], answer: 'събота' },
            { type: 'multiple_choice', id: 'sch-4-mc3', question: 'What is "Monday" in Bulgarian?', choices: ['понеделник', 'вторник', 'четвъртък', 'петък'], answer: 'понеделник' },
            { type: 'match_pairs', id: 'sch-4-mp1', instruction: 'Match the day of the week:', pairs: [{ left: 'понеделник', right: 'Monday' }, { left: 'сряда', right: 'Wednesday' }, { left: 'петък', right: 'Friday' }, { left: 'неделя', right: 'Sunday' }] },
            { type: 'translate_to_en', id: 'sch-4-tr1', prompt: 'В понеделник имам клас', answer: 'On Monday I have class', hint: 'В = on (for days)', tts: 'В понеделник имам клас' },
            { type: 'fill_blank', id: 'sch-4-fb1', sentence: 'понеделник, вторник, ___, четвъртък', answer: 'сряда', hint: 'What comes between Tuesday and Thursday?' },
            { type: 'listen_and_type', id: 'sch-4-lat1', tts: 'четвъртък', answer: 'четвъртък' },
            { type: 'speak_sentence', id: 'sch-4-sp1', tts: 'В петък нямам клас' },
          ],
        },
        {
          id: 'sch-5',
          title: 'School Review',
          xp: 15,
          exercises: [
            { type: 'multiple_choice', id: 'sch-5-mc1', question: 'What day comes after "събота" (Saturday)?', choices: ['неделя', 'петък', 'понеделник', 'сряда'], answer: 'неделя' },
            { type: 'translate_to_en', id: 'sch-5-tr1', prompt: 'Учителката дава книга на ученика', answer: 'The teacher gives a book to the student', hint: 'дава = gives, на = to', tts: 'Учителката дава книга на ученика' },
            { type: 'translate_to_bg', id: 'sch-5-tb1', prompt: 'I don\'t understand. Please repeat.', answer: 'Не разбирам. Повторете, моля.' },
            { type: 'match_pairs', id: 'sch-5-mp1', instruction: 'Match the school word:', pairs: [{ left: 'книга', right: 'book' }, { left: 'раница', right: 'backpack' }, { left: 'молив', right: 'pencil' }, { left: 'учителка', right: 'teacher (f)' }] },
            { type: 'fill_blank', id: 'sch-5-fb1', sentence: 'В ___ имам клас по математика.', answer: 'сряда', hint: 'Wednesday = ??' },
            { type: 'word_bank', id: 'sch-5-wb1', direction: 'to_en', prompt: 'Имам химикал и молив в раницата', tts: 'Имам химикал и молив в раницата', words: ['I', 'have', 'a', 'pen', 'and', 'pencil', 'in', 'the', 'backpack'], answer: 'I have a pen and pencil in the backpack' },
            { type: 'listen_translate', id: 'sch-5-lt1', tts: 'В четвъртък имам клас', answer: 'On Thursday I have class' },
            { type: 'listen_translate', id: 'sch-5-lt2', tts: 'Не разбирам урока', answer: 'I don\'t understand the lesson' },
            { type: 'translate_to_en', id: 'sch-5-tr2', prompt: 'В събота и неделя нямам клас', answer: 'On Saturday and Sunday I don\'t have class', tts: 'В събота и неделя нямам клас' },
            { type: 'speak_sentence', id: 'sch-5-sp1', tts: 'Разбирам учителката много добре' },
          ],
        },
      ],
    },

  ],
}
