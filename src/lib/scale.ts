import type { Ingredient } from './useRecipes'

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' }
const COUNTED_UNITS = new Set(['stk', 'fedd', 'boks', 'pakke', 'beger'])

function roundTo(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step)
}

function decimal(value: number) {
  return String(Math.round(value * 100) / 100).replace('.', ',')
}

function withFraction(value: number) {
  const whole = Math.floor(value)
  const fraction = FRACTIONS[String(Math.round((value - whole) * 100) / 100)]
  if (fraction) return whole ? `${whole}${fraction}` : fraction
  return decimal(value)
}

export function scaleQuantity(quantity: number, fromServings: number, toServings: number) {
  return (quantity * toServings) / fromServings
}

export function formatAmount(quantity: number, unit: string | null) {
  // Scaled kg and l are rounded in g and dl, so ½ kg for 6 instead of 5 shows 600 g, not ½ kg.
  if (unit === 'kg') return formatAmount(quantity * 1000, 'g')
  if (unit === 'l') return formatAmount(quantity * 10, 'dl')
  if (unit === 'g') {
    const grams = quantity >= 100 ? roundTo(quantity, 10) : roundTo(quantity, 1)
    return grams >= 1000 ? `${decimal(grams / 1000)} kg` : `${grams} g`
  }
  if (unit === 'dl' && quantity >= 10) return `${decimal(roundTo(quantity, 1) / 10)} l`

  const counted = unit === null || COUNTED_UNITS.has(unit)
  const amount = withFraction(roundTo(quantity, counted ? 0.5 : 0.25))
  return unit ? `${amount} ${unit}` : amount
}

export function ingredientAmount(ingredient: Ingredient, fromServings: number, toServings: number) {
  if (ingredient.quantity === null) return ''
  return formatAmount(scaleQuantity(ingredient.quantity, fromServings, toServings), ingredient.unit)
}

export function shoppingName(ingredient: Ingredient, fromServings: number, toServings: number) {
  return [ingredientAmount(ingredient, fromServings, toServings), ingredient.name].filter(Boolean).join(' ')
}

export const UNITS = ['g', 'kg', 'dl', 'l', 'ss', 'ts', 'krm', 'stk', 'fedd', 'boks', 'pakke', 'beger', 'klype', 'neve']

const UNICODE_FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }

// Reads "2", "1,5", "1.5", "1/2", "1 1/2" and "1½". Null means empty; undefined means it couldn't be read.
export function parseQuantity(text: string): number | null | undefined {
  const value = text.trim().replace(',', '.')
  if (!value) return null
  const match = value.match(/^(\d+(?:\.\d+)?)?\s*(?:(\d+)\/(\d+)|([½¼¾⅓⅔]))?$/)
  if (!match || (!match[1] && !match[2] && !match[4])) return undefined
  const whole = match[1] ? Number(match[1]) : 0
  const fraction = match[2] ? Number(match[2]) / Number(match[3]) : match[4] ? UNICODE_FRACTIONS[match[4]] : 0
  const quantity = whole + fraction
  return quantity > 0 && Number.isFinite(quantity) ? quantity : undefined
}
