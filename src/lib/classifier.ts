import type { ExpenseCategory } from '../types'

const NEED_KEYWORDS = [
  'rent', 'housing', 'mortgage', 'utility', 'utilities', 'electric', 'electricity',
  'water', 'gas bill', 'internet', 'data', 'airtime', 'groceries', 'grocery',
  'food essentials', 'medicine', 'medical', 'pharmacy', 'hospital', 'health',
  'transport', 'bus', 'fuel', 'petrol', 'diesel', 'uber work', 'taxi work',
  'school fee', 'tuition', 'education', 'books', 'bill', 'bills', 'insurance',
  'tax', 'maintenance', 'repair essential', 'childcare', 'baby essentials',
  'toiletries', 'soap', 'detergent', 'rice', 'beans', 'staple',
]

const WANT_KEYWORDS = [
  'restaurant', 'dining', 'takeout', 'takeaway', 'fast food', 'coffee', 'cafe',
  'cinema', 'movie', 'netflix', 'spotify', 'subscription', 'gaming', 'game',
  'clothes', 'clothing', 'shoes', 'fashion', 'hair', 'salon', 'barber',
  'beauty', 'cosmetics', 'makeup', 'hobby', 'concert', 'event', 'outing',
  'weekend', 'snack', 'snacks', 'chocolate', 'ice cream', 'delivery',
  'shopping', 'amazon', 'jumia', 'gadget accessory',
]

const UNNECESSARY_KEYWORDS = [
  'luxury', 'designer', 'gambling', 'bet', 'betting', 'casino', 'lottery',
  'alcohol', 'beer', 'wine', 'club', 'nightclub', 'impulse', 'splurge',
  'unnecessary', 'waste', 'extravagant', 'jewelry', 'jewellery', 'watch luxury',
  'latest phone', 'upgrade phone', 'status', 'vanity', 'branded', 'premium excess',
  'onlyfans', 'vape', 'smoking', 'cigarette', 'hookah', 'party excess',
]

function matchesKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

export function classifyExpense(type: string, notes: string): ExpenseCategory {
  const combined = `${type} ${notes}`.trim()

  if (matchesKeyword(combined, UNNECESSARY_KEYWORDS)) {
    return 'unnecessary'
  }

  if (matchesKeyword(combined, NEED_KEYWORDS)) {
    return 'need'
  }

  if (matchesKeyword(combined, WANT_KEYWORDS)) {
    return 'want'
  }

  const amountHint = combined.match(/\b(\d+)\b/)
  if (amountHint) {
    const num = parseInt(amountHint[1], 10)
    if (num > 50000) return 'want'
  }

  const casualPatterns = [
    'fun', 'treat', 'reward', 'just because', 'random', 'bored',
    'craving', 'want', 'nice to have', 'extra', 'bonus spend',
  ]
  if (casualPatterns.some((p) => combined.toLowerCase().includes(p))) {
    return 'unnecessary'
  }

  if (type.trim().length > 0 && notes.trim().length === 0) {
    return 'want'
  }

  return 'want'
}

export function categoryLabel(category: ExpenseCategory): string {
  switch (category) {
    case 'need':
      return 'Need'
    case 'want':
      return 'Want'
    case 'unnecessary':
      return 'Unnecessary'
  }
}

export function categoryColor(category: ExpenseCategory): string {
  switch (category) {
    case 'need':
      return 'green'
    case 'want':
      return 'yellow'
    case 'unnecessary':
      return 'red'
  }
}
