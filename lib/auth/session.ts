import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function getHostSession(request?: NextRequest) {
  const supabase = createServerSupabaseClient()
  
  try {
    // For API routes, try to get user from auth header or session
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get host data
    const { data: hostData, error: hostError } = await supabase
      .from('hosts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (hostError || !hostData) {
      return null
    }

    return {
      user,
      host: hostData
    }
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

export async function requireHostAuth() {
  const session = await getHostSession()
  
  if (!session) {
    throw new Error('Unauthorized - Host authentication required')
  }
  
  return session
}

export async function getUser() {
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}