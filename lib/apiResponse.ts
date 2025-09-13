import { NextResponse } from 'next/server'

export const ok = (data: any, status = 200) =>
  NextResponse.json({ ok: true, data }, { status })

export const fail = (
  code: string, 
  message: string, 
  status = 400, 
  details?: unknown
) =>
  NextResponse.json({ 
    ok: false, 
    code, 
    error: message, 
    details 
  }, { status })

// 편의 함수들
export const unauthorized = (message = 'UNAUTHORIZED') =>
  fail('UNAUTHORIZED', message, 401)

export const forbidden = (message = 'FORBIDDEN') =>
  fail('FORBIDDEN', message, 403)

export const notFound = (message = 'NOT_FOUND') =>
  fail('NOT_FOUND', message, 404)

export const serverError = (message = 'INTERNAL_ERROR', details?: unknown) =>
  fail('INTERNAL_ERROR', message, 500, details)

export const badRequest = (message: string, details?: unknown) =>
  fail('BAD_REQUEST', message, 400, details)