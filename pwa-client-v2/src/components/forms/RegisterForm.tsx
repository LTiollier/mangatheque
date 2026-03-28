'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/error';
import { FormField } from './FormField';

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
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  function onSubmit(data: RegisterFormValues) {
    startTransition(async () => {
      try {
        const { user } = await authService.register(data);
        login(user);
        toast.success(`Bienvenue, ${user.name} !`);
        router.push('/collection');
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Erreur lors de la création du compte'));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <FormField
        label="Nom"
        type="text"
        placeholder="Votre nom"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />

      <FormField
        label="Email"
        type="email"
        placeholder="vous@exemple.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <FormField
        label="Mot de passe"
        type="password"
        placeholder="Minimum 8 caractères"
        autoComplete="new-password"
        hint="8 caractères minimum"
        error={errors.password?.message}
        {...register('password')}
      />

      <FormField
        label="Confirmation"
        type="password"
        placeholder="Répétez le mot de passe"
        autoComplete="new-password"
        error={errors.password_confirmation?.message}
        {...register('password_confirmation')}
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 flex items-center justify-center gap-2 rounded text-sm font-semibold transition-opacity disabled:opacity-60 mt-1"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: 'var(--radius)',
        }}
      >
        {isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {isPending ? 'Création…' : 'Créer mon compte'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Déjà un compte ?{' '}
        <Link
          href="/login"
          className="font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--primary)' }}
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
