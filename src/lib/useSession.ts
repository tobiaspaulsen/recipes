import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  // Offline with an expired access token, getSession() returns null even though the
  // stored login is still good; keep the app open and let auto-refresh catch up later.
  const [offline, setOffline] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      setSession(data.session)
      setOffline(!data.session && isAuthRetryableFetchError(error))
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (next || event === 'SIGNED_OUT') setOffline(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return { session, signedIn: !!session || offline, loading }
}
