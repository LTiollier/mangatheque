'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'
import type { User } from '@/types/auth'

function getApiUrl(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  const normalized = base.replace(/\/$/, '')
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

// Reads the HTTP-only cookie set by loginAction/registerAction
// — the token never transits as a visible parameter from the client
async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  return token
}

async function patchApi(endpoint: string, payload: unknown): Promise<{ data: User }> {
  const token = await getAuthToken()
  const res = await fetch(`${getApiUrl()}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.message ?? 'Erreur lors de la mise à jour')
  return body
}

// ─── Profile (username / is_public / theme / palette) ─────────────────────────

const profileSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_]*$/, 'Seuls les lettres, chiffres et underscores sont autorisés')
    .max(20, 'Le pseudo ne peut pas dépasser 20 caractères')
    .refine((v) => v === '' || v.length >= 3, {
      message: 'Le pseudo doit faire au moins 3 caractères',
    }),
  is_public: z.boolean(),
  theme: z.string(),
  palette: z.string(),
  notify_planning_releases: z.boolean(),
  view_mode_mobile: z.enum(['cover', 'list']),
  view_mode_desktop: z.enum(['cover', 'list']),
})

export async function updateProfileAction(data: {
  username: string | null
  is_public: boolean
  theme: string
  palette: string
  notify_planning_releases: boolean
  view_mode_mobile: 'cover' | 'list'
  view_mode_desktop: 'cover' | 'list'
}): Promise<User> {
  const parsed = profileSchema.safeParse({ ...data, username: data.username ?? '' })
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const body = await patchApi('/user/settings', {
    ...parsed.data,
    username: parsed.data.username.trim() || null,
  })
  return body.data
}

// ─── Email ────────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('Email invalide'),
  current_password: z.string().min(1, 'Mot de passe requis'),
})

export async function updateEmailAction(data: {
  email: string
  current_password: string
}): Promise<User> {
  const parsed = emailSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const body = await patchApi('/user/settings/email', parsed.data)
  return body.data
}

// ─── Password ─────────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Mot de passe actuel requis'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirmation'],
  })

export async function updatePasswordAction(data: {
  current_password: string
  password: string
  password_confirmation: string
}): Promise<void> {
  const parsed = passwordSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  await patchApi('/user/settings/password', parsed.data)
}
