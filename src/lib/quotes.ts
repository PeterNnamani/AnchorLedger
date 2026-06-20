export interface Quote {
  text: string
  author: string
}

export const QUOTES: Quote[] = [
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Hard times create strong men. Strong men create good times.', author: 'G. Michael Hopf' },
  { text: 'The successful warrior is the average man, with laser-like focus.', author: 'Bruce Lee' },
  { text: 'A man who conquers himself is greater than one who conquers a thousand men in battle.', author: 'Buddha' },
  { text: 'It is not the mountain we conquer but ourselves.', author: 'Edmund Hillary' },
  { text: 'Do not pray for an easy life, pray for the strength to endure a difficult one.', author: 'Bruce Lee' },
  { text: 'The harder you work for something, the greater you will feel when you achieve it.', author: 'Unknown' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
  { text: 'Discipline equals freedom.', author: 'Jocko Willink' },
  { text: 'A real man provides, protects, and perseveres no matter the cost.', author: 'Unknown' },
  { text: 'Money grows where attention and discipline are planted.', author: 'Unknown' },
  { text: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche' },
  { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
  { text: 'Wealth is the slave of a wise man and the master of a fool.', author: 'Seneca' },
  { text: 'Comfort is the enemy of progress.', author: 'P.T. Barnum' },
  { text: 'Spend not where you may save; spare not where you must spend.', author: 'John Ray' },
  { text: 'Beware of little expenses; a small leak will sink a great ship.', author: 'Benjamin Franklin' },
  { text: 'The strong man is the one who is able to control himself when he is angry.', author: 'Prophet Muhammad' },
  { text: 'A budget is telling your money where to go instead of wondering where it went.', author: 'Dave Ramsey' },
  { text: 'Persistence and resilience only come from having been given the chance to work through difficult problems.', author: 'Gever Tulley' },
  { text: 'Either you run the day or the day runs you.', author: 'Jim Rohn' },
  { text: 'Do what is hard now, and life will be easy. Do what is easy now, and life will be hard.', author: 'Les Brown' },
  { text: 'A goal without a plan is just a wish. Build, then guard your gains.', author: 'Antoine de Saint-Exupery' },
  { text: 'Train yourself to let go of everything you fear to lose, except your discipline.', author: 'Unknown' },
  { text: 'The man on top of the mountain did not fall there.', author: 'Vince Lombardi' },
  { text: 'Save money and money will save you.', author: 'Jamaican Proverb' },
  { text: 'Courage is not the absence of fear, but the triumph over it.', author: 'Nelson Mandela' },
  { text: 'Sweat saves blood; planning saves regret.', author: 'Erwin Rommel' },
  { text: 'What you do today can improve all your tomorrows.', author: 'Ralph Marston' },
  { text: 'Be steadfast like a rock; the storm will pass but the rock remains.', author: 'Unknown' },
  { text: 'Earn with your head, guard with your habits.', author: 'Unknown' },
]

/** Returns a deterministic day-of-year index so the quote is stable for a calendar day. */
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getDailyQuote(date: Date = new Date()): Quote {
  const index = dayOfYear(date) % QUOTES.length
  return QUOTES[index]
}
