'use client'

import { createClient } from '@/lib/supabase/client'

const supa = createClient()

function readCsrf() {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find((r) => r.startsWith('csrf-token='))
    ?.split('=')[1]
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const { data: { session } } = await supa.auth.getSession()
  const token = session?.access_token
  const csrf = readCsrf()

  return fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    },
    credentials: 'include',
  })
}

export async function apiRequest<T = any>(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(input, init)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error ${response.status}: ${error}`)
  }

  return response.json()
}