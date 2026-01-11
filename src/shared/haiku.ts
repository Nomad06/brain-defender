/**
 * Haiku Collection for Focusan
 * Traditional Japanese poetry about focus, discipline, and mindfulness
 */

export interface Haiku {
  lines: [string, string, string] // 5-7-5 syllable structure
  linesRu?: [string, string, string] // Russian translation
  theme: 'focus' | 'discipline' | 'patience' | 'mindfulness' | 'strength'
}

export const HAIKU_COLLECTION: Haiku[] = [
  {
    lines: [
      'Mountain stands unmoved',
      'While the restless river flows',
      'Strength in stillness found',
    ],
    linesRu: [
      'Гора стоит твердо',
      'Река беспокойно течет',
      'Сила в покое',
    ],
    theme: 'strength',
  },
  {
    lines: [
      'Bamboo bends with wind',
      'Yet returns to standing tall',
      'Flexible, not weak',
    ],
    linesRu: [
      'Бамбук гнется с ветром',
      'Но возвращается прямо',
      'Гибкий, не слабый',
    ],
    theme: 'discipline',
  },
  {
    lines: [
      'Cherry blossoms fall',
      'Each moment fleeting and pure',
      'Focus on right now',
    ],
    linesRu: [
      'Цветы сакуры падают',
      'Каждый миг чист и мимолетен',
      'Фокус на настоящем',
    ],
    theme: 'mindfulness',
  },
  {
    lines: [
      'The archer breathes deep',
      'Arrow finds its destined path',
      'One target, one mind',
    ],
    linesRu: [
      'Лучник дышит глубоко',
      'Стрела находит свой путь',
      'Одна цель, один разум',
    ],
    theme: 'focus',
  },
  {
    lines: [
      'Winter plum tree blooms',
      'Through snow and bitter cold wind',
      'Patient strength prevails',
    ],
    linesRu: [
      'Зимой слива цветет',
      'Сквозь снег и холодный ветер',
      'Терпение побеждает',
    ],
    theme: 'patience',
  },
  {
    lines: [
      'Still water reflects',
      'The moon in perfect mirror',
      'Calm mind sees clearly',
    ],
    linesRu: [
      'Тихая вода отражает',
      'Луну в идеальном зеркале',
      'Спокойный ум видит ясно',
    ],
    theme: 'mindfulness',
  },
  {
    lines: [
      'Stone under water',
      'Smoothed by endless river flow',
      'Time shapes discipline',
    ],
    linesRu: [
      'Камень под водой',
      'Сглажен вечным течением',
      'Время формирует волю',
    ],
    theme: 'discipline',
  },
  {
    lines: [
      'Crane stands on one leg',
      'Balanced in the morning mist',
      'Focus brings balance',
    ],
    linesRu: [
      'Журавль на одной ноге',
      'В утреннем тумане',
      'Фокус даёт баланс',
    ],
    theme: 'focus',
  },
  {
    lines: [
      'Ink flows on paper',
      'Each stroke deliberate, sure',
      'Mind and brush as one',
    ],
    linesRu: [
      'Тушь течет по бумаге',
      'Каждый мазок уверенный',
      'Разум и кисть едины',
    ],
    theme: 'mindfulness',
  },
  {
    lines: [
      'Morning dew sparkles',
      'Soon vanishes in sunlight',
      'Seize this precious moment',
    ],
    linesRu: [
      'Утренняя роса блестит',
      'Скоро исчезнет в солнце',
      'Лови этот миг',
    ],
    theme: 'focus',
  },
  {
    lines: [
      'Samurai draws sword',
      'Years of training in one strike',
      'Practice makes perfect',
    ],
    theme: 'discipline',
  },
  {
    lines: [
      'Lotus blooms in mud',
      'Rising pure above the mire',
      'Beauty needs struggle',
    ],
    theme: 'strength',
  },
  {
    lines: [
      'Tea ceremony',
      'Each gesture calm and mindful',
      'The way is the goal',
    ],
    theme: 'mindfulness',
  },
  {
    lines: [
      'Pine tree on cliff edge',
      'Roots grip stone through wind and storm',
      'Determination wins',
    ],
    theme: 'strength',
  },
  {
    lines: [
      'Monk sits in silence',
      'Breath counts one to ten, repeat',
      'Peace in repetition',
    ],
    theme: 'patience',
  },
  {
    lines: [
      'Waterfall crashes',
      'But drop by drop carves the stone',
      'Small steps, great journey',
    ],
    theme: 'patience',
  },
  {
    lines: [
      'Autumn leaves release',
      'Letting go is not weakness',
      'Know when to move on',
    ],
    theme: 'discipline',
  },
  {
    lines: [
      'Koi swims upstream strong',
      'Against the current it fights',
      'Noble perseverance',
    ],
    theme: 'strength',
  },
  {
    lines: [
      'Empty your teacup',
      'To receive what\'s being poured',
      'Let distractions go',
    ],
    theme: 'mindfulness',
  },
  {
    lines: [
      'Sword master rests still',
      'Between battles, gather strength',
      'Rest is discipline',
    ],
    theme: 'discipline',
  },
]

/**
 * Get a random haiku from the collection
 */
export function getRandomHaiku(): Haiku {
  const index = Math.floor(Math.random() * HAIKU_COLLECTION.length)
  return HAIKU_COLLECTION[index]
}

/**
 * Get a haiku by theme
 */
export function getHaikuByTheme(theme: Haiku['theme']): Haiku {
  const filtered = HAIKU_COLLECTION.filter(h => h.theme === theme)
  if (filtered.length === 0) return getRandomHaiku()

  const index = Math.floor(Math.random() * filtered.length)
  return filtered[index]
}

/**
 * Samurai quotes for additional motivation
 */
export const SAMURAI_QUOTES = [
  { en: 'The warrior\'s path is in training.', ru: 'Путь воина - в тренировке.' },
  { en: 'One arrow, one life.', ru: 'Одна стрела, одна жизнь.' },
  { en: 'Fall seven times, stand up eight.', ru: 'Упал семь раз, встань восемь.' },
  { en: 'The sword is the soul of the samurai.', ru: 'Меч - это душа самурая.' },
  { en: 'Victory is for those who endure.', ru: 'Победа для тех, кто терпит.' },
  { en: 'A calm mind is stronger than brute force.', ru: 'Спокойный ум сильнее грубой силы.' },
  { en: 'The mountain does not move for the wind.', ru: 'Гора не двигается для ветра.' },
  { en: 'In stillness, find your strength.', ru: 'В тишине найди свою силу.' },
  { en: 'Discipline is choosing between what you want now and what you want most.', ru: 'Дисциплина - выбор между тем, что хочешь сейчас, и тем, что хочешь больше всего.' },
  { en: 'The master has failed more times than the beginner has even tried.', ru: 'Мастер терпел неудачи чаще, чем новичок пытался.' },
  { en: 'Your focus determines your reality.', ru: 'Твой фокус определяет твою реальность.' },
  { en: 'The journey of a thousand miles begins with a single step.', ru: 'Путь в тысячу миль начинается с одного шага.' },
  { en: 'When the student is ready, the teacher appears.', ru: 'Когда ученик готов, появляется учитель.' },
  { en: 'Do not seek to follow in the footsteps of wise men; seek what they sought.', ru: 'Не ищи следов мудрецов; ищи то, что они искали.' },
  { en: 'The obstacle is the path.', ru: 'Препятствие - это путь.' },
]

export function getRandomSamuraiQuote(language: 'en' | 'ru' = 'en'): string {
  const index = Math.floor(Math.random() * SAMURAI_QUOTES.length)
  return SAMURAI_QUOTES[index][language]
}
