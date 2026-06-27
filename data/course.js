// ─── COURSE CONFIG ────────────────────────────────────────────────────────────
// Structure: Level (topic) -> Lessons -> Exercises
// Level notes are optional guidebook, NOT shown before exercises
// Exercise types: introduce | multiple_choice | translate_to_en | translate_to_bg | fill_blank | match_pairs | word_bank | speak_sentence | listen_and_type

export const COURSE = {
  id: 'bulgarian',
  name: 'Bulgarian',
  flag: '🇧🇬',
  levels: [
    // ══════════════════════════════════════════════════════════
    {
      id: 'cyrillic',
      title: 'Cyrillic',
      subtitle: 'Learn the alphabet',
      color: '#1cb0f6',
      icon: 'Аа',
      notes: `## The Bulgarian Cyrillic Alphabet

Bulgarian uses the Cyrillic alphabet. Don't worry about memorizing all letters now; the exercises will teach them step by step.

## Letters & Pronunciation

| Cyrillic | Romanization | Pronunciation |
|----------|-------------|---------------|
| А а | a | a as in "bath" |
| Б б | b | b as in "bug" |
| В в | v | v as in "vet" |
| Г г | g | g as in "good" |
| Д д | d | d as in "dog" |
| Е е | e | e as in "best" |
| Ж ж | zh | s as in "treasure" |
| З з | z | z as in "zoo" |
| И и | i | i as in "machine" |
| Й й | y | y as in "yes" |
| К к | k | k as in "make" |
| Л л | l | l as in "lend" |
| М м | m | m as in "man" |
| Н н | n | n as in "normal" |
| О о | o | o as in "order" |
| П п | p | p as in "pet" |
| Р р | r | trilled r |
| С с | s | s as in "sound" |
| Т т | t | t as in "top" |
| У у | u | oo as in "tool" |
| Ф ф | f | f as in "food" |
| Х х | h | ch as in "loch" |
| Ц ц | ts | ts as in "fits" |
| Ч ч | ch | ch as in "chip" |
| Ш ш | sh | sh as in "shot" |
| Щ щ | sht | sht as in "shtick" |
| Ъ ъ | a/u | u as in "turn" |
| Ь ь | y | softens previous consonant |
| Ю ю | yu | yu as in "youth" |
| Я я | ya | ya as in "kayak" |

## Pronunciation Tips

- All letters are pronounced (no silent letters)
- Stress affects vowel pronunciation: **о** sounds like "order" when stressed, like "bored" when not
- At end of words, voiced consonants become voiceless: б→п, в→ф, г→к, д→т, ж→ш, з→с`,

      lessons: [
        {
          id: 'cyrillic-1',
          title: 'Letters A to E',
          xp: 10,
          exercises: [
            // Introduce А, Б, В
            { type: 'introduce', id: 'cy-1-i1', label: 'NEW LETTER', display: 'А', sublabel: '"a" as in "bath"', tts: 'А' },
            { type: 'introduce', id: 'cy-1-i2', label: 'NEW LETTER', display: 'Б', sublabel: '"b" as in "bug"', tts: 'Б' },
            { type: 'introduce', id: 'cy-1-i3', label: 'NEW LETTER', display: 'В', sublabel: '"v" as in "vet"', tts: 'В' },
            // Test А, Б, В
            { type: 'multiple_choice', id: 'cy-1-1', question: 'Which letter makes the "a" sound (as in "bath")?', choices: ['А', 'Б', 'В'], answer: 'А', tts: 'А' },
            { type: 'multiple_choice', id: 'cy-1-2', question: 'Which letter makes the "b" sound (as in "bug")?', choices: ['Б', 'П', 'В'], answer: 'Б', tts: 'Б' },
            { type: 'multiple_choice', id: 'cy-1-3', question: 'Which letter makes the "v" sound (as in "vet")?', choices: ['В', 'Б', 'Г'], answer: 'В', tts: 'В' },
            // Introduce Г, Д, Е
            { type: 'introduce', id: 'cy-1-i4', label: 'NEW LETTER', display: 'Г', sublabel: '"g" as in "good"', tts: 'Г' },
            { type: 'introduce', id: 'cy-1-i5', label: 'NEW LETTER', display: 'Д', sublabel: '"d" as in "dog"', tts: 'Д' },
            { type: 'introduce', id: 'cy-1-i6', label: 'NEW LETTER', display: 'Е', sublabel: '"e" as in "best"', tts: 'Е' },
            // Test Г, Д, Е
            { type: 'multiple_choice', id: 'cy-1-4', question: 'Which letter makes the "g" sound (as in "good")?', choices: ['Г', 'К', 'Д'], answer: 'Г', tts: 'Г' },
            { type: 'multiple_choice', id: 'cy-1-5', question: 'Which letter makes the "d" sound (as in "dog")?', choices: ['Д', 'Г', 'Т'], answer: 'Д', tts: 'Д' },
            { type: 'multiple_choice', id: 'cy-1-6', question: 'Which letter makes the "e" sound (as in "best")?', choices: ['Е', 'З', 'И'], answer: 'Е', tts: 'Е' },
            // Match all six
            { type: 'match_pairs', id: 'cy-1-7', instruction: 'Match each letter to its sound:', pairs: [{ left: 'А', right: 'a' }, { left: 'Б', right: 'b' }, { left: 'В', right: 'v' }, { left: 'Г', right: 'g' }] },
          ],
        },
        {
          id: 'cyrillic-2',
          title: 'Letters Zh to N',
          xp: 10,
          exercises: [
            // Introduce Ж, З, И
            { type: 'introduce', id: 'cy-2-i1', label: 'NEW LETTER', display: 'Ж', sublabel: '"zh" like the "s" in "treasure"', tts: 'Ж' },
            { type: 'introduce', id: 'cy-2-i2', label: 'NEW LETTER', display: 'З', sublabel: '"z" as in "zoo"', tts: 'З' },
            { type: 'introduce', id: 'cy-2-i3', label: 'NEW LETTER', display: 'И', sublabel: '"i" as in "machine"', tts: 'И' },
            // Test Ж, З, И
            { type: 'multiple_choice', id: 'cy-2-2', question: 'Which letter makes the "zh" sound (like "s" in "treasure")?', choices: ['Ж', 'З', 'Ш'], answer: 'Ж', tts: 'Ж' },
            { type: 'multiple_choice', id: 'cy-2-3', question: 'Which letter makes the "z" sound (as in "zoo")?', choices: ['З', 'Ж', 'С'], answer: 'З', tts: 'З' },
            { type: 'multiple_choice', id: 'cy-2-4', question: 'Which letter makes the "i" sound (as in "machine")?', choices: ['И', 'Й', 'Е'], answer: 'И', tts: 'И' },
            // Introduce Л, М, Н
            { type: 'introduce', id: 'cy-2-i4', label: 'NEW LETTER', display: 'Л', sublabel: '"l" as in "lend"', tts: 'Л' },
            { type: 'introduce', id: 'cy-2-i5', label: 'NEW LETTER', display: 'М', sublabel: '"m" as in "man"', tts: 'М' },
            { type: 'introduce', id: 'cy-2-i6', label: 'NEW LETTER', display: 'Н', sublabel: '"n" as in "normal"', tts: 'Н' },
            // Test Л, М, Н
            { type: 'multiple_choice', id: 'cy-2-5', question: 'Which letter makes the "l" sound (as in "lend")?', choices: ['Л', 'Н', 'П'], answer: 'Л', tts: 'Л' },
            { type: 'multiple_choice', id: 'cy-2-6', question: 'Which letter makes the "m" sound (as in "man")?', choices: ['М', 'Н', 'Л'], answer: 'М', tts: 'М' },
            { type: 'multiple_choice', id: 'cy-2-1', question: 'Which letter makes the "n" sound (as in "normal")?', choices: ['Н', 'Л', 'Г'], answer: 'Н', tts: 'Н' },
            // Match
            { type: 'match_pairs', id: 'cy-2-7', instruction: 'Match each letter to its sound:', pairs: [{ left: 'Ж', right: 'zh' }, { left: 'З', right: 'z' }, { left: 'И', right: 'i' }, { left: 'Н', right: 'n' }] },
          ],
        },
        {
          id: 'cyrillic-3',
          title: 'Letters O to Ya',
          xp: 10,
          exercises: [
            // Introduce Ш, Ч, Ц
            { type: 'introduce', id: 'cy-3-i1', label: 'NEW LETTER', display: 'Ш', sublabel: '"sh" as in "shot"', tts: 'Ш' },
            { type: 'introduce', id: 'cy-3-i2', label: 'NEW LETTER', display: 'Ч', sublabel: '"ch" as in "chip"', tts: 'Ч' },
            { type: 'introduce', id: 'cy-3-i3', label: 'NEW LETTER', display: 'Ц', sublabel: '"ts" as in "fits"', tts: 'Ц' },
            // Test Ш, Ч, Ц
            { type: 'multiple_choice', id: 'cy-3-1', question: 'Which letter makes the "sh" sound (as in "shot")?', choices: ['Ш', 'Щ', 'Ж'], answer: 'Ш', tts: 'Ш' },
            { type: 'multiple_choice', id: 'cy-3-2', question: 'Which letter makes the "ch" sound (as in "chip")?', choices: ['Ч', 'Ц', 'Ш'], answer: 'Ч', tts: 'Ч' },
            { type: 'multiple_choice', id: 'cy-3-5', question: 'Which letter makes the "ts" sound (as in "fits")?', choices: ['Ц', 'Ч', 'С'], answer: 'Ц', tts: 'Ц' },
            // Introduce Я, Ю
            { type: 'introduce', id: 'cy-3-i4', label: 'NEW LETTER', display: 'Я', sublabel: '"ya" as in "kayak"', tts: 'Я' },
            { type: 'introduce', id: 'cy-3-i5', label: 'NEW LETTER', display: 'Ю', sublabel: '"yu" as in "youth"', tts: 'Ю' },
            // Test Я, Ю
            { type: 'multiple_choice', id: 'cy-3-3', question: 'Which letter makes the "ya" sound (as in "kayak")?', choices: ['Я', 'Ю', 'Й'], answer: 'Я', tts: 'Я' },
            { type: 'multiple_choice', id: 'cy-3-4', question: 'Which letter makes the "yu" sound (as in "youth")?', choices: ['Ю', 'Я', 'У'], answer: 'Ю', tts: 'Ю' },
            // Match
            { type: 'match_pairs', id: 'cy-3-6', instruction: 'Match each letter to its sound:', pairs: [{ left: 'Ш', right: 'sh' }, { left: 'Ч', right: 'ch' }, { left: 'Я', right: 'ya' }, { left: 'Ю', right: 'yu' }] },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    {
      id: 'basics-1',
      title: 'Basics 1',
      subtitle: 'To be, pronouns, articles',
      color: '#58cc02',
      icon: 'Аз',
      notes: `## Definite and Indefinite Articles

There is **no indefinite article** in Bulgarian. Words are used alone:
- *жена* = a woman / woman
- *куче* = a dog / dog

## The Verb "To Be" (съм)

| English | Bulgarian |
|---------|-----------|
| I am | аз съм |
| he/she/it is | той/тя/то е |

You cannot start a sentence with a present form of **съм**. So: **"Жена съм"** (not "Съм жена").

## Negation & Yes/No

- **не** = no / not: *Ана не е мъж* (Ana is not a man)
- **да** = yes: *Да, жена съм* (Yes, I am a woman)`,

      lessons: [
        {
          id: 'basics-1-1',
          title: 'Pronouns & To Be',
          xp: 10,
          exercises: [
            {
              type: 'multiple_choice',
              id: 'b1-1-1',
              question: 'What does "съм" mean?',
              choices: ['I am', 'He is', 'She is', 'We are'],
              answer: 'I am',
            },
            {
              type: 'multiple_choice',
              id: 'b1-1-2',
              question: 'What does "е" mean in "Тя е жена"?',
              choices: ['is', 'am', 'are', 'not'],
              answer: 'is',
            },
            {
              type: 'multiple_choice',
              id: 'b1-1-3',
              question: 'How do you say "He is a man"?',
              choices: ['Той е мъж', 'Тя е жена', 'Аз съм мъж', 'Това е куче'],
              answer: 'Той е мъж',
              tts: 'Той е мъж',
            },
            {
              type: 'translate_to_en',
              id: 'b1-1-4',
              prompt: 'Тя е жена',
              answer: 'She is a woman',
              hint: 'тя = she, е = is, жена = woman',
              tts: 'Тя е жена',
            },
            {
              type: 'translate_to_en',
              id: 'b1-1-5',
              prompt: 'Аз съм мъж',
              answer: 'I am a man',
              hint: 'аз = I, съм = am, мъж = man',
              tts: 'Аз съм мъж',
            },
            {
              type: 'translate_to_en',
              id: 'b1-1-6',
              prompt: 'Това е куче',
              answer: 'This is a dog',
              hint: 'това = this, куче = dog',
              tts: 'Това е куче',
            },
            {
              type: 'multiple_choice',
              id: 'b1-1-7',
              question: 'Which sentence is grammatically correct?',
              choices: ['Жена съм', 'Съм жена', 'Жена аз съм'],
              answer: 'Жена съм',
              tts: 'Жена съм',
            },
            {
              type: 'fill_blank',
              id: 'b1-1-8',
              sentence: 'Тя ___ жена.',
              answer: 'е',
              hint: '3rd person singular of съм',
            },
            {
              type: 'word_bank',
              id: 'b1-1-wb1',
              direction: 'to_en',
              prompt: 'Аз съм мъж',
              tts: 'Аз съм мъж',
              words: ['I', 'am', 'a', 'man', 'she', 'is', 'not', 'dog'],
              answer: 'I am a man',
            },
            {
              type: 'word_bank',
              id: 'b1-1-wb2',
              direction: 'to_en',
              prompt: 'Тя е жена',
              tts: 'Тя е жена',
              words: ['She', 'is', 'a', 'woman', 'he', 'man', 'not', 'am'],
              answer: 'She is a woman',
            },
            {
              type: 'speak_sentence',
              id: 'b1-1-sp1',
              tts: 'Аз съм мъж',
            },
            {
              type: 'listen_and_type',
              id: 'b1-1-lt1',
              tts: 'Тя е жена',
              answer: 'Тя е жена',
            },
          ],
        },
        {
          id: 'basics-1-2',
          title: 'Negation & Yes/No',
          xp: 10,
          exercises: [
            {
              type: 'multiple_choice',
              id: 'b1-2-1',
              question: 'What does "не" mean?',
              choices: ['No / not', 'Yes', 'And', 'But'],
              answer: 'No / not',
            },
            {
              type: 'multiple_choice',
              id: 'b1-2-2',
              question: 'What does "да" mean?',
              choices: ['Yes', 'No', 'Maybe', 'And'],
              answer: 'Yes',
            },
            {
              type: 'translate_to_en',
              id: 'b1-2-3',
              prompt: 'Ана не е мъж',
              answer: 'Ana is not a man',
              hint: 'не = not',
              tts: 'Ана не е мъж',
            },
            {
              type: 'translate_to_bg',
              id: 'b1-2-4',
              prompt: 'This is a dog',
              answer: 'Това е куче',
              hint: 'това = this, е = is, куче = dog',
            },
            {
              type: 'translate_to_bg',
              id: 'b1-2-5',
              prompt: 'Yes, I am a woman',
              answer: 'Да, жена съм',
              hint: 'да = yes, жена = woman, съм = I am',
            },
            {
              type: 'fill_blank',
              id: 'b1-2-6',
              sentence: 'Аз ___ мъж.',
              answer: 'съм',
              hint: '1st person singular of to be',
            },
            {
              type: 'multiple_choice',
              id: 'b1-2-7',
              question: 'How do you say "Ana is not a man" in Bulgarian?',
              choices: ['Ана не е мъж', 'Ана е мъж', 'Ана не съм мъж'],
              answer: 'Ана не е мъж',
              tts: 'Ана не е мъж',
            },
            {
              type: 'word_bank',
              id: 'b1-2-wb1',
              direction: 'to_en',
              prompt: 'Ана не е мъж',
              tts: 'Ана не е мъж',
              words: ['Ana', 'is', 'not', 'a', 'man', 'woman', 'and', 'the'],
              answer: 'Ana is not a man',
            },
            {
              type: 'word_bank',
              id: 'b1-2-wb2',
              direction: 'to_bg',
              prompt: 'Yes, I am a woman',
              words: ['Да', 'жена', 'съм', 'не', 'мъж', 'Ана', 'е', 'аз'],
              answer: 'Да, жена съм',
            },
            {
              type: 'speak_sentence',
              id: 'b1-2-sp1',
              tts: 'Ана не е мъж',
            },
            {
              type: 'listen_and_type',
              id: 'b1-2-lt1',
              tts: 'Да, жена съм',
              answer: 'Да, жена съм',
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    {
      id: 'basics-2',
      title: 'Basics 2',
      subtitle: 'Nouns & grammatical gender',
      color: '#ff9600',
      icon: 'М/Ж',
      notes: `## Grammatical Gender

Bulgarian nouns have three genders:

| Ending | Gender | Examples |
|--------|--------|---------|
| consonant | Masculine | мъж (man), град (city) |
| -а / -я | Feminine | жена (woman), земя (earth) |
| -о / -е / -и | Neuter | куче (dog), такси (taxi) |

**такси** (taxi) is a loanword ending in **-и** → neuter gender.

## New Vocabulary

| Bulgarian | English | Gender |
|-----------|---------|--------|
| град | city | Masc |
| кола | car | Fem |
| такси | taxi | Neut |
| дете | child | Neut |
| котка | cat | Fem |`,

      lessons: [
        {
          id: 'basics-2-1',
          title: 'Grammatical Gender',
          xp: 10,
          exercises: [
            {
              type: 'multiple_choice',
              id: 'b2-1-1',
              question: 'What grammatical gender is "такси" (taxi)?',
              choices: ['Neuter', 'Feminine', 'Masculine'],
              answer: 'Neuter',
            },
            {
              type: 'multiple_choice',
              id: 'b2-1-2',
              question: 'What grammatical gender is "жена" (woman)?',
              choices: ['Feminine', 'Masculine', 'Neuter'],
              answer: 'Feminine',
            },
            {
              type: 'multiple_choice',
              id: 'b2-1-3',
              question: 'What grammatical gender is "мъж" (man)?',
              choices: ['Masculine', 'Feminine', 'Neuter'],
              answer: 'Masculine',
            },
            {
              type: 'multiple_choice',
              id: 'b2-1-4',
              question: 'Words ending in -а or -я are usually...',
              choices: ['Feminine', 'Masculine', 'Neuter'],
              answer: 'Feminine',
            },
            {
              type: 'translate_to_en',
              id: 'b2-1-5',
              prompt: 'Това е кола',
              answer: 'This is a car',
              hint: 'кола = car',
              tts: 'Това е кола',
            },
            {
              type: 'translate_to_bg',
              id: 'b2-1-6',
              prompt: 'This is a taxi',
              answer: 'Това е такси',
              hint: 'такси = taxi',
            },
            {
              type: 'multiple_choice',
              id: 'b2-1-7',
              question: 'What grammatical gender is "куче" (dog)?',
              choices: ['Neuter', 'Masculine', 'Feminine'],
              answer: 'Neuter',
            },
            {
              type: 'match_pairs',
              id: 'b2-1-8',
              instruction: 'Match the Bulgarian word to its gender:',
              pairs: [
                { left: 'мъж', right: 'Masculine' },
                { left: 'жена', right: 'Feminine' },
                { left: 'куче', right: 'Neuter' },
                { left: 'такси', right: 'Neuter' },
              ],
            },
            {
              type: 'speak_sentence',
              id: 'b2-1-sp1',
              tts: 'Това е кола',
            },
            {
              type: 'listen_and_type',
              id: 'b2-1-lt1',
              tts: 'Това е такси',
              answer: 'Това е такси',
            },
          ],
        },
      ],
    },
  ],
}
