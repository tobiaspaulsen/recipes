import { createClient } from '@supabase/supabase-js'

export type RecipeDraft = {
  title: string
  servings: number | null
  prepMinutes: number | null
  cookMinutes: number | null
  ingredients: string[]
  steps: string[]
  sourceUrl: string
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type JsonObject = { [key: string]: Json }

const json = (body: unknown, status = 200) => Response.json(body, { status })
const fail = (status: number, error: string) => json({ error }, status)

export async function POST(request: Request) {
  // The Supabase URL and publishable key are public; Vercel needs them as project env vars at runtime.
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) return fail(500, 'Serveren mangler Supabase-oppsett.')

  const token = request.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token) return fail(401, 'Ikke logget inn.')
  const { data, error } = await createClient(supabaseUrl, supabaseKey).auth.getUser(token)
  if (error || !data.user) return fail(401, 'Ikke logget inn.')

  const { url } = (await request.json().catch(() => ({}))) as { url?: unknown }
  const pageUrl = typeof url === 'string' ? parseUrl(url.trim()) : null
  if (!pageUrl) return fail(400, 'Det ser ikke ut som en lenke.')

  let html: string
  try {
    const page = await fetch(pageUrl, {
      headers: {
        // Several recipe sites turn away requests that don't look like a browser.
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'nb-NO,nb;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    })
    if (!page.ok) return fail(502, `Siden svarte med feil (${page.status}).`)
    html = await page.text()
  } catch {
    return fail(502, 'Fikk ikke hentet siden.')
  }

  const recipe = extractRecipe(html, pageUrl.href)
  if (!recipe) return fail(422, 'Fant ingen oppskrift på siden.')
  return json(recipe)
}

function parseUrl(text: string) {
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

export function extractRecipe(html: string, sourceUrl: string): RecipeDraft | null {
  const scripts = html.matchAll(/<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)
  for (const [, body] of scripts) {
    let parsed: Json
    try {
      parsed = JSON.parse(body.trim())
    } catch {
      continue
    }
    const found = findRecipe(parsed)
    if (found) return toDraft(found, sourceUrl)
  }
  return null
}

function findRecipe(node: Json): JsonObject | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipe(item)
      if (found) return found
    }
    return null
  }
  if (!node || typeof node !== 'object') return null
  const type = node['@type']
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return node
  return findRecipe(node['@graph'] ?? null)
}

function toDraft(recipe: JsonObject, sourceUrl: string): RecipeDraft | null {
  const title = text(recipe.name)
  if (!title) return null
  const prepMinutes = minutes(recipe.prepTime)
  const cookMinutes = minutes(recipe.cookTime)
  return {
    title,
    servings: servings(recipe.recipeYield),
    prepMinutes,
    // Some sites only give a total time.
    cookMinutes: prepMinutes === null && cookMinutes === null ? minutes(recipe.totalTime) : cookMinutes,
    ingredients: list(recipe.recipeIngredient).map(text).filter(Boolean),
    steps: steps(recipe.recipeInstructions),
    sourceUrl,
  }
}

const list = (value: Json | undefined): Json[] => (Array.isArray(value) ? value : value == null ? [] : [value])

function text(value: Json | undefined): string {
  if (typeof value === 'number') return String(value)
  if (typeof value !== 'string') return ''
  return decodeEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity
    }
    return ENTITIES[code.toLowerCase()] ?? entity
  })
}

// recipeInstructions is a string, a list of strings, HowToSteps, or HowToSections holding HowToSteps.
function steps(value: Json | undefined): string[] {
  return list(value).flatMap((item): string[] => {
    if (typeof item === 'string') {
      return item.includes('\n') ? item.split(/\n+/).map(text).filter(Boolean) : [text(item)].filter(Boolean)
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    if (item.itemListElement) return steps(item.itemListElement)
    return [text(item.text ?? item.name)].filter(Boolean)
  })
}

function servings(value: Json | undefined) {
  for (const item of list(value)) {
    const match = text(item).match(/\d+/)
    if (match) return Math.min(50, Math.max(1, Number(match[0])))
  }
  return null
}

// ISO 8601 durations such as "PT1H30M" or "P0DT45M".
function minutes(value: Json | undefined) {
  const match = typeof value === 'string' ? value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/i) : null
  if (!match) return null
  const total = Number(match[1] ?? 0) * 1440 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
  return total > 0 ? total : null
}
