import { supabase } from './supabase'

// Mirrors RecipeDraft in api/import-url.ts.
export type RecipeDraft = {
  title: string
  servings: number | null
  prepMinutes: number | null
  cookMinutes: number | null
  ingredients: string[]
  steps: string[]
  sourceUrl: string
}

export async function importFromUrl(url: string): Promise<RecipeDraft> {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error('Du må være logget inn.')

  let response: Response
  try {
    response = await fetch('/api/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ url }),
    })
  } catch {
    throw new Error('Fikk ikke kontakt. Sjekk nettet og prøv igjen.')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error ?? 'Noe gikk galt. Prøv igjen.')
  return body as RecipeDraft
}

export const siteName = (url: string) => new URL(url).hostname.replace(/^www\./, '')
