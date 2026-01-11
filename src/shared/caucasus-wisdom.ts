/**
 * Caucasus Wisdom - Proverbs, Quotes, and Phrases
 * Collection of traditional Caucasian wisdom, mountain metaphors, and djigit spirit
 */

export interface CaucasusQuote {
  ru: string
  en: string
  author?: string
}

export interface CaucasusPhrase {
  ru: string
  en: string
}

/**
 * Traditional Caucasian and Ingush proverbs
 */
export const caucasusProverbs: CaucasusQuote[] = [
  {
    ru: "Орел не охотится на мух",
    en: "The eagle does not hunt flies"
  },
  {
    ru: "Кто не поднимался в горы, тот не знает равнины",
    en: "He who has not climbed mountains does not know the plains"
  },
  {
    ru: "Честь дороже жизни",
    en: "Honor is more precious than life"
  },
  {
    ru: "Гора не придет к тебе — иди сам к горе",
    en: "If the mountain won't come to you, go to the mountain yourself"
  },
  {
    ru: "Слово джигита — что башня в горах: стоит веками",
    en: "A djigit's word is like a tower in the mountains: it stands for centuries"
  },
  {
    ru: "Высокая гора начинается с камня",
    en: "A high mountain begins with a stone"
  },
  {
    ru: "Даже самый быстрый конь не догонит слово",
    en: "Even the fastest horse cannot catch up with a word"
  },
  {
    ru: "Вершина открывается тому, кто идет в гору, а не смотрит на нее",
    en: "The summit reveals itself to those who climb, not to those who stare"
  },
  {
    ru: "Где нет трудностей, там нет и пути",
    en: "Where there are no difficulties, there is no path"
  },
  {
    ru: "Свобода — как воздух в горах: без нее не дышать",
    en: "Freedom is like mountain air: you cannot breathe without it"
  },
  {
    ru: "Терпение и труд превращают камень в крепость",
    en: "Patience and labor turn stone into a fortress"
  },
  {
    ru: "Сильный не тот, кто побеждает других, а тот, кто побеждает себя",
    en: "Strong is not the one who defeats others, but the one who defeats himself"
  },
  {
    ru: "В горах узнаешь друга, в беде — брата",
    en: "In the mountains you know a friend, in trouble — a brother"
  },
  {
    ru: "Башня не падает от одного удара, человек — от одной беды",
    en: "A tower does not fall from one blow, nor does a man from one misfortune"
  },
  {
    ru: "Лучше один раз увидеть вершину, чем сто раз услышать о ней",
    en: "Better to see the summit once than to hear about it a hundred times"
  },
  {
    ru: "Стойкость камня — в его основании, стойкость человека — в его духе",
    en: "The strength of stone lies in its foundation, the strength of man in his spirit"
  },
  {
    ru: "Путь в тысячу шагов начинается с одного",
    en: "A journey of a thousand steps begins with one"
  },
  {
    ru: "Не тот храбр, кто не знает страха, а тот, кто его преодолевает",
    en: "Brave is not one who knows no fear, but one who overcomes it"
  },
  {
    ru: "Ветер гонит облака, но не сдвинет гору",
    en: "Wind chases clouds, but will not move a mountain"
  },
  {
    ru: "Достоинство не в богатстве, а в чести",
    en: "Dignity is not in wealth, but in honor"
  }
]

/**
 * Warrior and djigit wisdom
 */
export const djigitQuotes: CaucasusQuote[] = [
  {
    ru: "Настоящий джигит находит силу не в гневе, а в спокойствии",
    en: "A true djigit finds strength not in anger, but in calmness"
  },
  {
    ru: "Воин живет не для себя, а для своего народа",
    en: "A warrior lives not for himself, but for his people"
  },
  {
    ru: "Меч защищает тело, честь защищает душу",
    en: "The sword protects the body, honor protects the soul"
  },
  {
    ru: "Достоинство воина — в его слове и деле",
    en: "A warrior's dignity is in his word and deed"
  },
  {
    ru: "Сильный духом не нуждается в громких словах",
    en: "The strong in spirit need no loud words"
  },
  {
    ru: "Настоящая храбрость — это уважение к противнику",
    en: "True courage is respect for the opponent"
  },
  {
    ru: "Благородство не в победе, а в том, как ты ее достиг",
    en: "Nobility is not in victory, but in how you achieved it"
  },
  {
    ru: "Джигит держит слово даже перед врагом",
    en: "A djigit keeps his word even to an enemy"
  },
  {
    ru: "Тот, кто контролирует себя, контролирует свою судьбу",
    en: "He who controls himself controls his destiny"
  },
  {
    ru: "Сила без мудрости — что меч без рукояти",
    en: "Strength without wisdom is like a sword without a handle"
  },
  {
    ru: "Цель воина — не разрушение, а защита",
    en: "The warrior's goal is not destruction, but protection"
  },
  {
    ru: "В бою проверяется сила, в мире — характер",
    en: "In battle, strength is tested; in peace, character"
  },
  {
    ru: "Уважение завоевывается не силой, а достоинством",
    en: "Respect is earned not by force, but by dignity"
  },
  {
    ru: "Настоящий воин сражается не со злом, а за добро",
    en: "A true warrior fights not against evil, but for good"
  },
  {
    ru: "Лучшая победа — та, которой можно было избежать",
    en: "The best victory is one that could have been avoided"
  }
]

/**
 * Tower-specific wisdom (based on authentic Ingush traditions)
 */
export const towerWisdom: CaucasusQuote[] = [
  {
    ru: "Башня строится годами, честь — всю жизнь",
    en: "A tower is built in years, honor — in a lifetime"
  },
  {
    ru: "Крепка башня камнями, крепка семья единством",
    en: "Strong is the tower with stones, strong is the family with unity"
  },
  {
    ru: "С вершины башни видно то, что скрыто внизу",
    en: "From the tower's peak you see what's hidden below"
  },
  {
    ru: "Каждый камень в башне несёт имя предка",
    en: "Every stone in the tower bears an ancestor's name"
  },
  {
    ru: "Башня без фундамента падёт, как воин без чести",
    en: "A tower without foundation falls, like a warrior without honor"
  },
  {
    ru: "Кто не построил башню за год, не достоин называться строителем",
    en: "Who cannot build a tower in a year is not worthy of being called a builder"
  },
  {
    ru: "Башня стоит веками, а слава о её строителе — вечно",
    en: "The tower stands for centuries, but the fame of its builder — forever"
  }
]

/**
 * Short motivational phrases for focus
 */
export const caucasusPhrases: CaucasusPhrase[] = [
  {
    ru: "Будь стоек, как башни предков",
    en: "Be steadfast like the towers of ancestors"
  },
  {
    ru: "Свобода начинается с дисциплины",
    en: "Freedom begins with discipline"
  },
  {
    ru: "Вершина ждет тебя",
    en: "The summit awaits you"
  },
  {
    ru: "Твой дух сильнее любого отвлечения",
    en: "Your spirit is stronger than any distraction"
  },
  {
    ru: "Каждый шаг приближает к цели",
    en: "Every step brings you closer to your goal"
  },
  {
    ru: "Сосредоточься, как орел перед полетом",
    en: "Focus like an eagle before flight"
  },
  {
    ru: "Контроль — это свобода",
    en: "Control is freedom"
  },
  {
    ru: "Гора не торопится, но всегда достигает неба",
    en: "The mountain does not hurry, yet always reaches the sky"
  },
  {
    ru: "Твоя воля — твоя крепость",
    en: "Your will is your fortress"
  },
  {
    ru: "Достоинство в каждом выборе",
    en: "Dignity in every choice"
  }
]

/**
 * Get random proverb
 */
export function getRandomProverb(): CaucasusQuote {
  return caucasusProverbs[Math.floor(Math.random() * caucasusProverbs.length)]
}

/**
 * Get random djigit quote
 */
export function getRandomDjigitQuote(): CaucasusQuote {
  return djigitQuotes[Math.floor(Math.random() * djigitQuotes.length)]
}

/**
 * Get random motivational phrase
 */
export function getRandomPhrase(): CaucasusPhrase {
  return caucasusPhrases[Math.floor(Math.random() * caucasusPhrases.length)]
}

/**
 * Get random tower wisdom
 */
export function getRandomTowerWisdom(): CaucasusQuote {
  return towerWisdom[Math.floor(Math.random() * towerWisdom.length)]
}

/**
 * Get combined random quote (from all sources)
 */
export function getRandomCaucasusWisdom(): CaucasusQuote {
  const allQuotes = [...caucasusProverbs, ...djigitQuotes, ...towerWisdom]
  return allQuotes[Math.floor(Math.random() * allQuotes.length)]
}
