'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'
import { AuthResponseSchema } from '@/schemas/auth'
import type { User } from '@/types/auth'

// Private env var (not exposed to client bundle) — falls back to NEXT_PUBLIC for local dev
function getApiUrl(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  const normalized = base.replace(/\/$/, '')
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
}

// ─── Schemas (server-side validation — input never reaches the API if invalid) ─

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

const registerSchema = z
  .object({
    name: z.string().min(2, 'Minimum 2 caractères').max(100),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirmation'],
  })

// ─── Return type — client receives user + token (token stored in localStorage) ─

export interface AuthActionResult {
  user: User
  token: string
}

// ─── Shared fetch helper ───────────────────────────────────────────────────────

async function callAuthApi(
  endpoint: string,
  payload: Record<string, string>,
): Promise<AuthActionResult> {
  const res = await fetch(`${getApiUrl()}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      body.message ??
      (res.status === 401 || res.status === 422
        ? 'Email ou mot de passe incorrect'
        : 'Erreur de connexion')
    throw new Error(message)
  }

  const validated = AuthResponseSchema.safeParse(body)
  if (!validated.success) throw new Error('Réponse serveur inattendue')

  // HTTP-only server cookie — lets settings Server Actions call the API
  // without the client needing to pass the token as a parameter
  const cookieStore = await cookies()
  cookieStore.set('auth_token', validated.data.token, AUTH_COOKIE_OPTIONS)

  return { user: validated.data.user, token: validated.data.token }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function loginAction(email: string, password: string): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)
  return callAuthApi('/auth/login', parsed.data)
}

export async function registerAction(
  name: string,
  email: string,
  password: string,
  password_confirmation: string,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse({ name, email, password, password_confirmation })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)
  return callAuthApi('/auth/register', parsed.data as Record<string, string>)
}

export async function clearAuthCookieAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}
