/**
 * Haiku Collection for Focusan
 * Traditional Japanese poetry about focus, discipline, and mindfulness
 */

export interface Haiku {
  lines: [string, string, string] // 5-7-5 syllable structure
  theme: 'focus' | 'discipline' | 'patience' | 'mindfulness' | 'strength'
  translation?: string
}

export const HAIKU_COLLECTION: Haiku[] = [
  {
    lines: [
      'Mountain stands unmoved',
      'While the restless river flows',
      'Strength in stillness found',
    ],
    theme: 'strength',
  },
  {
    lines: [
      'Bamboo bends with wind',
      'Yet returns to standing tall',
      'Flexible, not weak',
    ],
    theme: 'discipline',
  },
  {
    lines: [
      'Cherry blossoms fall',
      'Each moment fleeting and pure',
      'Focus on right now',
    ],
    theme: 'mindfulness',
  },
  {
    lines: [
      'The archer breathes deep',
      'Arrow finds its destined path',
      'One target, one mind',
    ],
    theme: 'focus',
  },
  {
    lines: [
      'Winter plum tree blooms',
      'Through snow and bitter cold wind',
      'Patient strength prevails',
    ],
    theme: 'patience',
  },
  {
    lines: [
      'Still water reflects',
      'The moon in perfect mirror',
      'Calm mind sees clearly',
    ],
    theme: 'mindfulness',
  },
  {
    lines: [
      'Stone under water',
      'Smoothed by endless river flow',
      'Time shapes discipline',
    ],
    theme: 'discipline',
  },
  {
    lines: [
      'Crane stands on one leg',
      'Balanced in the morning mist',
      'Focus brings balance',
    ],
    theme: 'focus',
  },
  {
    lines: [
      'Ink flows on paper',
      'Each stroke deliberate, sure',
      'Mind and brush as one',
    ],
    theme: 'mindfulness',
  },
  {
    lines: [
      'Morning dew sparkles',
      'Soon vanishes in sunlight',
      'Seize this precious moment',
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
  'The warrior\'s path is in training.',
  'One arrow, one life.',
  'Fall seven times, stand up eight.',
  'The sword is the soul of the samurai.',
  'Victory is for those who endure.',
  'A calm mind is stronger than brute force.',
  'The mountain does not move for the wind.',
  'In stillness, find your strength.',
  'Discipline is choosing between what you want now and what you want most.',
  'The master has failed more times than the beginner has even tried.',
  'Your focus determines your reality.',
  'The journey of a thousand miles begins with a single step.',
  'When the student is ready, the teacher appears.',
  'Do not seek to follow in the footsteps of wise men; seek what they sought.',
  'The obstacle is the path.',
]

export function getRandomSamuraiQuote(): string {
  const index = Math.floor(Math.random() * SAMURAI_QUOTES.length)
  return SAMURAI_QUOTES[index]
}
