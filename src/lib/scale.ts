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
  if (unit === 'g') {
    const grams = quantity >= 100 ? roundTo(quantity, 10) : roundTo(quantity, 1)
    return grams >= 1000 ? `${decimal(grams / 1000)} kg` : `${grams} g`
  }
  if (unit === 'dl' && quantity >= 10) return `${decimal(roundTo(quantity, 1) / 10)} l`

  const counted = unit === null || COUNTED_UNITS.has(unit)
  const amount = withFraction(roundTo(quantity, counted ? 0.5 : 0.25))
  return unit ? `${amount} ${unit}` : amount
}
